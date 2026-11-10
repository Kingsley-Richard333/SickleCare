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
