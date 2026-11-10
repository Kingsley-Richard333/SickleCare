-- Run once in Supabase: SQL Editor > New query > paste > Run.

-- True when this user id belongs to a verified doctor. Runs with full rights so policies can use it.
create or replace function public.is_verified_doctor(d uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = d and role = 'doctor' and verified)
$$;

-- Lets patients see the names of verified doctors, and nothing else about them.
create function public.verified_doctors() returns table (id uuid, full_name text)
language sql security definer set search_path = public as $$
  select id, full_name from public.profiles where role = 'doctor' and verified
$$;
revoke execute on function public.verified_doctors() from public;
grant execute on function public.verified_doctors() to authenticated;

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null default auth.uid() references public.profiles on delete cascade,
  doctor_id uuid not null references public.profiles on delete cascade,
  patient_name text,
  doctor_name text,
  starts_at timestamptz not null,
  reason text,
  status text not null default 'requested' check (status in ('requested','confirmed','declined','cancelled')),
  doctor_note text,
  created_at timestamptz not null default now()
);
create index on public.appointments (patient_id, starts_at);
create index on public.appointments (doctor_id, starts_at);
alter table public.appointments enable row level security;

create policy "see own appointments" on public.appointments for select
  using (auth.uid() = patient_id or auth.uid() = doctor_id);
create policy "patients request" on public.appointments for insert
  with check (auth.uid() = patient_id and status = 'requested' and starts_at > now()
    and public.is_verified_doctor(doctor_id));
create policy "update own appointments" on public.appointments for update
  using (auth.uid() = patient_id or auth.uid() = doctor_id)
  with check (auth.uid() = patient_id or auth.uid() = doctor_id);

-- Fill in both names from the real profiles so they cannot be faked.
create function public.set_appointment_names() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.patient_name := (select full_name from public.profiles where id = new.patient_id);
  new.doctor_name := (select full_name from public.profiles where id = new.doctor_id);
  return new;
end $$;
create trigger set_appointment_names before insert on public.appointments
  for each row execute function public.set_appointment_names();

-- Patients may only cancel. Doctors may only confirm, decline, cancel, and add a note.
create function public.guard_appointment_update() returns trigger
language plpgsql as $$
begin
  if auth.uid() = old.doctor_id then
    new.patient_id := old.patient_id; new.doctor_id := old.doctor_id; new.starts_at := old.starts_at;
    new.reason := old.reason; new.patient_name := old.patient_name; new.doctor_name := old.doctor_name;
    if new.status not in ('confirmed','declined','cancelled') then new.status := old.status; end if;
  elsif auth.uid() = old.patient_id then
    new.patient_id := old.patient_id; new.doctor_id := old.doctor_id; new.starts_at := old.starts_at;
    new.reason := old.reason; new.patient_name := old.patient_name; new.doctor_name := old.doctor_name;
    new.doctor_note := old.doctor_note;
    if new.status <> 'cancelled' then new.status := old.status; end if;
  end if;
  return new;
end $$;
create trigger guard_appointment_update before update on public.appointments
  for each row execute function public.guard_appointment_update();
