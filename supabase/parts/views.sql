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
