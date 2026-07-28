-- Platform super-admins (FlashTor operator). Add rows via SQL / service role only.

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.platform_admins enable row level security;

create policy "Platform admins can read own admin row"
on public.platform_admins
for select
using (auth.uid() = user_id);

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins pa
    where pa.user_id = auth.uid()
  );
$$;

grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_platform_admin() to anon;

create policy "Platform admins read all businesses"
on public.businesses
for select
using (public.is_platform_admin());

create policy "Platform admins update all businesses"
on public.businesses
for update
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "Platform admins read all appointments"
on public.appointments
for select
using (public.is_platform_admin());

create policy "Platform admins read all waitlist"
on public.waitlist
for select
using (public.is_platform_admin());

create policy "Platform admins read all business members"
on public.business_members
for select
using (public.is_platform_admin());

create policy "Platform admins read all services"
on public.services
for select
using (public.is_platform_admin());

create policy "Platform admins read all notification logs"
on public.notification_logs
for select
using (public.is_platform_admin());
