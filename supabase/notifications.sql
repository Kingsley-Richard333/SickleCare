-- Run once in Supabase: SQL Editor > New query > paste > Run.
-- BEFORE running, replace the two placeholders below:
--   YOUR-PROJECT-REF  -> the part before .supabase.co in your project URL
--   YOUR-SECRET       -> the same long random text you saved as WEBHOOK_SECRET

create extension if not exists pg_net with schema extensions;

create or replace function public.send_notification() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  begin
    perform net.http_post(
      url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/notify',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', 'YOUR-SECRET'),
      body := jsonb_build_object(
        'table', tg_table_name, 'type', tg_op, 'record', to_jsonb(new),
        'old_record', case when tg_op = 'UPDATE' then to_jsonb(old) else null end)
    );
  exception when others then
    null; -- a failed email must never stop a message or appointment from saving
  end;
  return new;
end $$;

create trigger notify_new_message after insert on public.messages
  for each row execute function public.send_notification();
create trigger notify_new_appointment after insert on public.appointments
  for each row execute function public.send_notification();
create trigger notify_appointment_status after update on public.appointments
  for each row when (old.status is distinct from new.status) execute function public.send_notification();
create trigger notify_doctor_verified after update of verified on public.profiles
  for each row when (old.verified is distinct from new.verified) execute function public.send_notification();
