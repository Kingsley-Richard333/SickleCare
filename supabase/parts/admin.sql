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
