-- Run once in Supabase: SQL Editor > New query > paste > Run.

create or replace function public.is_verified_doctor(d uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = d and role = 'doctor' and verified)
$$;

create table public.patient_access (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null default auth.uid() references public.profiles on delete cascade,
  doctor_id uuid not null references public.profiles on delete cascade,
  patient_name text,
  doctor_name text,
  granted_at timestamptz not null default now(),
  unique (patient_id, doctor_id)
);
alter table public.patient_access enable row level security;
create policy "see own grants" on public.patient_access for select using (auth.uid() = patient_id or auth.uid() = doctor_id);
create policy "patients grant access" on public.patient_access for insert
  with check (auth.uid() = patient_id and public.is_verified_doctor(doctor_id));
create policy "either side ends access" on public.patient_access for delete using (auth.uid() = patient_id or auth.uid() = doctor_id);

create function public.set_access_names() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.patient_name := (select full_name from public.profiles where id = new.patient_id);
  new.doctor_name := (select full_name from public.profiles where id = new.doctor_id);
  return new;
end $$;
create trigger set_access_names before insert on public.patient_access
  for each row execute function public.set_access_names();

-- True only for a verified doctor the patient has chosen to share with.
create function public.has_access(p uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.patient_access a where a.patient_id = p and a.doctor_id = auth.uid())
     and public.is_verified_doctor(auth.uid())
$$;

-- Doctors get read-only access. They can never change a patient's records.
create policy "doctors read shared diary" on public.pain_entries for select using (public.has_access(user_id));
create policy "doctors read shared medicines" on public.medicines for select using (public.has_access(user_id));
create policy "doctors read shared dose logs" on public.dose_logs for select using (public.has_access(user_id));
create policy "doctors read shared details" on public.patient_details for select using (public.has_access(id));
