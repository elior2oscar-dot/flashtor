alter table public.appointments
  add column if not exists arrival_confirmed_at timestamptz,
  add column if not exists reminder_24h_sent_at timestamptz,
  add column if not exists reminder_2h_sent_at timestamptz;

create table if not exists public.appointment_confirmation_tokens (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  expires_at timestamptz not null,
  confirmed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_appointments_reminder_24h
  on public.appointments (appointment_time)
  where status = 'booked' and reminder_24h_sent_at is null;

create index if not exists idx_appointments_reminder_2h
  on public.appointments (appointment_time)
  where status = 'booked' and reminder_2h_sent_at is null;

create index if not exists idx_confirmation_tokens_token
  on public.appointment_confirmation_tokens (token);

create or replace function public.confirm_arrival_by_token(target_token text)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  token_record public.appointment_confirmation_tokens;
  appointment_record public.appointments;
begin
  select *
  into token_record
  from public.appointment_confirmation_tokens
  where token = target_token
  for update;

  if not found then
    raise exception 'Confirmation link not found';
  end if;

  if token_record.confirmed_at is not null then
    select * into appointment_record from public.appointments where id = token_record.appointment_id;
    return appointment_record;
  end if;

  if token_record.expires_at <= timezone('utc', now()) then
    raise exception 'Confirmation link expired';
  end if;

  select *
  into appointment_record
  from public.appointments
  where id = token_record.appointment_id
  for update;

  if appointment_record.status <> 'booked' then
    raise exception 'Appointment is no longer active';
  end if;

  update public.appointment_confirmation_tokens
  set confirmed_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  where id = token_record.id;

  update public.appointments
  set arrival_confirmed_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  where id = appointment_record.id
  returning * into appointment_record;

  return appointment_record;
end;
$$;

alter table public.appointment_confirmation_tokens enable row level security;

create policy "Service role manages confirmation tokens"
on public.appointment_confirmation_tokens
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create trigger appointment_confirmation_tokens_set_updated_at
before update on public.appointment_confirmation_tokens
for each row execute function public.set_updated_at();
