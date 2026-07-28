# Supabase connection (FlashTor)

Project ref: **`rnfiykzkcwaxwpgnoexx`**

## API (web + mobile + Edge Functions)

| Variable | Where |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `web/.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable key |
| `EXPO_PUBLIC_*` | `mobile/.env` |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | `supabase/.env.local` |

Dashboard: **Settings → API Keys** (same project).

## Postgres (migrations CLI)

Direct connection:

```text
postgresql://postgres:[YOUR-PASSWORD]@db.rnfiykzkcwaxwpgnoexx.supabase.co:5432/postgres
```

Set in `supabase/.env.local`:

- `SUPABASE_DB_PASSWORD` — database password  
- Or full `DATABASE_URL` (percent-encode special characters in the password)

Apply schema:

```powershell
npm install pg
node scripts/apply-migrations-pg.js
node scripts/bootstrap-demo-data.js
```

Or: `.\scripts\push-db.ps1` (after `SUPABASE_DB_PASSWORD` is set).

## Supabase CLI link

```powershell
npx supabase login
npx supabase link --project-ref rnfiykzkcwaxwpgnoexx --password YOUR_DB_PASSWORD
npx supabase db push
```

## Agent Skills (optional)

```powershell
npx skills add supabase/agent-skills
```
