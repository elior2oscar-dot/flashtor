-- Public business profile: social links, gallery, price list, contact shortcuts.

alter table public.businesses
  add column if not exists profile_tagline text,
  add column if not exists instagram_url text,
  add column if not exists tiktok_url text,
  add column if not exists waze_url text,
  add column if not exists price_catalog_pdf_url text;

create table if not exists public.business_gallery_images (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_business_gallery_business
  on public.business_gallery_images (business_id, sort_order);

create table if not exists public.business_price_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  price_ils numeric(10, 2),
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_business_price_items_business
  on public.business_price_items (business_id, sort_order);

alter table public.business_gallery_images enable row level security;
alter table public.business_price_items enable row level security;

create policy "Public read gallery for active businesses"
on public.business_gallery_images for select
using (exists (
  select 1 from public.businesses b
  where b.id = business_id and b.is_active = true
));

create policy "Owners manage gallery"
on public.business_gallery_images for all
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

create policy "Platform admins manage gallery"
on public.business_gallery_images for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "Public read prices for active businesses"
on public.business_price_items for select
using (exists (
  select 1 from public.businesses b
  where b.id = business_id and b.is_active = true
));

create policy "Owners manage prices"
on public.business_price_items for all
using (public.is_business_owner(business_id))
with check (public.is_business_owner(business_id));

create policy "Platform admins manage prices"
on public.business_price_items for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create trigger business_price_items_set_updated_at
before update on public.business_price_items
for each row execute function public.set_updated_at();

-- Public media bucket (images + PDF price lists)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-media',
  'business-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read business media" on storage.objects;
drop policy if exists "Authenticated upload business media" on storage.objects;
drop policy if exists "Authenticated update business media" on storage.objects;
drop policy if exists "Authenticated delete business media" on storage.objects;

create policy "Public read business media"
on storage.objects for select
using (bucket_id = 'business-media');

create policy "Authenticated upload business media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'business-media');

create policy "Authenticated update business media"
on storage.objects for update
to authenticated
using (bucket_id = 'business-media')
with check (bucket_id = 'business-media');

create policy "Authenticated delete business media"
on storage.objects for delete
to authenticated
using (bucket_id = 'business-media');
