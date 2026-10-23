-- Both existing pair-space members may post; p1 remains the only status editor.
drop policy feedback_p2_create on public.feedback_entries;
create policy feedback_members_create on public.feedback_entries for insert to authenticated with check(
 public.is_feedback_member(space_id)
);

create or replace function public.submit_feedback(p_space uuid,p_request uuid,p_category text,p_title text,p_body text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare entry public.feedback_entries;
begin
 if auth.uid() is null then raise exception 'authentication_required'; end if;
 if not public.is_feedback_member(p_space) then raise exception 'feedback_create_denied'; end if;
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
