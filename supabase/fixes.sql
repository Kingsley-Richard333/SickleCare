-- ONLY for projects that already ran the earlier separate files before this fix.
-- (A fresh project should run setup.sql instead and can ignore this file.)
-- Fixes: patients could not book appointments, because the booking rule could not see the doctor's profile.
create or replace function public.is_verified_doctor(d uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = d and role = 'doctor' and verified)
$$;

drop policy if exists "patients request" on public.appointments;
create policy "patients request" on public.appointments for insert
  with check (auth.uid() = patient_id and status = 'requested' and starts_at > now()
    and public.is_verified_doctor(doctor_id));

-- Also adds the 'who viewed my records' log:
create table public.record_views (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles on delete cascade,
  doctor_id uuid not null default auth.uid() references public.profiles on delete cascade,
  doctor_name text,
  viewed_at timestamptz not null default now()
);
create index on public.record_views (patient_id, viewed_at desc);
alter table public.record_views enable row level security;
create policy "patients see who viewed" on public.record_views for select using (auth.uid() = patient_id);
create policy "doctors log their views" on public.record_views for insert
  with check (doctor_id = auth.uid() and public.has_access(patient_id));

create function public.set_view_name() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.doctor_name := (select full_name from public.profiles where id = new.doctor_id);
  return new;
end $$;
create trigger set_view_name before insert on public.record_views
  for each row execute function public.set_view_name();
