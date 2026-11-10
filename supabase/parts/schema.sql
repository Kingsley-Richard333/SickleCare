-- Run this once in Supabase: SQL Editor > New query > paste > Run.

create table public.profiles (np 
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
