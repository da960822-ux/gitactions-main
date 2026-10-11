-- Translation is a Catchmind-only feature. Keep this check in the quota RPC so
-- forged service requests cannot reserve budget for another game.
create or replace function public.reserve_translation(p_message uuid,p_target text) returns boolean
language plpgsql security definer set search_path=public as $$
declare
 msg public.chat_messages;
 chars integer;
 month_start date:=date_trunc('month',now() at time zone 'UTC')::date;
 total bigint;
begin
 select * into msg from public.chat_messages where id=p_message for update;
 if not found or msg.status<>'pending' or msg.created_at<=now()-interval '7 days' then return false; end if;
 if not exists(select 1 from public.rooms where id=msg.room_id and game_id='catchmind') then return false; end if;
 chars:=char_length(msg.text);
 insert into public.translation_usage values(month_start,0) on conflict do nothing;
 select reserved_chars into total from public.translation_usage where month=month_start for update;
 if total+chars>400000 then
  update public.chat_messages set status='limit',target_language=p_target where id=p_message;
  return false;
 end if;
 update public.translation_usage set reserved_chars=reserved_chars+chars where month=month_start;
 update public.chat_messages set status='processing',target_language=p_target where id=p_message;
 return true;
end $$;
