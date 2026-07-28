'use client';

import { useState } from 'react';
import { CalendarSync } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';

import { Modal } from '@/components/admin/Modal';
import { Button } from '@/components/ui/button';
import {
  datesCoveredByEvent,
  fetchUpcomingCalendarEvents,
  getGoogleClientId,
  requestGoogleCalendarAccessToken,
  type GoogleCalendarEvent,
} from '@/lib/googleCalendar';

type OwnerGoogleCalendarSyncProps = {
  supabase: SupabaseClient;
  businessId: string;
  onApplied: () => Promise<void> | void;
};

type RowState = {
  event: GoogleCalendarEvent;
  selected: boolean;
};

export function OwnerGoogleCalendarSync({ supabase, businessId, onApplied }: OwnerGoogleCalendarSyncProps) {
  const clientConfigured = Boolean(getGoogleClientId());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<RowState[]>([]);

  async function startSync() {
    setError('');
    setLoading(true);
    try {
      const token = await requestGoogleCalendarAccessToken();
      const events = await fetchUpcomingCalendarEvents(token, 14);
      if (events.length === 0) {
        setError('לא נמצאו אירועים ביומן גוגל בשבועיים הקרובים.');
        setLoading(false);
        return;
      }
      setRows(events.map((event) => ({ event, selected: true })));
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'סנכרון נכשל.');
    } finally {
      setLoading(false);
    }
  }

  function toggleRow(id: string) {
    setRows((prev) => prev.map((r) => (r.event.id === id ? { ...r, selected: !r.selected } : r)));
  }

  function selectAll(value: boolean) {
    setRows((prev) => prev.map((r) => ({ ...r, selected: value })));
  }

  async function applySelectedClosures() {
    const selected = rows.filter((r) => r.selected);
    if (selected.length === 0) {
      setError('בחרו לפחות אירוע אחד לסגירה.');
      return;
    }

    const dateMap = new Map<string, string>();
    for (const row of selected) {
      for (const date of datesCoveredByEvent(row.event)) {
        const label = `גוגל: ${row.event.summary}`.slice(0, 120);
        if (!dateMap.has(date)) dateMap.set(date, label);
      }
    }

    const payload = [...dateMap.entries()].map(([closure_date, label]) => ({
      business_id: businessId,
      closure_date,
      label,
    }));

    setSaving(true);
    setError('');
    const { error: upsertError } = await supabase.from('business_closure_dates').upsert(payload, {
      onConflict: 'business_id,closure_date',
    });
    setSaving(false);

    if (upsertError) {
      setError(upsertError.message);
      return;
    }

    setOpen(false);
    setRows([]);
    await onApplied();
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">סנכרון יומן גוגל</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            מושך אירועים מהיומן הראשי לשבועיים הקרובים ושואל אילו ימים לסגור להזמנות.
          </p>
        </div>
        <Button type="button" size="sm" className="gap-1" disabled={loading || !clientConfigured} onClick={() => void startSync()}>
          <CalendarSync className="size-4" />
          {loading ? 'מתחבר…' : 'סנכרן מול Google'}
        </Button>
      </div>

      {!clientConfigured ? (
        <p className="mt-3 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          כדי להפעיל: צרו OAuth Client ב־Google Cloud והגדירו{' '}
          <code className="text-xs">NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID</code> ב־
          <code className="text-xs">web/.env.local</code> וב־GitHub Secrets.
        </p>
      ) : null}

      {error && !open ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      <Modal
        open={open}
        title="אירועים מיומן גוגל"
        description="סמנו אילו אירועים יסגרו את הימים המתאימים להזמנות לקוחות."
        onClose={() => setOpen(false)}
        wide
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => selectAll(true)}>
                סמן הכל
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => selectAll(false)}>
                בטל הכל
              </Button>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                ביטול
              </Button>
              <Button type="button" onClick={() => void applySelectedClosures()} disabled={saving}>
                {saving ? 'סוגר תורים…' : 'סגור תורים לפי הבחירה'}
              </Button>
            </div>
          </div>
        }
      >
        <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
          {rows.map(({ event, selected }) => (
            <li key={event.id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background px-3 py-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selected}
                  onChange={() => toggleRow(event.id)}
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{event.summary}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {event.startDate === event.endDate
                      ? event.startLabel
                      : `${event.startLabel} – ${event.endLabel}`}
                    {event.allDay ? ' · יום שלם' : ''}
                  </span>
                  <span className="mt-1 block text-xs text-amber-800">
                    ייסגר{datesCoveredByEvent(event).length > 1 ? 'ו' : ''}:{' '}
                    {datesCoveredByEvent(event).join(', ')}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      </Modal>
    </section>
  );
}
