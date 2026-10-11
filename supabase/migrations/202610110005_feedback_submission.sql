-- Keep legacy categories/posts and the existing p2-write/p1-status pair contract.
alter table public.feedback_entries drop constraint feedback_entries_category_check;
alter table public.feedback_entries add constraint feedback_entries_category_check
 check(category in ('message','game','feature','complaint','other'));

create function public.submit_feedback(p_space uuid,p_request uuid,p_category text,p_title text,p_body text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare entry public.feedback_entries;
begin
 if auth.uid() is null then raise exception 'authentication_required'; end if;
 if not exists(select 1 from public.feedback_space_members where space_id=p_space and user_id=auth.uid() and seat='p2') then
  raise exception 'feedback_create_denied';
 end if;
 if p_request is null or p_category is null or p_category not in ('message','game','feature','complaint','other')
  or p_title is null or length(trim(p_title)) not between 1 and 120
  or p_body is null or length(trim(p_body)) not between 1 and 4000 then
  raise exception 'feedback_invalid';
 end if;
 insert into public.feedback_entries(id,space_id,category,title,body)
 values(p_request,p_space,p_category,trim(p_title),trim(p_body)) on conflict(id) do nothing;
 select * into entry from public.feedback_entries where id=p_request;
 if entry.space_id is distinct from p_space or entry.category is distinct from p_category
  or entry.title is distinct from trim(p_title) or entry.body is distinct from trim(p_body)
  or entry.created_at<=now()-interval '7 days' then
  raise exception 'feedback_request_conflict';
 end if;
 return to_jsonb(entry);
end $$;
-- Submission goes through the authenticated, role-checked idempotent RPC only.
revoke insert(space_id,category,title,body) on public.feedback_entries from authenticated;
revoke execute on function public.submit_feedback(uuid,uuid,text,text,text) from public,anon;
grant execute on function public.submit_feedback(uuid,uuid,text,text,text) to authenticated;
