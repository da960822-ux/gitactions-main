create table public.event_sessions (
 id uuid primary key default gen_random_uuid(),
 created_by uuid not null references auth.users on delete cascade,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '1 hour',
 invite_open boolean not null default true,
 revision bigint not null default 0 check(revision>=0),
 event_state jsonb
);
create table public.event_session_members (
 session_id uuid not null references public.event_sessions on delete cascade,
 user_id uuid not null references auth.users on delete cascade,
 seat text not null check(seat in ('p1','p2')),
 primary key(session_id,user_id),
 unique(session_id,seat)
);
create table public.event_session_receipts (
 session_id uuid not null references public.event_sessions on delete cascade,
 request_id uuid not null,
 user_id uuid not null references auth.users on delete cascade,
 revision bigint not null check(revision>=0),
 signature jsonb not null,
 created_at timestamptz not null default now(),
 primary key(session_id,request_id)
);
create index event_sessions_creator_expiry on public.event_sessions(created_by,expires_at);

create function public.is_event_session_member(p_session uuid) returns boolean
language sql stable security definer set search_path=public as $$
 select exists(
  select 1 from public.event_session_members m
  join public.event_sessions s on s.id=m.session_id
  where m.session_id=p_session and m.user_id=auth.uid() and s.expires_at>now()
 )
$$;

alter table public.event_sessions enable row level security;
alter table public.event_session_members enable row level security;
alter table public.event_session_receipts enable row level security;
create policy read_live_event_sessions on public.event_sessions for select to authenticated using(public.is_event_session_member(id));
create policy read_live_event_members on public.event_session_members for select to authenticated using(public.is_event_session_member(session_id));

revoke all on public.event_sessions,public.event_session_members,public.event_session_receipts from public,anon,authenticated;
grant select on public.event_sessions,public.event_session_members to authenticated;
grant all on public.event_sessions,public.event_session_members,public.event_session_receipts to service_role;

create function public.create_event_session() returns uuid language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid(); created uuid;
begin
 if actor is null then raise exception 'authentication_required'; end if;
 -- Serialize this user's cap check without locking or changing game-room data.
 perform 1 from auth.users where id=actor for update;
 if not found then raise exception 'authentication_required'; end if;
 if (select count(*) from public.event_sessions where created_by=actor and expires_at>now())>=3 then
  raise exception 'event_session_limit';
 end if;
 insert into public.event_sessions(created_by) values(actor) returning id into created;
 insert into public.event_session_members(session_id,user_id,seat) values(created,actor,'p1');
 return created;
end $$;

create function public.join_event_session(p_session uuid) returns text language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid(); session public.event_sessions; assigned text;
begin
 if actor is null then raise exception 'authentication_required'; end if;
 select * into session from public.event_sessions where id=p_session for update;
 if not found or session.expires_at<=now() then raise exception 'event_session_expired'; end if;
 select seat into assigned from public.event_session_members where session_id=p_session and user_id=actor;
 if found then return assigned; end if;
 if not session.invite_open then raise exception 'event_invite_closed'; end if;
 if (select count(*) from public.event_session_members where session_id=p_session)>=2 then raise exception 'event_session_full'; end if;
 assigned:=case when exists(select 1 from public.event_session_members where session_id=p_session and seat='p1') then 'p2' else 'p1' end;
 insert into public.event_session_members(session_id,user_id,seat) values(p_session,actor,assigned);
 update public.event_sessions set invite_open=false where id=p_session;
 return assigned;
end $$;

create function public.event_session_snapshot(p_session uuid) returns jsonb language plpgsql stable security definer set search_path=public as $$
declare session record;
begin
 select s.id as session_id,m.seat,s.revision,s.event_state,s.expires_at into session
 from public.event_sessions s join public.event_session_members m on m.session_id=s.id
 where s.id=p_session and m.user_id=auth.uid() and s.expires_at>now();
 if not found then raise exception 'event_session_unavailable'; end if;
 return jsonb_build_object('sessionId',session.session_id,'seat',session.seat,'revision',session.revision,'eventState',session.event_state,'expiresAt',session.expires_at);
end $$;

revoke all on function public.is_event_session_member(uuid),public.create_event_session(),public.join_event_session(uuid),public.event_session_snapshot(uuid) from public,anon,authenticated;
grant execute on function public.is_event_session_member(uuid),public.create_event_session(),public.join_event_session(uuid),public.event_session_snapshot(uuid) to authenticated;

select cron.schedule('shared-event-session-five-minute-cleanup','*/5 * * * *',$$delete from public.event_sessions where expires_at<=now();$$);
