# FlashTor Platform Principles

FlashTor is an **uncapped, unlimited** appointment and waitlist platform with a strict channel split:

- **Owners** use the mobile app.
- **Customers** use public Web links and WhatsApp only.

See [docs/PRODUCT_FLOW.md](PRODUCT_FLOW.md).

- No hard-coded limits on businesses, customers, appointments, or waitlist entries in application code.
- Multi-business membership via `business_members` (one user can manage many businesses).
- Public booking supports business `id` or `slug` without changing URLs per tenant.
- Messaging volume scales with your WhatsApp provider plan; FlashTor does not impose artificial message quotas in code.

Operational scaling (when you grow):

- Supabase project tier and connection limits
- Edge Function concurrency
- WhatsApp provider throughput
- Cron frequency for reminders

The schema and RLS are designed for horizontal growth: every core table is keyed by `business_id` with indexes for time/status queries.
