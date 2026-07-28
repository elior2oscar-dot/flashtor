-- Subscription metadata per client business (managed from platform admin).

alter table public.businesses
  add column if not exists subscription_plan text not null default 'trial',
  add column if not exists subscription_status text not null default 'active';

alter table public.businesses drop constraint if exists businesses_subscription_plan_check;
alter table public.businesses
  add constraint businesses_subscription_plan_check
  check (subscription_plan in ('trial', 'starter', 'pro', 'enterprise'));

alter table public.businesses drop constraint if exists businesses_subscription_status_check;
alter table public.businesses
  add constraint businesses_subscription_status_check
  check (subscription_status in ('active', 'past_due', 'cancelled', 'paused'));
