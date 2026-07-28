-- Platform admins can manage clients, members, and default hours from the web admin UI.

create policy "Platform admins insert businesses"
on public.businesses
for insert
to authenticated
with check (public.is_platform_admin());

create policy "Platform admins delete businesses"
on public.businesses
for delete
to authenticated
using (public.is_platform_admin());

create policy "Platform admins manage business members"
on public.business_members
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "Platform admins manage business hours"
on public.business_hours
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());
