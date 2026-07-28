-- Scheduling: blocked contacts, staff, closures, parallel booking capacity.

alter table public.businesses
  add column if not exists booking_parallel_capacity integer not null default 1;

alter table public.businesses drop constraint if exists businesses_booking_parallel_capacity_check;
alter table public.businesses
  add constraint businesses_booking_parallel_capacity_check
  check (booking_parallel_capacity between 1 and 10);

alter table public.appointments
  add column if not exists customer_email text;

create table if not exists public.staff_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  display_name text not null,
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.business_closure_dates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  closure_date date not null,
  label text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (business_id, closure_date)
);

create table if not exists public.blocked_contacts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_phone text,
  customer_email text,
  reason text,
  blocked_from_appointment_id uuid references public.appointments(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint blocked_contacts_has_identifier check (
    customer_phone is not null or customer_email is not null
  )
);

create unique index if not exists blocked_contacts_business_phone_idx
  on public.blocked_contacts (business_id, customer_phone)
  where customer_phone is not null;

create unique index if not exists blocked_contacts_business_email_idx
  on public.blocked_contacts (business_id, lower(customer_email))
  where customer_email is not null;

alter table public.appointment_slots
  add column if not exists staff_id uuid references public.staff_members(id) on delete set null;

alter table public.appointments
  add column if not exists staff_id uuid references public.staff_members(id) on delete set null;

alter table public.appointment_slots drop constraint if exists appointment_slots_business_id_slot_start_key;

create unique index if not exists appointment_slots_business_time_staff_uidx
  on public.appointment_slots (
    business_id,
    slot_start,
    coalesce(staff_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

alter table public.staff_members enable row level security;
alter table public.business_closure_dates enable row level security;
alter table public.blocked_contacts enable row level security;

create policy "Owners manage staff"
on public.staff_members for all
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

create policy "Public read staff for active businesses"
on public.staff_members for select
using (exists (
  select 1 from public.businesses b
  where b.id = business_id and b.is_active = true
));

create policy "Owners manage closure dates"
on public.business_closure_dates for all
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

create policy "Public read closures for active businesses"
on public.business_closure_dates for select
using (exists (
  select 1 from public.businesses b
  where b.id = business_id and b.is_active = true
));

create policy "Owners manage blocked contacts"
on public.blocked_contacts for all
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

create policy "Platform admins manage staff"
on public.staff_members for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "Platform admins manage closures"
on public.business_closure_dates for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "Platform admins manage blocked contacts"
on public.blocked_contacts for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create trigger staff_members_set_updated_at
before update on public.staff_members
for each row execute function public.set_updated_at();

create or replace function public.normalize_phone(raw text)
returns text
language sql
immutable
as $$
  select nullif(regexp_replace(coalesce(raw, ''), '[^0-9]+', '', 'g'), '');
$$;

create or replace function public.is_contact_blocked(
  p_business_id uuid,
  p_phone text,
  p_email text default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.blocked_contacts bc
    where bc.business_id = p_business_id
      and (
        (p_phone is not null and bc.customer_phone is not null
          and public.normalize_phone(bc.customer_phone) = public.normalize_phone(p_phone))
        or (p_email is not null and bc.customer_email is not null
          and lower(trim(bc.customer_email)) = lower(trim(p_email)))
      )
  );
$$;

grant execute on function public.is_contact_blocked(uuid, text, text) to anon, authenticated;
