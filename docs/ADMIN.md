# Admin access (FlashTor)

## 1. Business owner portal (public from the homepage)

- **Entry:** [Homepage](https://elior2oscar-dot.github.io/flashtor/) → **Owner portal login** (footer / hero link)
- **Direct URL:** `https://elior2oscar-dot.github.io/flashtor/portal/{slug}`
- **Example:** `/flashtor/portal/e2e-demo` (after running seed data)

Owners sign in with the **same Supabase account** as the mobile app. The app checks that the user belongs to the business matching that `slug` via `business_members` (or legacy `owner_profiles`).

**Features:** upcoming appointments, cancel appointment (triggers waitlist flow), waitlist view, copy customer booking link.

---

## 2. Platform admin (hidden — not linked on the public site)

- **Direct URL only:** `https://elior2oscar-dot.github.io/flashtor/admin`
- Not linked from the homepage, footer, or navigation.

### One-time setup in Supabase

1. Apply migration `007_platform_admins.sql` (or run `supabase db push`).
2. Create an Auth user for the platform operator (if needed).
3. Add them to the admins table (SQL Editor, using service role / dashboard):

```sql
insert into public.platform_admins (user_id)
select id from auth.users where email = 'YOUR_ADMIN_EMAIL@example.com'
on conflict (user_id) do nothing;
```

4. Sign in at `/admin` with that email and password.

If the insert matched **zero rows**, the Auth user did not exist yet or the email differs from login. Use the user id shown on the denied screen:

```sql
insert into public.platform_admins (user_id) values ('PASTE_USER_UUID_FROM_ADMIN_SCREEN')
on conflict (user_id) do nothing;
```

Also run `008_platform_admins_grants.sql` (or paste its SQL) so `authenticated` can `SELECT` on `platform_admins`.

**Troubleshooting “No platform admin permission”**

1. Confirm the admin row exists (SQL Editor):

```sql
select u.id, u.email, pa.created_at
from auth.users u
left join public.platform_admins pa on pa.user_id = u.id
where u.email = 'your@email.com';
```

If `created_at` is null, run the `INSERT` again **after** the Auth user exists.

2. Run migration `008_platform_admins_grants.sql` if table reads fail from the browser.

3. In the browser, the logged-in user id must match `platform_admins.user_id` (create the Auth user first, then insert).

**Features:** sidebar navigation (Dashboard, Clients, Team access), create/edit clients in modals (name, slug, phone, subscription plan/status), copy booking links, enable/disable businesses, create or link owner accounts via edge function.

**Database:** apply migrations `009_business_subscription.sql` and `010_platform_admin_manage.sql`.

**Edge function:** deploy `platform-admin-users` (JWT required) so admins can create Auth users and link them to a business:

```bash
supabase functions deploy platform-admin-users --project-ref rnfiykzkcwaxwpgnoexx
```

Without this function, client CRUD still works; only **Create account** / **Link existing user** will fail.

---

## Security notes

- Both UIs use the **anon (publishable) key** plus **RLS** — never the service role key in the browser.
- Platform admin access requires a row in `platform_admins`.
- After a new migration, redeploy GitHub Pages only if you changed the web app; RLS changes live in Supabase only.
