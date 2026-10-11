create table public.feedback_spaces (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 invite_open boolean not null default true
);
create table public.feedback_space_members (
 space_id uuid not null references public.feedback_spaces on delete cascade,
 user_id uuid not null references auth.users on delete cascade,
 seat text not null check(seat in ('p1','p2')),
 primary key(space_id,user_id),
 unique(space_id,seat)
);

create table public.feedback_legacy_map (legacy_room uuid primary key, space_id uuid not null unique default gen_random_uuid());
insert into public.feedback_legacy_map(legacy_room)
select distinct room_id from public.feedback_entries;
insert into public.feedback_spaces(id,created_at,invite_open)
select m.space_id,coalesce(min(e.created_at),now()),r.expires_at>now() and count(distinct rm.user_id)<2
from public.feedback_legacy_map m
join public.rooms r on r.id=m.legacy_room
join public.feedback_entries e on e.room_id=m.legacy_room
left join public.room_members rm on rm.room_id=m.legacy_room
group by m.space_id,r.expires_at;
insert into public.feedback_space_members(space_id,user_id,seat)
select m.space_id,rm.user_id,rm.seat
from public.feedback_legacy_map m
join public.rooms r on r.id=m.legacy_room and r.expires_at>now()
join public.room_members rm on rm.room_id=m.legacy_room;

alter table public.feedback_entries add column space_id uuid references public.feedback_spaces on delete cascade;
update public.feedback_entries e set space_id=m.space_id
from public.feedback_legacy_map m where e.room_id=m.legacy_room;
alter table public.feedback_entries alter column space_id set not null;
drop policy feedback_room_read on public.feedback_entries;
drop policy feedback_p2_create on public.feedback_entries;
drop policy feedback_p1_status on public.feedback_entries;
drop index public.feedback_room_time;
alter table public.feedback_entries drop column room_id;
drop table public.feedback_legacy_map;

create function public.is_feedback_member(p_space uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from feedback_space_members where space_id=p_space and user_id=auth.uid())
$$;
alter table public.feedback_spaces enable row level security;
alter table public.feedback_space_members enable row level security;
create policy read_feedback_space on public.feedback_spaces for select to authenticated using(public.is_feedback_member(id));
create policy read_feedback_members on public.feedback_space_members for select to authenticated using(public.is_feedback_member(space_id));
create policy feedback_space_read on public.feedback_entries for select to authenticated using(
 public.is_feedback_member(space_id) and created_at>now()-interval '7 days'
);
create policy feedback_p2_create on public.feedback_entries for insert to authenticated with check(
 public.is_feedback_member(space_id) and exists(
  select 1 from public.feedback_space_members m where m.space_id=feedback_entries.space_id and m.user_id=auth.uid() and m.seat='p2'
 )
);
create policy feedback_p1_status on public.feedback_entries for update to authenticated using(
 public.is_feedback_member(space_id) and created_at>now()-interval '7 days' and exists(
  select 1 from public.feedback_space_members m where m.space_id=feedback_entries.space_id and m.user_id=auth.uid() and m.seat='p1'
 )
) with check (
 public.is_feedback_member(space_id) and created_at>now()-interval '7 days' and exists(
  select 1 from public.feedback_space_members m where m.space_id=feedback_entries.space_id and m.user_id=auth.uid() and m.seat='p1'
 )
);

create function public.create_feedback_space() returns uuid language plpgsql security definer set search_path=public as $$
declare s uuid;
begin
 if auth.uid() is null then raise exception 'authentication_required'; end if;
 insert into feedback_spaces default values returning id into s;
 insert into feedback_space_members values(s,auth.uid(),'p1');
 return s;
end $$;
create function public.join_feedback_space(p_space uuid) returns text language plpgsql security definer set search_path=public as $$
declare s public.feedback_spaces; seat text;
begin
 if auth.uid() is null then raise exception 'authentication_required'; end if;
 select * into s from feedback_spaces where id=p_space for update;
 if not found then raise exception 'feedback_space_not_found'; end if;
 select m.seat into seat from feedback_space_members m where m.space_id=p_space and m.user_id=auth.uid();
 if found then return seat; end if;
 if not s.invite_open then raise exception 'feedback_invite_closed'; end if;
 if (select count(*) from feedback_space_members where space_id=p_space)>=2 then raise exception 'feedback_space_full'; end if;
 seat:=case when exists(select 1 from feedback_space_members m where m.space_id=p_space and m.seat='p1') then 'p2' else 'p1' end;
 insert into feedback_space_members values(p_space,auth.uid(),seat);
 update feedback_spaces set invite_open=false where id=p_space;
 return seat;
end $$;

create index feedback_space_time on public.feedback_entries(space_id,created_at desc);
revoke all on public.feedback_spaces,public.feedback_space_members from anon,authenticated;
grant select on public.feedback_spaces,public.feedback_space_members to authenticated;
revoke all on public.feedback_entries from anon,authenticated;
grant select on public.feedback_entries to authenticated;
grant insert(space_id,category,title,body) on public.feedback_entries to authenticated;
grant update(status) on public.feedback_entries to authenticated;
grant all on public.feedback_spaces,public.feedback_space_members,public.feedback_entries to service_role;
revoke execute on function public.is_feedback_member(uuid),public.create_feedback_space(),public.join_feedback_space(uuid) from public,anon;
grant execute on function public.is_feedback_member(uuid),public.create_feedback_space(),public.join_feedback_space(uuid) to authenticated;
alter publication supabase_realtime add table public.feedback_spaces,public.feedback_space_members;
select cron.schedule('feedback-seven-day-cleanup','15 * * * *',$$delete from public.feedback_entries where created_at<=now()-interval '7 days';$$);
