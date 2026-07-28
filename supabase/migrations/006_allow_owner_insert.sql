-- Enable authenticated users to register their business
create policy "Authenticated users can create a business"
on public.businesses
for insert
to authenticated
with check (true);

-- Enable authenticated users to register as member of their own business
create policy "Authenticated users can join business as member"
on public.business_members
for insert
to authenticated
with check (user_id = auth.uid());
