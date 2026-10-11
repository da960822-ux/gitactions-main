create extension if not exists pgcrypto;

create table public.rooms (
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '7 days', game_id text,
 version bigint not null default 0, pending_game text, pending_by uuid
);
create table public.room_members (
 room_id uuid references public.rooms on delete cascade, user_id uuid references auth.users on delete cascade,
 seat text not null check(seat in ('p1','p2')), nickname text not null check(length(nickname) between 1 and 24),
 language text not null check(language in ('ko','es')), primary key(room_id,user_id), unique(room_id,seat)
);
create table public.room_states (room_id uuid primary key references public.rooms on delete cascade, state jsonb);
create table public.room_views (
 room_id uuid references public.rooms on delete cascade, user_id uuid references auth.users on delete cascade,
 version bigint not null, view jsonb, primary key(room_id,user_id)
);
create table public.chat_messages (
 id uuid primary key, room_id uuid not null references public.rooms on delete cascade,
 seat text not null check(seat in ('p1','p2')), text text not null check(length(text)<=500),
 created_at timestamptz not null default now(), translation text, target_language text check(target_language in ('ko','es')),
 status text not null default 'original' check(status in ('original','pending','processing','translated','limit','unavailable','correct'))
);
create table public.action_receipts (room_id uuid references public.rooms on delete cascade, request_id uuid, user_id uuid not null, version bigint not null, primary key(room_id,request_id));
create table public.translation_usage (month date primary key, reserved_chars bigint not null default 0 check(reserved_chars>=0));
create index chat_room_time on public.chat_messages(room_id,created_at);

create function public.is_room_member(p_room uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from room_members m join rooms r on r.id=m.room_id where m.room_id=p_room and m.user_id=auth.uid() and r.expires_at>now())
$$;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_states enable row level security;
alter table public.room_views enable row level security;
alter table public.chat_messages enable row level security;
alter table public.action_receipts enable row level security;
alter table public.translation_usage enable row level security;
create policy read_rooms on public.rooms for select to authenticated using(public.is_room_member(id));
create policy read_members on public.room_members for select to authenticated using(public.is_room_member(room_id));
create policy read_own_view on public.room_views for select to authenticated using(user_id=auth.uid() and public.is_room_member(room_id));
create policy read_chat on public.chat_messages for select to authenticated using(public.is_room_member(room_id) and created_at>now()-interval '7 days');
revoke all on public.rooms,public.room_members,public.room_states,public.room_views,public.chat_messages,public.action_receipts,public.translation_usage from anon,authenticated;
grant select on public.rooms,public.room_members,public.room_views,public.chat_messages to authenticated;

create function public.create_room(p_nickname text,p_language text) returns uuid language plpgsql security definer set search_path=public as $$
declare r uuid;
begin
 if auth.uid() is null then raise exception 'authentication_required'; end if;
 if length(trim(p_nickname)) not between 1 and 24 or p_language not in ('ko','es') then raise exception 'invalid_profile'; end if;
 if (select count(*) from room_members m join rooms r on m.room_id=r.id where user_id=auth.uid() and expires_at>now())>=3 then raise exception 'room_limit'; end if;
 insert into rooms default values returning id into r;
 insert into room_members values(r,auth.uid(),'p1',trim(p_nickname),p_language);
 insert into room_states values(r,null);
 insert into room_views values(r,auth.uid(),0,null);
 return r;
end $$;
create function public.join_room(p_room uuid,p_nickname text,p_language text) returns void language plpgsql security definer set search_path=public as $$
declare r public.rooms;
begin
 if auth.uid() is null then raise exception 'authentication_required'; end if;
 if length(trim(p_nickname)) not between 1 and 24 or p_language not in ('ko','es') then raise exception 'invalid_profile'; end if;
 select * into r from rooms where id=p_room for update;
 if not found or r.expires_at<=now() then raise exception 'room_expired'; end if;
 if exists(select 1 from room_members where room_id=p_room and user_id=auth.uid()) then return; end if;
 if (select count(*) from room_members where room_id=p_room)>=2 then raise exception 'room_full'; end if;
 insert into room_members values(p_room,auth.uid(),'p2',trim(p_nickname),p_language);
 insert into room_views values(p_room,auth.uid(),r.version,null);
end $$;
create function public.set_language(p_room uuid,p_language text) returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.is_room_member(p_room) or p_language not in ('ko','es') then raise exception 'invalid_profile'; end if;
 update room_members set language=p_language where room_id=p_room and user_id=auth.uid();
end $$;

-- Only the authenticated Edge function using the service-role key may commit game state.
create function public.commit_action(p_room uuid,p_user uuid,p_version bigint,p_request uuid,p_state jsonb,p_views jsonb,p_game text,p_pending text,p_pending_by uuid,p_chat jsonb default null)
returns bigint language plpgsql security definer set search_path=public as $$
declare r public.rooms; next_version bigint; member public.room_members; prior public.action_receipts;
begin
 select * into r from rooms where id=p_room for update;
 if not found or r.expires_at<=now() then raise exception 'room_expired'; end if;
 select * into member from room_members where room_id=p_room and user_id=p_user;
 if not found then raise exception 'not_room_member'; end if;
 select * into prior from action_receipts where room_id=p_room and request_id=p_request;
 if found then
  if prior.user_id<>p_user then raise exception 'invalid_request'; end if;
  return prior.version;
 end if;
 if r.version<>p_version then raise exception 'stale_state'; end if;
 if p_chat is not null and exists(select 1 from chat_messages where room_id=p_room and seat=member.seat and created_at>now()-interval '700 milliseconds') then raise exception 'chat_rate_limit'; end if;
 next_version:=r.version+1;
 update rooms set version=next_version,game_id=p_game,pending_game=p_pending,pending_by=p_pending_by where id=p_room;
 update room_states set state=p_state where room_id=p_room;
 insert into room_views(room_id,user_id,version,view)
 select p_room,m.user_id,next_version,p_views->m.seat from room_members m where m.room_id=p_room
 on conflict(room_id,user_id) do update set version=excluded.version,view=excluded.view;
 if p_chat is not null then
  insert into chat_messages(id,room_id,seat,text,status) values(p_request,p_room,member.seat,p_chat->>'text',p_chat->>'status');
 end if;
 insert into action_receipts values(p_room,p_request,p_user,next_version);
 return next_version;
end $$;
create function public.reserve_translation(p_message uuid,p_target text) returns boolean language plpgsql security definer set search_path=public as $$
declare msg public.chat_messages; chars integer; month_start date:=date_trunc('month',now() at time zone 'UTC')::date; total bigint;
begin
 select * into msg from chat_messages where id=p_message for update;
 if not found or msg.status<>'pending' or msg.created_at<=now()-interval '7 days' then return false; end if;
 chars:=char_length(msg.text);
 insert into translation_usage values(month_start,0) on conflict do nothing;
 select reserved_chars into total from translation_usage where month=month_start for update;
 if total+chars>400000 then update chat_messages set status='limit',target_language=p_target where id=p_message;return false;end if;
 update translation_usage set reserved_chars=reserved_chars+chars where month=month_start;
 update chat_messages set status='processing',target_language=p_target where id=p_message;
 return true;
end $$;
revoke execute on function public.is_room_member(uuid),public.create_room(text,text),public.join_room(uuid,text,text),public.set_language(uuid,text),public.commit_action(uuid,uuid,bigint,uuid,jsonb,jsonb,text,text,uuid,jsonb),public.reserve_translation(uuid,text) from public,anon,authenticated;
grant execute on function public.is_room_member(uuid),public.create_room(text,text),public.join_room(uuid,text,text),public.set_language(uuid,text) to authenticated;
grant execute on function public.commit_action(uuid,uuid,bigint,uuid,jsonb,jsonb,text,text,uuid,jsonb),public.reserve_translation(uuid,text) to service_role;
grant all on public.rooms,public.room_members,public.room_states,public.room_views,public.chat_messages,public.action_receipts,public.translation_usage to service_role;

create function public.room_snapshot(p_room uuid) returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object('room',to_jsonb(r)-'pending_by','seat',m.seat,'view',v.view,
 'members',(select coalesce(jsonb_agg(jsonb_build_object('seat',seat,'nickname',nickname,'language',language) order by seat),'[]'::jsonb) from room_members where room_id=p_room),
 'messages',(select coalesce(jsonb_agg(to_jsonb(c) order by c.created_at),'[]'::jsonb) from (select * from chat_messages where room_id=p_room and created_at>now()-interval '7 days' order by created_at desc limit 200)c))
 from rooms r join room_members m on m.room_id=r.id and m.user_id=auth.uid()
 join room_views v on v.room_id=r.id and v.user_id=auth.uid()
 where r.id=p_room and r.expires_at>now()
$$;
revoke execute on function public.room_snapshot(uuid) from public,anon;
grant execute on function public.room_snapshot(uuid) to authenticated;

create function public.close_room(p_room uuid) returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.is_room_member(p_room) then raise exception 'not_room_member'; end if;
 delete from rooms where id=p_room;
end $$;
revoke execute on function public.close_room(uuid) from public,anon;
grant execute on function public.close_room(uuid) to authenticated;

alter publication supabase_realtime add table public.rooms,public.room_members,public.room_views,public.chat_messages;

create extension if not exists pg_cron;
select cron.schedule('dos-seven-day-cleanup','15 3 * * *',$$delete from public.rooms where expires_at<=now(); delete from public.translation_usage where month<date_trunc('month',now())-interval '2 months';$$);
