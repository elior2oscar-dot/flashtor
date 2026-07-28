# FlashTor

Uncapped, unlimited appointment and waitlist platform. **Owners** manage via mobile app; **customers** book via Web link and receive automated WhatsApp reminders (24h, 2h, 1h).

Product flow: [docs/PRODUCT_FLOW.md](docs/PRODUCT_FLOW.md)

Supabase connection: [docs/SUPABASE_CONNECTION.md](docs/SUPABASE_CONNECTION.md)

Platform principles: [docs/PLATFORM.md](docs/PLATFORM.md)

E2E test checklist: [docs/E2E_TEST.md](docs/E2E_TEST.md)

GitHub Pages (customer web): [docs/GITHUB_PAGES.md](docs/GITHUB_PAGES.md)

Admin & owner web portals: [docs/ADMIN.md](docs/ADMIN.md)
## Structure

- `supabase/migrations/001_initial_schema.sql`: production-oriented schema, auth mapping, RLS, waitlist offers, and notification logs
- `supabase/functions/create-booking/index.ts`: secure customer booking flow
- `supabase/functions/cancel-appointment/index.ts`: owner-only cancellation flow with waitlist trigger
- `supabase/functions/claim-waitlist-offer/index.ts`: customer claim flow for freed slots
- `supabase/functions/send-appointment-reminders/index.ts`: WhatsApp reminders 24h and 2h before appointments
- `supabase/functions/confirm-arrival/index.ts`: customer arrival confirmation flow
- `supabase/functions/cancel-appointment-by-token/index.ts`: customer self-service cancellation flow
- `web/app/book/[businessId]/page.tsx`: public booking page
- `web/app/offer/page.tsx`: public waitlist-offer claim page
- `web/app/confirm/page.tsx`: arrival confirmation page (linked from WhatsApp reminders)
- `web/app/cancel/page.tsx`: cancellation page (linked from WhatsApp reminders)
- `mobile/app/index.tsx`: owner-only mobile shell (login, calendar, waitlist, metrics, settings)

## Environment Variables

Copy values from `.env.example` into your actual environment setup for web, mobile, and Supabase Edge Functions.

## Notification Strategy

The MVP is wired as `WhatsApp-first`.

Supported providers in `supabase/functions/_shared/messaging.ts`:
- `WHATSAPP_PROVIDER=webhook`: forwards the payload to `NOTIFICATION_WEBHOOK_URL`
- `WHATSAPP_PROVIDER=twilio`: sends directly through Twilio WhatsApp
- `WHATSAPP_PROVIDER=green_api`: sends directly through Green API

If you choose Twilio or Green API, fill the matching environment variables from `.env.example`.

Reminder payloads include `actionButtons` (for example `אשר הגעה` and `בטל תור`) so your webhook layer can render native WhatsApp buttons if your provider supports them. The default message body also includes direct confirmation and cancellation URLs.

## Reminder Engine

1. Run migrations `supabase/migrations/002_reminder_engine.sql`, `003_reminder_cancellation.sql`, and `005_reminder_1h.sql`.
2. Deploy Edge Functions `send-appointment-reminders`, `confirm-arrival`, and `cancel-appointment-by-token`.
3. Schedule a cron job (every 15 minutes recommended) to call:

`POST {SUPABASE_URL}/functions/v1/send-appointment-reminders`

with header `x-cron-secret: {CRON_SECRET}` when `CRON_SECRET` is configured.

Customers receive WhatsApp reminders ~24 hours, ~2 hours, and ~1 hour before the appointment with links to `PUBLIC_APP_URL/confirm?token=...` and `PUBLIC_APP_URL/cancel?token=...`.

## Local Readiness Checklist

1. Fill `.env.example` values into your local env files for web/mobile and Supabase secrets.
2. Apply all SQL migrations in order.
3. Deploy or serve all Supabase Edge Functions locally.
4. Point `PUBLIC_APP_URL` to your reachable tunnel or production domain so WhatsApp links open correctly on customer devices.
5. If you use `WHATSAPP_PROVIDER=webhook`, make sure your webhook transforms `actionButtons` into the provider's native interactive button format.

## Local Testing Today

See the full step-by-step guide in [docs/LOCAL_TESTING.md](docs/LOCAL_TESTING.md).

Quick commands (PowerShell from repo root):

```powershell
winget install Supabase.CLI
copy supabase\.env.example supabase\.env.local
copy web\.env.local.example web\.env.local
.\scripts\start-web.ps1
.\scripts\tunnel-cloudflared.ps1
.\scripts\serve-functions.ps1
```
