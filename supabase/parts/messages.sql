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
