-- Bookable treatments: price + optional description + display order.

alter table public.services
  add column if not exists price_ils numeric(10, 2),
  add column if not exists description text,
  add column if not exists sort_order integer not null default 0;

create index if not exists idx_services_business_sort
  on public.services (business_id, sort_order, name);
