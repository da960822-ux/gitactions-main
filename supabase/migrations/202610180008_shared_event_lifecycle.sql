-- Shared drawings/patterns exist only in this expiring session; no room/chat tables are touched.
alter table public.event_session_members add column last_seen_at timestamptz not null default now();

create function public.refresh_event_session(p_session uuid) returns jsonb
language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid(); session public.event_sessions; assigned text; current_state jsonb; status text; clock_ms bigint; deadline bigint;
begin
 if actor is null then raise exception 'authentication_required'; end if;
 select * into session from public.event_sessions where id=p_session for update;
 if not found or session.expires_at<=now() then raise exception 'event_session_unavailable'; end if;
 update public.event_session_members set last_seen_at=now() where session_id=p_session and user_id=actor returning seat into assigned;
 if not found then raise exception 'event_session_unavailable'; end if;
 current_state:=session.event_state; status:=current_state->>'status';
 clock_ms:=floor(extract(epoch from clock_timestamp())*1000);
 if status='proposed' then
  deadline:=(current_state->>'expiresAt')::bigint;
  if clock_ms>=deadline then status:='expired';
  elsif clock_ms>=deadline-8000 and exists(select 1 from public.event_session_members where session_id=p_session and last_seen_at<now()-interval '12 seconds') then status:='cancelled';
  end if;
 elsif status='scheduled' then
  if exists(select 1 from public.event_session_members where session_id=p_session and last_seen_at<now()-interval '12 seconds') then status:='cancelled';
  elsif clock_ms>=(current_state->>'startAt')::bigint then status:='started';
  end if;
 end if;
 if status is distinct from current_state->>'status' then
  current_state:=current_state||jsonb_build_object('status',status,'revision',session.revision+1,'readyBy','{}'::jsonb,'confirmBy','{}'::jsonb,'ackBy','{}'::jsonb);
  if status='started' then current_state:=current_state||jsonb_build_object('lastStartedAt',current_state->'startAt');
  else current_state:=current_state||jsonb_build_object('startAt',null); end if;
  update public.event_sessions set revision=revision+1,event_state=current_state where id=p_session returning * into session;
 end if;
 return jsonb_build_object('sessionId',session.id,'seat',assigned,'revision',session.revision,'eventState',current_state,'expiresAt',session.expires_at,'serverNow',clock_ms,'memberCount',(select count(*) from public.event_session_members where session_id=p_session));
end $$;

create function public.pause_event_session(p_session uuid) returns void
language plpgsql security definer set search_path=public as $$
declare session public.event_sessions;
begin
 select * into session from public.event_sessions where id=p_session for update;
 if not found or session.expires_at<=now() or not exists(select 1 from public.event_session_members where session_id=p_session and user_id=auth.uid()) then raise exception 'event_session_unavailable'; end if;
 update public.event_session_members set last_seen_at=now()-interval '1 hour' where session_id=p_session and user_id=auth.uid();
 if session.event_state->>'status' in ('proposed','scheduled') then
  update public.event_sessions set revision=revision+1,event_state=event_state||jsonb_build_object('revision',revision+1,'status','cancelled','startAt',null,'readyBy','{}'::jsonb,'confirmBy','{}'::jsonb,'ackBy','{}'::jsonb) where id=p_session;
 end if;
end $$;

create function public.close_event_session(p_session uuid) returns void
language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from public.event_session_members where session_id=p_session and user_id=auth.uid()) then raise exception 'event_session_unavailable'; end if;
 -- Either member can end sharing and delete the session's drawing, patterns and receipts.
 delete from public.event_sessions where id=p_session;
end $$;

create or replace function public.read_event_session_for_action(p_session uuid,p_verified_actor uuid) returns jsonb
language plpgsql set search_path=public as $$
declare session record;
begin
 if p_session is null or p_verified_actor is null then raise exception 'invalid_event_request'; end if;
 update public.event_session_members set last_seen_at=now() where session_id=p_session and user_id=p_verified_actor;
 select s.id as session_id,m.seat,s.revision,s.event_state,s.expires_at into session
 from public.event_sessions s join public.event_session_members m on m.session_id=s.id
 where s.id=p_session and m.user_id=p_verified_actor and s.expires_at>now();
 if not found then raise exception 'event_session_unavailable'; end if;
 return jsonb_build_object('sessionId',session.session_id,'seat',session.seat,'revision',session.revision,'eventState',session.event_state,'expiresAt',session.expires_at,'serverNow',floor(extract(epoch from clock_timestamp())*1000),'memberCount',(select count(*) from public.event_session_members where session_id=p_session));
end $$;

revoke all on function public.refresh_event_session(uuid),public.pause_event_session(uuid),public.close_event_session(uuid) from public,anon,authenticated;
grant execute on function public.refresh_event_session(uuid),public.pause_event_session(uuid),public.close_event_session(uuid) to authenticated;

-- Only state and membership invalidations are published. Drawings never enter a public channel.
alter publication supabase_realtime add table public.event_sessions;
alter publication supabase_realtime add table public.event_session_members;
