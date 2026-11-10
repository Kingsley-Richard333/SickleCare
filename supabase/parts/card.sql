-- Run once in Supabase: SQL Editor > New query > paste > Run.
alter table public.patient_details
  add column if not exists medicines text,
  add column if not exists allergies text,
  add column if not exists doctor_name text,
  add column if not exists doctor_phone text;
