# FlashTor Local Testing Guide

Use this guide for end-to-end validation: **owner mobile app**, **customer Web booking (no login)**, waitlist, WhatsApp reminders (24h / 2h / 1h), and confirm/cancel links.

Full checklist: [E2E_TEST.md](E2E_TEST.md). Product roles: [PRODUCT_FLOW.md](PRODUCT_FLOW.md).

## Recommended path (remote Supabase + local web tunnel)

1. Create a Supabase project in the dashboard.
2. Run migrations `001` through `005` in SQL Editor (or `npx supabase db push` after linking).
3. Optional seed: edit `supabase/seed-e2e.sql` (owner UUID) and run in SQL Editor.
4. Deploy Edge Functions:
   ```powershell
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase functions deploy
   ```
5. Set function secrets in Supabase Dashboard (Edge Functions):
   - `PUBLIC_APP_URL`
   - `WHATSAPP_PROVIDER`
   - `NOTIFICATION_WEBHOOK_URL` or Twilio/Green API keys
   - `CRON_SECRET`
6. Run web app locally on port `3000`.
7. Start tunnel:
   ```powershell
   .\scripts\tunnel-cloudflared.ps1 -Port 3000
   ```
8. Copy tunnel URL into:
   - Supabase secret `PUBLIC_APP_URL`
   - `mobile/.env` → `EXPO_PUBLIC_BOOKING_BASE_URL`
   - restart/redeploy functions if needed

Public booking URLs:
- By UUID: `https://YOUR_TUNNEL/book/YOUR_BUSINESS_UUID`
- By slug: `https://YOUR_TUNNEL/book/your-business-slug`

## Install tools on Windows

```powershell
winget install Cloudflare.cloudflared
npm install
npx supabase --version
```

`cloudflared` is already installed on your machine.

Optional tunnel alternative: `winget install ngrok.ngrok`

## Full local stack (optional)

Requires Docker Desktop.

```powershell
cd C:\Users\elior\OneDrive\Desktop\FlashTor
copy supabase\.env.example supabase\.env.local
npx supabase start
npx supabase db reset
.\scripts\serve-functions.ps1
```

## Environment files

| File | Purpose |
|------|---------|
| `.env.example` | Root reference for web/mobile |
| `supabase/.env.local` | Edge Functions local serve |
| `web/.env.local` | Next.js (`NEXT_PUBLIC_SUPABASE_URL`, publishable key) |
| `mobile/.env` | Expo owner app (`EXPO_PUBLIC_*`, `EXPO_PUBLIC_BOOKING_BASE_URL`) |

Mobile is **owner-only** (login required). Customers never use the app — only the public Web link from the owner dashboard card.

## End-to-end validation script

1. Create businesses and memberships (`business_members`) for owner accounts.
2. Customer books from `/book/{slug}` or `/book/{uuid}`.
3. Another customer joins waitlist for a full day.
4. Owner cancels an appointment from mobile.
5. Waitlist customer receives offer via WhatsApp.
6. Trigger reminders manually:
   ```powershell
   $env:SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
   $env:CRON_SECRET="YOUR_SECRET"
   .\scripts\trigger-reminders.ps1
   ```
7. Customer opens confirm/cancel links from WhatsApp.

## Cron in production

Schedule every 15 minutes. For manual QA, call `send-appointment-reminders` on demand.

## Troubleshooting

- **Links in WhatsApp do not open**: `PUBLIC_APP_URL` is wrong or tunnel URL changed.
- **Function 401**: check JWT settings in `supabase/config.toml` and auth headers.
- **No WhatsApp message**: verify provider env vars and `notification_logs`.
- **Owner cancel fails**: owner must be in `business_members` (or legacy `owner_profiles`) for that business.
