# Hosting the web app on GitHub Pages

FlashTor’s customer web UI is a **static Next.js export** deployed from this repo. Supabase (database, auth, Edge Functions, WhatsApp) stays in your Supabase project; the site only needs the public URL and anon (publishable) key at build time.

## Live URL

For repo `elior2oscar-dot/flashtor`:

**https://elior2oscar-dot.github.io/flashtor/**

Demo booking: `https://elior2oscar-dot.github.io/flashtor/demo/`

## One-time GitHub setup

1. **Repository secrets** (Settings → Secrets and variables → Actions):
   - `NEXT_PUBLIC_SUPABASE_URL` — e.g. `https://YOUR_REF.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase publishable / anon key (not the service role)

2. **GitHub Pages** (Settings → Pages):
   - **Source:** GitHub Actions (not “Deploy from a branch”)

3. **Supabase secrets** (Dashboard → Project Settings → Edge Functions, or CLI):
   - `PUBLIC_APP_URL` = `https://elior2oscar-dot.github.io/flashtor` (no trailing slash)
   - Redeploy Edge Functions after changing this so WhatsApp links use the new host.

4. **Mobile env** (for owner-shared booking links):
   - `EXPO_PUBLIC_BOOKING_BASE_URL` = same as `PUBLIC_APP_URL`

## Deploy

Push to `main` (with changes under `web/`) or run **Actions → Deploy web to GitHub Pages → Run workflow**.

Each deploy:

1. Loads businesses from Supabase and pre-renders `/book/{id}` and `/book/{slug}` pages.
2. Publishes static `confirm`, `cancel`, and `offer` pages (query-string tokens).

After you add a **new** business, run the workflow again (or push to `main`) so its `/book/...` path exists on Pages. Until then, use `/book?businessId=UUID` as a fallback.

## Link formats (WhatsApp / waitlist)

| Page    | URL pattern                                      |
|---------|--------------------------------------------------|
| Book    | `{PUBLIC_APP_URL}/book/{slug-or-uuid}/`          |
| Confirm | `{PUBLIC_APP_URL}/confirm?token=...`             |
| Cancel  | `{PUBLIC_APP_URL}/cancel?token=...`              |
| Offer   | `{PUBLIC_APP_URL}/offer?offerId=...`             |

## Local build (same as CI)

```powershell
cd web
copy .env.local.example .env.local   # fill NEXT_PUBLIC_*
npm ci
npm run build
npx serve out -l 3000
```

Open `http://localhost:3000/flashtor/`.

## What is not on GitHub Pages

- Supabase Edge Functions and cron (reminders, booking API)
- Mobile app (`mobile/`)
- Database migrations

Those remain in Supabase; only the static frontend is on `github.io`.
