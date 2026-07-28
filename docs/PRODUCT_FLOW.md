# FlashTor Product Flow

## Roles

| Role | Channel | Auth | Actions |
|------|---------|------|---------|
| Business owner | Mobile app (Expo) | Supabase login required | Manage calendar, waitlist, settings, cancel appointments |
| Customer | Public Web page | None | Book slot or join waitlist via link |
| Customer | WhatsApp | None | Receive reminders, confirm arrival, cancel via links |

Customers never install the mobile app.

## Customer journey (Web + WhatsApp)

1. Owner shares booking link: `{PUBLIC_APP_URL}/book/{slug-or-uuid}`.
2. Customer selects service, date, slot (or joins waitlist).
3. Booking is stored in Supabase.
4. Cron triggers `send-appointment-reminders`:
   - 24 hours before
   - 2 hours before
   - 1 hour before
5. WhatsApp message includes confirm/cancel links (`/confirm/{token}`, `/cancel/{token}`).
6. If owner cancels from mobile, waitlist automation notifies waiting customers.

## Owner journey (Mobile only)

1. Owner signs in (`OwnerLoginScreen`).
2. Owner selects business (if multiple memberships).
3. Owner copies customer Web link from dashboard card.
4. Owner manages appointments/waitlist/metrics/settings.
