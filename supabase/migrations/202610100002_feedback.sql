create table public.feedback_entries (
 id uuid primary key default gen_random_uuid(),
 room_id uuid not null references public.rooms on delete cascade,
 category text not null check(category in ('message','game','feature')),
 title text not null check(length(trim(title)) between 1 and 120),
 body text not null check(length(trim(body)) between 1 and 4000),
 status text not null default 'new' check(status in ('new','read','planned','done')),
 created_at timestamptz not null default now()
);
create index feedback_room_time on public.feedback_entries(room_id,created_at desc);
alter table public.feedback_entries enable row level security;
create policy feedback_room_read on public.feedback_entries for select to authenticated using(public.is_room_member(room_id));
create policy feedback_p2_create on public.feedback_entries for insert to authenticated with check(
 public.is_room_member(room_id) and exists(
  select 1 from public.room_members m where m.room_id=feedback_entries.room_id and m.user_id=auth.uid() and m.seat='p2'
 )
);
create policy feedback_p1_status on public.feedback_entries for update to authenticated using(
 public.is_room_member(room_id) and exists(
  select 1 from public.room_members m where m.room_id=feedback_entries.room_id and m.user_id=auth.uid() and m.seat='p1'
 )
) with check (
 public.is_room_member(room_id) and exists(
  select 1 from public.room_members m where m.room_id=feedback_entries.room_id and m.user_id=auth.uid() and m.seat='p1'
 )
);
revoke all on public.feedback_entries from anon,authenticated;
grant select on public.feedback_entries to authenticated;
grant insert(room_id,category,title,body) on public.feedback_entries to authenticated;
grant update(status) on public.feedback_entries to authenticated;
grant all on public.feedback_entries to service_role;
alter publication supabase_realtime add table public.feedback_entries;
