# End-to-End Test Checklist (Real Run)

## Prerequisites

- [ ] Migrations `001`–`005` applied
- [ ] Edge Functions deployed
- [ ] Secrets set: `PUBLIC_APP_URL`, WhatsApp provider vars, `CRON_SECRET`
- [ ] `web/.env.local` filled (Supabase URL + publishable key)
- [ ] `mobile/.env` filled (`EXPO_PUBLIC_*` + `EXPO_PUBLIC_BOOKING_BASE_URL` = tunnel/production web URL)
- [ ] Owner auth user exists in Supabase Auth
- [ ] `business_members` row links owner user to business
- [ ] At least one active service + available `appointment_slots`

## Run services

Terminal A:
```powershell
.\scripts\start-web.ps1
```

Terminal B:
```powershell
.\scripts\tunnel-cloudflared.ps1 -Port 3000
```

Update `PUBLIC_APP_URL` + `EXPO_PUBLIC_BOOKING_BASE_URL` to tunnel URL, redeploy/update secrets if needed.

## Test steps

1. **Owner mobile login**
   - Open Expo app, sign in as owner.
   - Verify tabs: יומן תורים, רשימת המתנה, ביצועים, הגדרות עסק.

2. **Customer booking (Web, no login)**
   - Open booking link from owner dashboard card in incognito browser.
   - Book appointment with name + phone.

3. **Owner sees booking**
   - Refresh appointments tab in mobile app.

4. **Waitlist path**
   - Book out all slots for a day (or use full day without slots).
   - Join waitlist from Web as another customer.
   - Owner cancels one booked appointment.
   - Verify waitlist offer notification log / WhatsApp.

5. **Reminders**
   - Create appointment ~24h / 2h / 1h ahead (or adjust appointment_time for QA).
   - Trigger:
     ```powershell
     .\scripts\trigger-reminders.ps1
     ```
   - Verify `notification_logs` entries for `reminder_24h`, `reminder_2h`, `reminder_1h`.

6. **Customer confirm/cancel links**
   - Open confirm link from reminder payload.
   - Open cancel link and verify appointment cancelled + slot reopened.

## Pass criteria

- Customer completes flow without app install or login.
- Owner manages everything from mobile only.
- Reminder pipeline sends all configured stages.
- Waitlist recovery works after cancellation.
