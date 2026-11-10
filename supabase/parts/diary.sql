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
