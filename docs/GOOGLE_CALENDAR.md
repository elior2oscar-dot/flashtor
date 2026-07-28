# Google Calendar sync (owner portal)

Used from **הגדרות → סנכרון יומן גוגל**.

## One-time Google Cloud setup

1. Open [Google Cloud Console](https://console.cloud.google.com/) → create/select a project.
2. Enable **Google Calendar API**.
3. **APIs & Services → OAuth consent screen** (External or Internal):
   - App name: FlashTor
   - Scopes: add `.../auth/calendar.readonly`
4. **Credentials → Create credentials → OAuth client ID → Web application**
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `https://elior2oscar-dot.github.io`
   - Authorized redirect URIs (optional for GIS token client):
     - `http://localhost:3000`
     - `https://elior2oscar-dot.github.io`
5. Copy the **Client ID**.

## Configure FlashTor

`web/.env.local`:

```env
NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

GitHub Actions secret (same name) for Pages deploy.

## Flow

1. Owner clicks **סנכרן מול Google** and grants calendar read access.
2. FlashTor loads events for the next **14 days**.
3. A modal lists each event (pre-selected). Owner chooses which ones close booking days.
4. Confirmed days are written to `business_closure_dates` (same as manual closures) and block customer booking + show as closed in the owner calendar.
