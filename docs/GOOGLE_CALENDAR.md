# Google Calendar sync — setup guide (FlashTor)

This connects the **owner portal** (**הגדרות → סנכרון יומן גוגל**) to the owner’s primary Google Calendar.

FlashTor only **reads** calendar events (next 14 days). It never writes to Google Calendar.

---

## A. Create / open a Google Cloud project

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Top bar → project picker → **New Project** (or select an existing one).
3. Name example: `FlashTor` → **Create**.

---

## B. Enable Google Calendar API

1. Open [API Library — Calendar API](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com).
2. Make sure your FlashTor project is selected.
3. Click **Enable**.

---

## C. Configure the OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**.
2. Choose:
   - **External** — for personal Gmail accounts (normal for you), or  
   - **Internal** — only if you use Google Workspace and everyone is in that org.
3. Click **Create**.
4. Fill:
   - **App name:** `FlashTor`
   - **User support email:** your email
   - **Developer contact:** your email
5. Click **Save and Continue**.
6. **Scopes** → **Add or remove scopes** → search and add:
   - `https://www.googleapis.com/auth/calendar.readonly`
7. **Save and Continue**.
8. **Test users** (if app is in Testing):
   - **Add users** → add the Gmail you’ll use to sync (e.g. `elior2oscar@gmail.com`).
9. **Save and Continue** → back to dashboard.

> While the app is in **Testing**, only listed test users can connect. For production later you can submit for verification (optional for a small private tool).

---

## D. Create an OAuth Web Client ID

1. Go to **APIs & Services → Credentials**.
2. **Create credentials → OAuth client ID**.
3. Application type: **Web application**.
4. Name: `FlashTor Web`.
5. **Authorized JavaScript origins** → **Add URI**:
   - `http://localhost:3000` (local Next.js)
   - `https://elior2oscar-dot.github.io` (GitHub Pages)
6. **Authorized redirect URIs** → **Add URI** (recommended):
   - `http://localhost:3000`
   - `https://elior2oscar-dot.github.io`
   - `https://elior2oscar-dot.github.io/flashtor`
7. Click **Create**.
8. Copy the **Client ID**  
   (looks like `123456789-xxxx.apps.googleusercontent.com`).  
   You do **not** need the Client Secret for this browser flow.

---

## E. Put the Client ID into FlashTor

### Local (`web/.env.local`)

```env
NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
```

Restart the web app after saving (`cd web` → `npm run dev`).

### GitHub Pages (production)

1. GitHub repo → **Settings → Secrets and variables → Actions**.
2. **New repository secret**:
   - Name: `NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID`
   - Value: the same Client ID
3. Re-run the **Deploy web to GitHub Pages** workflow (or push any small change to `web/`).

---

## F. How to use it in the app

1. Open owner portal:  
   `https://elior2oscar-dot.github.io/flashtor/portal/demo-studio/`
2. Sign in as the business owner.
3. Go to **הגדרות**.
4. Under **סנכרון יומן גוגל** click **סנכרן מול Google**.
5. Choose the Google account and allow calendar access.
6. Review events for the next **2 weeks**.
7. Keep checked the events whose days should be closed for customer booking.
8. Click **סגור תורים לפי הבחירה**.

Those days are saved as closures (same as “יום סגור” / חופשות) and:

- Block booking on the customer calendar  
- Show as closed on the owner calendar  

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| Button disabled / yellow setup message | Client ID missing in `.env.local` or GitHub secret; rebuild/redeploy. |
| `redirect_uri_mismatch` / origin error | Add exact origins from section D (no trailing slash on `github.io` origin). |
| Access blocked: app in testing | Add your Gmail under **OAuth consent → Test users**. |
| No events found | Check primary Google Calendar has events in the next 14 days. |
| Popup blocked | Allow popups for the FlashTor site. |

---

## Security notes

- Scope is **read-only** (`calendar.readonly`).
- Access token stays in the browser for that sync session; it is not stored in FlashTor DB.
- Never commit Client Secret or put service-account keys in the web app.
