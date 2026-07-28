export type GoogleCalendarEvent = {
  id: string;
  summary: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startLabel: string;
  endLabel: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
            error_callback?: (error: { type?: string; message?: string }) => void;
          }) => { requestAccessToken: (override?: { prompt?: string }) => void };
        };
      };
    };
  }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

export function getGoogleClientId(): string | null {
  const id = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID?.trim();
  return id && !id.includes('PASTE') ? id : null;
}

function loadGisScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.google?.accounts?.oauth2) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-flashtor-gis]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google script')));
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.dataset.flashtorGis = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google script'));
    document.head.appendChild(script);
  });
}

export async function requestGoogleCalendarAccessToken(): Promise<string> {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error('חסר מזהה Google Client. הגדירו NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID.');
  }

  await loadGisScript();

  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services לא נטען.'));
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: CALENDAR_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error || 'ההרשאה ליומן גוגל נדחתה.'));
          return;
        }
        resolve(response.access_token);
      },
      error_callback: (error) => {
        reject(new Error(error.message || error.type || 'שגיאת התחברות לגוגל'));
      },
    });

    client.requestAccessToken({ prompt: '' });
  });
}

function toLocalDateString(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatHe(value: string, allDay: boolean): string {
  if (allDay || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${toLocalDateString(value)}T12:00:00`).toLocaleDateString('he-IL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }
  return new Date(value).toLocaleString('he-IL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function fetchUpcomingCalendarEvents(
  accessToken: string,
  daysAhead = 14
): Promise<GoogleCalendarEvent[]> {
  const timeMin = new Date();
  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + daysAhead);

  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`שגיאה בטעינת יומן גוגל (${res.status}): ${body.slice(0, 180)}`);
  }

  const payload = (await res.json()) as {
    items?: Array<{
      id?: string;
      summary?: string;
      status?: string;
      start?: { date?: string; dateTime?: string };
      end?: { date?: string; dateTime?: string };
    }>;
  };

  return (payload.items ?? [])
    .filter((item) => item.status !== 'cancelled' && item.id && (item.start?.date || item.start?.dateTime))
    .map((item) => {
      const allDay = Boolean(item.start?.date);
      const startRaw = item.start?.date || item.start?.dateTime || '';
      const endRaw = item.end?.date || item.end?.dateTime || startRaw;
      const startDate = toLocalDateString(startRaw);
      // Google all-day end is exclusive
      let endDate = toLocalDateString(endRaw);
      if (allDay && endDate > startDate) {
        const exclusive = new Date(`${endDate}T12:00:00`);
        exclusive.setDate(exclusive.getDate() - 1);
        endDate = toLocalDateString(exclusive.toISOString().slice(0, 10));
      }

      return {
        id: item.id!,
        summary: item.summary?.trim() || '(ללא כותרת)',
        startDate,
        endDate: endDate < startDate ? startDate : endDate,
        allDay,
        startLabel: formatHe(startRaw, allDay),
        endLabel: formatHe(endRaw, allDay),
      };
    });
}

export function datesCoveredByEvent(event: GoogleCalendarEvent): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${event.startDate}T12:00:00`);
  const end = new Date(`${event.endDate}T12:00:00`);
  while (cursor <= end) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, '0');
    const d = String(cursor.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}
