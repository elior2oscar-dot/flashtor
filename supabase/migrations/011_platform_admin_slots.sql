-- Platform admins can seed services and appointment slots when onboarding clients.

create policy "Platform admins manage services"
on public.services
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "Platform admins manage appointment slots"
on public.appointment_slots
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());
