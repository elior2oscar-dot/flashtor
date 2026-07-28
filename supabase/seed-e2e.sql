-- FlashTor E2E seed (run in Supabase SQL Editor after migrations 001–005)
--
-- 1. Create an owner in Authentication (email + password), copy the user UUID.
-- 2. Replace OWNER_USER_UUID below.
-- 3. Run this script.
-- 4. Log in to the mobile app with that owner account.
-- 5. Share /book/e2e-demo with a customer browser (no login).

do $$
declare
  owner_user_id_text text := 'OWNER_USER_UUID';
  owner_user_id uuid;
  biz_id uuid;
  svc_id uuid;
  slot_day timestamptz;
  d integer;
begin
  if owner_user_id_text = 'OWNER_USER_UUID' then
    raise exception 'Replace OWNER_USER_UUID with your Supabase Auth user id';
  end if;

  owner_user_id := owner_user_id_text::uuid;

  insert into public.businesses (name, phone, whatsapp_phone, slug, timezone)
  values ('E2E Demo Salon', '+972500000000', '+972500000000', 'e2e-demo', 'Asia/Jerusalem')
  on conflict (slug) do update set name = excluded.name
  returning id into biz_id;

  if biz_id is null then
    select id into biz_id from public.businesses where slug = 'e2e-demo';
  end if;

  insert into public.business_members (user_id, business_id, role)
  values (owner_user_id, biz_id, 'owner')
  on conflict (user_id, business_id) do nothing;

  select id into svc_id
  from public.services
  where business_id = biz_id and name = 'תספורת'
  limit 1;

  if svc_id is null then
    insert into public.services (business_id, name, duration_minutes, is_active)
    values (biz_id, 'תספורת', 30, true)
    returning id into svc_id;
  end if;

  for d in 0..6 loop
    insert into public.business_hours (business_id, day_of_week, opens_at, closes_at, is_closed)
    values (
      biz_id,
      d,
      time '09:00',
      time '18:00',
      d in (5, 6)
    )
    on conflict (business_id, day_of_week) do update
      set opens_at = excluded.opens_at,
          closes_at = excluded.closes_at,
          is_closed = excluded.is_closed;
  end loop;

  slot_day := date_trunc('day', timezone('Asia/Jerusalem', now()) + interval '2 days') at time zone 'Asia/Jerusalem';

  insert into public.appointment_slots (business_id, service_id, slot_start, slot_end, is_available)
  select
    biz_id,
    svc_id,
    slot_day + (h || ' hours')::interval,
    slot_day + (h || ' hours')::interval + interval '30 minutes',
    true
  from generate_series(10, 16) as h
  on conflict (business_id, slot_start) do update set is_available = true;

  raise notice 'E2E business id: %, slug: e2e-demo', biz_id;
end $$;
