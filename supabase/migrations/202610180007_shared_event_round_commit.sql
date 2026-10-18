-- These service-role RPCs assume their actor UUID came from a verified Supabase JWT in the Edge boundary.
-- They deliberately are not SECURITY DEFINER and are not executable by browser roles.
create function public.read_event_session_for_action(p_session uuid,p_verified_actor uuid) returns jsonb
language plpgsql set search_path=public as $$
declare session record;
begin
 if p_session is null or p_verified_actor is null then raise exception 'invalid_event_request'; end if;
 select s.id as session_id,m.seat,s.revision,s.event_state,s.expires_at into session
 from public.event_sessions s join public.event_session_members m on m.session_id=s.id
 where s.id=p_session and m.user_id=p_verified_actor and s.expires_at>now();
 if not found then raise exception 'event_session_unavailable'; end if;
 return jsonb_build_object('sessionId',session.session_id,'seat',session.seat,'revision',session.revision,'eventState',session.event_state,'expiresAt',session.expires_at);
end $$;

create function public.commit_event_session_action(
 p_session uuid,p_verified_actor uuid,p_expected_revision bigint,p_request uuid,p_signature jsonb,p_next_state jsonb
) returns jsonb language plpgsql set search_path=public as $$
declare session record; prior public.event_session_receipts; assigned text; next_revision bigint;
begin
 if p_session is null or p_verified_actor is null or p_expected_revision is null or p_expected_revision<0 or p_request is null then
  raise exception 'invalid_event_request';
 end if;
 if p_signature is null or jsonb_typeof(p_signature)<>'object' or octet_length(p_signature::text)>16384 then
  raise exception 'event_signature_invalid';
 end if;
 if p_next_state is null or jsonb_typeof(p_next_state)<>'object' or octet_length(p_next_state::text)>65536 then
  raise exception 'event_state_invalid';
 end if;
 if p_expected_revision>=9223372036854775807 or jsonb_typeof(p_next_state->'revision') is distinct from 'number'
  or (p_next_state->>'revision')::numeric<>p_expected_revision+1 then
  raise exception 'event_revision_invalid';
 end if;

 select s.id as session_id,s.revision,s.event_state,s.expires_at into session
 from public.event_sessions s where s.id=p_session for update;
 if not found or session.expires_at<=now() then raise exception 'event_session_expired'; end if;
 select m.seat into assigned from public.event_session_members m where m.session_id=p_session and m.user_id=p_verified_actor;
 if not found then raise exception 'not_event_session_member'; end if;
 if (select count(*) from public.event_session_members where session_id=p_session)<2 then raise exception 'event_session_not_ready'; end if;

 select * into prior from public.event_session_receipts where session_id=p_session and request_id=p_request;
 if found then
  if prior.user_id<>p_verified_actor or prior.signature is distinct from p_signature then raise exception 'event_request_conflict'; end if;
  return jsonb_build_object('sessionId',session.session_id,'seat',assigned,'revision',session.revision,'eventState',session.event_state,'expiresAt',session.expires_at,'replayed',true,'serverNow',floor(extract(epoch from clock_timestamp())*1000),'memberCount',2);
 end if;
 if session.revision<>p_expected_revision then raise exception 'stale_event_state'; end if;
 if (select count(*) from public.event_session_receipts where session_id=p_session)>=128 then raise exception 'event_receipt_limit'; end if;

 next_revision:=p_expected_revision+1;
 update public.event_sessions set revision=next_revision,event_state=p_next_state where id=p_session;
 insert into public.event_session_receipts(session_id,request_id,user_id,revision,signature)
 values(p_session,p_request,p_verified_actor,next_revision,p_signature);
 return jsonb_build_object('sessionId',session.session_id,'seat',assigned,'revision',next_revision,'eventState',p_next_state,'expiresAt',session.expires_at,'replayed',false,'serverNow',floor(extract(epoch from clock_timestamp())*1000),'memberCount',2);
end $$;

revoke all on function public.read_event_session_for_action(uuid,uuid),public.commit_event_session_action(uuid,uuid,bigint,uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.read_event_session_for_action(uuid,uuid),public.commit_event_session_action(uuid,uuid,bigint,uuid,jsonb,jsonb) to service_role;
