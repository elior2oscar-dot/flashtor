create table if not exists public.appointment_cancellation_tokens (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  expires_at timestamptz not null,
  cancelled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_cancellation_tokens_token
  on public.appointment_cancellation_tokens (token);

alter table public.appointment_cancellation_tokens enable row level security;

create policy "Service role manages cancellation tokens"
on public.appointment_cancellation_tokens
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create trigger appointment_cancellation_tokens_set_updated_at
before update on public.appointment_cancellation_tokens
for each row execute function public.set_updated_at();
