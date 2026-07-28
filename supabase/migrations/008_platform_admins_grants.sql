-- Ensure authenticated users can read their own platform_admins row (RLS still applies).

grant select on public.platform_admins to authenticated;

grant execute on function public.is_platform_admin() to authenticated;
