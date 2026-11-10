-- SICKLECARE: complete database setup. Run ONCE on a NEW Supabase project.
-- SQL Editor > New query > paste everything > Run. You should see Success.
-- (notifications.sql is separate: it needs your project address and secret. Run it last.)

-- ======================= schema.sql =======================
-- Run this once in Supabase: SQL Editor > New query > paste > Run.

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role text not null default 'patient' check (role in ('patient', 'doctor')),
  verified boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "read own profile" on public.profiles for select using (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Create a profile automatically when someone signs up.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name',
          case when new.raw_user_meta_data->>'role' = 'doctor' then 'doctor' else 'patient' end);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Stop users from changing their own role or verified status.
create function public.lock_profile_fields() returns trigger
language plpgsql as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    new.role := old.role;
    new.verified := old.verified;
  end if;
  return new;
end $$;
create trigger lock_profile_fields before update on public.profiles
  for each row execute function public.lock_profile_fields();

create table public.patient_details (
  id uuid primary key references public.profiles on delete cascade,
  genotype text check (genotype in ('AA','AS','SS','SC','Other','Not sure')),
  blood_group text,
  emergency_contact_name text,
  emergency_contact_phone text,
  updated_at timestamptz not null default now()
);
alter table public.patient_details enable row level security;
create policy "own details" on public.patient_details for all using (auth.uid() = id) with check (auth.uid() = id);

-- ======================= diary.sql =======================
-- Run once in Supabase: SQL Editor > New query > paste > Run.
create table public.pain_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  logged_at timestamptz not null default now(),
  pain_level int not null check (pain_level between 0 and 10),
  locations text[] not null default '{}',
  triggers text[] not null default '{}',
  mood text,
  notes text
);
create index on public.pain_entries (user_id, logged_at desc);
alter table public.pain_entries enable row level security;
create policy "own entries" on public.pain_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ======================= card.sql =======================
-- Run once in Supabase: SQL Editor > New query > paste > Run.
alter table public.patient_details
  add column if not exists medicines text,
  add column if not exists allergies text,
  add column if not exists doctor_name text,
  add column if not exists doctor_phone text;

-- ======================= medicines.sql =======================
-- Run once in Supabase: SQL Editor > New query > paste > Run.
create table public.medicines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  name text not null,
  dose text,
  times text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.medicines enable row level security;
create policy "own medicines" on public.medicines for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.dose_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  medicine_id uuid not null references public.medicines on delete cascade,
  dose_date date not null,
  dose_time text not null,
  taken_at timestamptz not null default now(),
  unique (medicine_id, dose_date, dose_time)
);
alter table public.dose_logs enable row level security;
create policy "own dose logs" on public.dose_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ======================= appointments.sql =======================
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

-- ======================= admin.sql =======================
-- Run once in Supabase: SQL Editor > New query > paste > Run.
-- It also FIXES an earlier bug: changes made in the Supabase dashboard (such as ticking "verified") were being undone.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('patient','doctor','admin'));
alter table public.profiles add column if not exists email text, add column if not exists license_no text;
update public.profiles p set email = u.email from auth.users u where u.id = p.id and p.email is null;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role, email, license_no)
  values (new.id, new.raw_user_meta_data->>'full_name',
          case when new.raw_user_meta_data->>'role' = 'doctor' then 'doctor' else 'patient' end,
          new.email, new.raw_user_meta_data->>'license_no');
  return new;
end $$;

create function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

-- Only block role/verified changes that come from the app, not from the dashboard or an admin.
create or replace function public.lock_profile_fields() returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null and coalesce(auth.role(), '') <> 'service_role' and not public.is_admin() then
    new.role := old.role; new.verified := old.verified; new.email := old.email; new.license_no := old.license_no;
  end if;
  return new;
end $$;

create policy "admin reads profiles" on public.profiles for select using (public.is_admin());
create policy "admin updates profiles" on public.profiles for update using (public.is_admin()) with check (public.is_admin());

-- Counts only. Admins never get to read patient health records.
create function public.admin_stats() returns json
language sql security definer set search_path = public as $$
  select case when public.is_admin() then json_build_object(
    'patients', (select count(*) from public.profiles where role = 'patient'),
    'doctors', (select count(*) from public.profiles where role = 'doctor'),
    'verified', (select count(*) from public.profiles where role = 'doctor' and verified),
    'appointments', (select count(*) from public.appointments)) end
$$;
revoke execute on function public.admin_stats() from public;
grant execute on function public.admin_stats() to authenticated;

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('Doctor','Hospital','Clinic')),
  specialty text, facility text, area text, address text, phone text, hours text,
  emergency boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.providers enable row level security;
create policy "anyone reads providers" on public.providers for select using (true);
create policy "admin adds providers" on public.providers for insert with check (public.is_admin());
create policy "admin edits providers" on public.providers for update using (public.is_admin()) with check (public.is_admin());
create policy "admin deletes providers" on public.providers for delete using (public.is_admin());

-- Make yourself an admin (use the email you signed up with):
-- update public.profiles set role = 'admin' where email = 'you@example.com';

-- ======================= sharing.sql =======================
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

-- ======================= messages.sql =======================
-- Run once in Supabase: SQL Editor > New query > paste > Run.
-- Needs sharing.sql to have been run first.

-- A patient and doctor can message only while the patient is sharing records with that verified doctor.
create function public.can_message(p uuid, d uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.patient_access a where a.patient_id = p and a.doctor_id = d)
     and public.is_verified_doctor(d)
$$;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles on delete cascade,
  doctor_id uuid not null references public.profiles on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index on public.messages (patient_id, doctor_id, created_at);
alter table public.messages enable row level security;

-- Patients always see their own conversations. Doctors see them only while sharing is on.
create policy "read own messages" on public.messages for select
  using (auth.uid() = patient_id or (auth.uid() = doctor_id and public.can_message(patient_id, doctor_id)));
create policy "send messages" on public.messages for insert
  with check (sender_id = auth.uid() and (auth.uid() = patient_id or auth.uid() = doctor_id)
    and public.can_message(patient_id, doctor_id));
create policy "mark read" on public.messages for update
  using (sender_id <> auth.uid() and (auth.uid() = patient_id or auth.uid() = doctor_id))
  with check (sender_id <> auth.uid() and (auth.uid() = patient_id or auth.uid() = doctor_id));

-- The only thing that can ever change on a message is read_at, once.
create function public.guard_message_update() returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null then
    new.patient_id := old.patient_id; new.doctor_id := old.doctor_id; new.sender_id := old.sender_id;
    new.body := old.body; new.created_at := old.created_at;
    if old.read_at is not null then new.read_at := old.read_at; end if;
  end if;
  return new;
end $$;
create trigger guard_message_update before update on public.messages
  for each row execute function public.guard_message_update();

-- ======================= account.sql =======================
-- Run once in Supabase: SQL Editor > New query > paste > Run.
alter table public.profiles add column if not exists email_alerts boolean not null default true;

-- ======================= views.sql =======================
-- Run once in Supabase: SQL Editor > New query > paste > Run. (Included in setup.sql.)
-- Lets patients see when a doctor opened their shared records.
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
