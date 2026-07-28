create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  whatsapp_phone text,
  slug text unique,
  timezone text not null default 'Asia/Jerusalem',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.owner_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  full_name text,
  role text not null default 'owner' check (role in ('owner', 'manager')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, business_id)
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  is_closed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (business_id, day_of_week),
  check (opens_at < closes_at or is_closed = true)
);

create table if not exists public.appointment_slots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  slot_start timestamptz not null,
  slot_end timestamptz not null,
  is_available boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (business_id, slot_start),
  check (slot_start < slot_end)
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  slot_id uuid references public.appointment_slots(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_notes text,
  appointment_time timestamptz not null,
  appointment_end_time timestamptz,
  source text not null default 'web' check (source in ('web', 'owner', 'waitlist_offer')),
  status text not null default 'booked' check (status in ('booked', 'cancelled', 'completed', 'no_show')),
  cancelled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  desired_date date not null,
  preferred_start_at time,
  preferred_end_at time,
  priority integer not null default 100,
  status text not null default 'waiting' check (status in ('waiting', 'notified', 'booked', 'expired', 'cancelled')),
  last_notified_at timestamptz,
  booked_appointment_id uuid references public.appointments(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.waitlist_offers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  waitlist_id uuid not null references public.waitlist(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  slot_start timestamptz not null,
  slot_end timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'claimed', 'expired', 'cancelled')),
  offer_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  expires_at timestamptz not null,
  claimed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  waitlist_offer_id uuid references public.waitlist_offers(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  channel text not null check (channel in ('whatsapp', 'sms', 'email', 'in_app')),
  destination text not null,
  template_key text not null,
  provider_name text,
  provider_message_id text,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_owner_profiles_business_id on public.owner_profiles (business_id);
create index if not exists idx_services_business_id on public.services (business_id);
create index if not exists idx_business_hours_business_id on public.business_hours (business_id);
create index if not exists idx_appointment_slots_business_time on public.appointment_slots (business_id, slot_start);
create index if not exists idx_appointments_business_time on public.appointments (business_id, appointment_time);
create index if not exists idx_waitlist_business_date_status on public.waitlist (business_id, desired_date, status);
create index if not exists idx_waitlist_offers_waitlist_status on public.waitlist_offers (waitlist_id, status);
create index if not exists idx_waitlist_offers_business_expires on public.waitlist_offers (business_id, expires_at);
create index if not exists idx_notification_logs_business_created on public.notification_logs (business_id, created_at desc);

create or replace function public.current_business_id()
returns uuid
language sql
stable
as $$
  select business_id
  from public.owner_profiles
  where id = auth.uid()
  limit 1
$$;

create or replace function public.is_business_owner(target_business_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.owner_profiles op
    where op.id = auth.uid()
      and op.business_id = target_business_id
  )
$$;

create or replace function public.claim_waitlist_offer(target_offer_id uuid)
returns public.waitlist_offers
language plpgsql
security definer
set search_path = public
as $$
declare
  offer_record public.waitlist_offers;
  waitlist_record public.waitlist;
  booked_appointment public.appointments;
  slot_record public.appointment_slots;
begin
  select *
  into offer_record
  from public.waitlist_offers
  where id = target_offer_id
  for update;

  if not found then
    raise exception 'Offer not found';
  end if;

  if offer_record.status <> 'pending' then
    raise exception 'Offer is no longer available';
  end if;

  if offer_record.expires_at <= timezone('utc', now()) then
    update public.waitlist_offers
    set status = 'expired',
        updated_at = timezone('utc', now())
    where id = offer_record.id;

    raise exception 'Offer expired';
  end if;

  select *
  into waitlist_record
  from public.waitlist
  where id = offer_record.waitlist_id
  for update;

  select *
  into slot_record
  from public.appointment_slots
  where business_id = offer_record.business_id
    and slot_start = offer_record.slot_start
  for update;

  if not found then
    raise exception 'Slot not found for offer';
  end if;

  if slot_record.is_available = false then
    raise exception 'Slot is no longer available';
  end if;

  update public.appointment_slots
  set is_available = false,
      updated_at = timezone('utc', now())
  where id = slot_record.id;

  insert into public.appointments (
    business_id,
    service_id,
    slot_id,
    customer_name,
    customer_phone,
    appointment_time,
    appointment_end_time,
    source,
    status
  )
  values (
    offer_record.business_id,
    waitlist_record.service_id,
    slot_record.id,
    waitlist_record.customer_name,
    waitlist_record.customer_phone,
    offer_record.slot_start,
    offer_record.slot_end,
    'waitlist_offer',
    'booked'
  )
  returning * into booked_appointment;

  update public.waitlist_offers
  set status = 'claimed',
      claimed_at = timezone('utc', now()),
      appointment_id = booked_appointment.id,
      updated_at = timezone('utc', now())
  where id = offer_record.id
  returning * into offer_record;

  update public.waitlist
  set status = 'booked',
      booked_appointment_id = booked_appointment.id,
      updated_at = timezone('utc', now())
  where id = waitlist_record.id;

  update public.waitlist_offers
  set status = 'cancelled',
      updated_at = timezone('utc', now())
  where waitlist_id = waitlist_record.id
    and id <> offer_record.id
    and status = 'pending';

  return offer_record;
end;
$$;

alter table public.businesses enable row level security;
alter table public.owner_profiles enable row level security;
alter table public.services enable row level security;
alter table public.business_hours enable row level security;
alter table public.appointment_slots enable row level security;
alter table public.appointments enable row level security;
alter table public.waitlist enable row level security;
alter table public.waitlist_offers enable row level security;
alter table public.notification_logs enable row level security;

create policy "Businesses are readable publicly when active"
on public.businesses
for select
using (is_active = true);

create policy "Owners can read their business"
on public.businesses
for select
using (public.is_business_owner(id));

create policy "Owners can update their business"
on public.businesses
for update
using (public.is_business_owner(id))
with check (public.is_business_owner(id));

create policy "Owners can read their profile"
on public.owner_profiles
for select
using (id = auth.uid());

create policy "Owners can read their services"
on public.services
for select
using (public.is_business_owner(business_id) or exists (
  select 1
  from public.businesses b
  where b.id = business_id
    and b.is_active = true
));

create policy "Owners can manage their services"
on public.services
for all
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

create policy "Owners can read their business hours"
on public.business_hours
for select
using (public.is_business_owner(business_id) or exists (
  select 1
  from public.businesses b
  where b.id = business_id
    and b.is_active = true
));

create policy "Owners can manage their business hours"
on public.business_hours
for all
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

create policy "Owners can read their appointment slots"
on public.appointment_slots
for select
using (public.is_business_owner(business_id) or exists (
  select 1
  from public.businesses b
  where b.id = business_id
    and b.is_active = true
));

create policy "Owners can manage their appointment slots"
on public.appointment_slots
for all
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

create policy "Owners can read their appointments"
on public.appointments
for select
using (public.is_business_owner(business_id));

create policy "Public can create appointments"
on public.appointments
for insert
with check (exists (
  select 1
  from public.businesses b
  where b.id = business_id
    and b.is_active = true
));

create policy "Owners can update their appointments"
on public.appointments
for update
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

create policy "Owners can read their waitlist"
on public.waitlist
for select
using (public.is_business_owner(business_id));

create policy "Public can create waitlist entries"
on public.waitlist
for insert
with check (exists (
  select 1
  from public.businesses b
  where b.id = business_id
    and b.is_active = true
));

create policy "Owners can update their waitlist"
on public.waitlist
for update
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

create policy "Owners can read their waitlist offers"
on public.waitlist_offers
for select
using (public.is_business_owner(business_id));

create policy "Service role manages waitlist offers"
on public.waitlist_offers
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "Owners can read notification logs"
on public.notification_logs
for select
using (public.is_business_owner(business_id));

create policy "Service role manages notification logs"
on public.notification_logs
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create trigger businesses_set_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

create trigger owner_profiles_set_updated_at
before update on public.owner_profiles
for each row execute function public.set_updated_at();

create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

create trigger business_hours_set_updated_at
before update on public.business_hours
for each row execute function public.set_updated_at();

create trigger appointment_slots_set_updated_at
before update on public.appointment_slots
for each row execute function public.set_updated_at();

create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

create trigger waitlist_set_updated_at
before update on public.waitlist
for each row execute function public.set_updated_at();

create trigger waitlist_offers_set_updated_at
before update on public.waitlist_offers
for each row execute function public.set_updated_at();
