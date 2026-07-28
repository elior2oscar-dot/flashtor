-- FlashTor: unlimited businesses and members (no artificial caps in schema)

create table if not exists public.business_members (
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'manager')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, business_id)
);

create index if not exists idx_business_members_business_id
  on public.business_members (business_id);

insert into public.business_members (user_id, business_id, role)
select op.id, op.business_id, op.role
from public.owner_profiles op
on conflict (user_id, business_id) do nothing;

create or replace function public.is_business_owner(target_business_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.user_id = auth.uid()
      and bm.business_id = target_business_id
  )
  or exists (
    select 1
    from public.owner_profiles op
    where op.id = auth.uid()
      and op.business_id = target_business_id
  )
$$;

create or replace function public.current_business_id()
returns uuid
language sql
stable
as $$
  select business_id
  from public.business_members
  where user_id = auth.uid()
  order by created_at asc
  limit 1
$$;

alter table public.business_members enable row level security;

create policy "Members can read their memberships"
on public.business_members
for select
using (user_id = auth.uid());

create policy "Service role manages business members"
on public.business_members
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create trigger business_members_set_updated_at
before update on public.business_members
for each row execute function public.set_updated_at();
