'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Field, Modal, inputClassName } from '@/components/admin/Modal';
import { OwnerGoogleCalendarSync } from '@/components/owner/OwnerGoogleCalendarSync';
import type { SupabaseClient } from '@supabase/supabase-js';
import { addDays, toDateInputValue } from '@/lib/scheduling';

type StaffRow = {
  id: string;
  display_name: string;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
};

type HourRow = {
  day_of_week: number;
  opens_at: string;
  closes_at: string;
  is_closed: boolean;
};

const DAY_LABELS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

type OwnerSettingsPanelProps = {
  supabase: SupabaseClient;
  businessId: string;
};

export function OwnerSettingsPanel({ supabase, businessId }: OwnerSettingsPanelProps) {
  const [parallelCapacity, setParallelCapacity] = useState(1);
  const [hours, setHours] = useState<HourRow[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [closures, setClosures] = useState<{ id: string; closure_date: string; label: string | null }[]>([]);
  const [closureModal, setClosureModal] = useState(false);
  const [closureStart, setClosureStart] = useState('');
  const [closureEnd, setClosureEnd] = useState('');
  const [closureLabel, setClosureLabel] = useState('חופשה');
  const [closureError, setClosureError] = useState('');
  const [closureSaving, setClosureSaving] = useState(false);
  const [staffModal, setStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', imageUrl: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [singleDate, setSingleDate] = useState('');
  const [singleDateSaving, setSingleDateSaving] = useState(false);
  const [singleDateError, setSingleDateError] = useState('');

  /** Collapse consecutive single-day closures into ranges for display. */
  const closureRanges = useMemo(() => {
    const sorted = [...closures].sort((a, b) => a.closure_date.localeCompare(b.closure_date));
    const ranges: { start: string; end: string; label: string | null; ids: string[] }[] = [];
    for (const row of sorted) {
      const last = ranges[ranges.length - 1];
      if (last) {
        const nextDay = toDateInputValue(addDays(new Date(`${last.end}T12:00:00`), 1));
        if (row.closure_date === nextDay && (row.label ?? '') === (last.label ?? '')) {
          last.end = row.closure_date;
          last.ids.push(row.id);
          continue;
        }
      }
      ranges.push({
        start: row.closure_date,
        end: row.closure_date,
        label: row.label,
        ids: [row.id],
      });
    }
    return ranges;
  }, [closures]);

  const singleDayClosures = useMemo(
    () => closureRanges.filter((r) => r.start === r.end),
    [closureRanges]
  );

  const vacationRanges = useMemo(
    () => closureRanges.filter((r) => r.start !== r.end),
    [closureRanges]
  );

  const load = useCallback(async () => {
    const [bizRes, hoursRes, staffRes, closureRes] = await Promise.all([
      supabase.from('businesses').select('booking_parallel_capacity').eq('id', businessId).single(),
      supabase.from('business_hours').select('day_of_week, opens_at, closes_at, is_closed').eq('business_id', businessId).order('day_of_week'),
      supabase.from('staff_members').select('id, display_name, image_url, is_active, sort_order').eq('business_id', businessId).order('sort_order'),
      supabase.from('business_closure_dates').select('id, closure_date, label').eq('business_id', businessId).order('closure_date'),
    ]);

    if (bizRes.data?.booking_parallel_capacity) {
      setParallelCapacity(bizRes.data.booking_parallel_capacity);
    }
    setHours((hoursRes.data as HourRow[]) ?? []);
    setStaff((staffRes.data as StaffRow[]) ?? []);
    setClosures(closureRes.data ?? []);
  }, [supabase, businessId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveCapacity() {
    setSaving(true);
    await supabase.from('businesses').update({ booking_parallel_capacity: parallelCapacity }).eq('id', businessId);
    setSaving(false);
    setMessage('נשמר');
  }

  async function saveHour(row: HourRow) {
    await supabase
      .from('business_hours')
      .upsert({ business_id: businessId, ...row }, { onConflict: 'business_id,day_of_week' });
    await load();
  }

  async function addSingleClosedDate() {
    setSingleDateError('');
    if (!singleDate) {
      setSingleDateError('בחרו תאריך לסגירה.');
      return;
    }

    setSingleDateSaving(true);
    const { error } = await supabase.from('business_closure_dates').upsert(
      {
        business_id: businessId,
        closure_date: singleDate,
        label: 'יום סגור',
      },
      { onConflict: 'business_id,closure_date' }
    );
    setSingleDateSaving(false);

    if (error) {
      setSingleDateError(error.message);
      return;
    }

    setSingleDate('');
    await load();
  }

  function openClosureModal() {
    const today = toDateInputValue(new Date());
    setClosureStart(today);
    setClosureEnd(today);
    setClosureLabel('חופשה');
    setClosureError('');
    setClosureModal(true);
  }

  async function addClosureRange() {
    setClosureError('');
    if (!closureStart || !closureEnd) {
      setClosureError('יש לבחור תאריך התחלה וסיום.');
      return;
    }
    if (closureEnd < closureStart) {
      setClosureError('תאריך הסיום חייב להיות אחרי תאריך ההתחלה.');
      return;
    }

    const rows: { business_id: string; closure_date: string; label: string }[] = [];
    let cursor = new Date(`${closureStart}T12:00:00`);
    const end = new Date(`${closureEnd}T12:00:00`);
    while (cursor <= end) {
      rows.push({
        business_id: businessId,
        closure_date: toDateInputValue(cursor),
        label: closureLabel.trim() || 'חופשה',
      });
      cursor = addDays(cursor, 1);
    }

    setClosureSaving(true);
    const { error } = await supabase.from('business_closure_dates').upsert(rows, {
      onConflict: 'business_id,closure_date',
      ignoreDuplicates: false,
    });
    setClosureSaving(false);

    if (error) {
      setClosureError(error.message);
      return;
    }

    setClosureModal(false);
    await load();
  }

  async function removeClosureRange(ids: string[]) {
    await supabase.from('business_closure_dates').delete().in('id', ids);
    await load();
  }

  function formatClosureRange(start: string, end: string) {
    const s = new Date(`${start}T12:00:00`).toLocaleDateString('he-IL');
    const e = new Date(`${end}T12:00:00`).toLocaleDateString('he-IL');
    return start === end ? s : `${s} – ${e}`;
  }

  async function addStaff() {
    await supabase.from('staff_members').insert({
      business_id: businessId,
      display_name: staffForm.name.trim(),
      image_url: staffForm.imageUrl.trim() || null,
      sort_order: staff.length,
    });
    setStaffForm({ name: '', imageUrl: '' });
    setStaffModal(false);
    await load();
  }

  return (
    <div className="space-y-8">
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-lg font-semibold">מקביליות (כיסאות / עובדים)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          מספר תורים במקביל באותה שעה (לפי עובדים פעילים).
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            כמות
            <input
              type="number"
              min={1}
              max={10}
              className={`${inputClassName} mt-1 w-24`}
              value={parallelCapacity}
              onChange={(e) => setParallelCapacity(Number(e.target.value))}
            />
          </label>
          <Button type="button" size="sm" disabled={saving} onClick={() => void saveCapacity()}>
            שמור
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">צוות</h2>
          <Button type="button" size="sm" onClick={() => setStaffModal(true)}>
            הוסף עובד
          </Button>
        </div>
        <ul className="mt-4 space-y-3">
          {staff.length === 0 ? (
            <li className="text-sm text-muted-foreground">אין עובדים — יוצג תור אחד לכל שעה.</li>
          ) : (
            staff.map((s) => (
              <li key={s.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                {s.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.image_url} alt="" className="size-12 rounded-full object-cover" />
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted text-sm font-bold">
                    {s.display_name.slice(0, 1)}
                  </div>
                )}
                <span className="font-medium">{s.display_name}</span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-lg font-semibold">ימי עבודה</h2>
        <div className="mt-4 space-y-2">
          {hours.map((h) => (
            <div key={h.day_of_week} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="w-6 font-medium">{DAY_LABELS[h.day_of_week]}</span>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={!h.is_closed}
                  onChange={(e) => {
                    const next = { ...h, is_closed: !e.target.checked };
                    setHours((prev) => prev.map((x) => (x.day_of_week === h.day_of_week ? next : x)));
                    void saveHour(next);
                  }}
                />
                פתוח
              </label>
              <input
                type="time"
                className="rounded border border-input px-2 py-1"
                value={h.opens_at.slice(0, 5)}
                disabled={h.is_closed}
                onChange={(e) => {
                  const next = { ...h, opens_at: e.target.value };
                  setHours((prev) => prev.map((x) => (x.day_of_week === h.day_of_week ? next : x)));
                }}
                onBlur={() => void saveHour(h)}
              />
              <span>–</span>
              <input
                type="time"
                className="rounded border border-input px-2 py-1"
                value={h.closes_at.slice(0, 5)}
                disabled={h.is_closed}
                onChange={(e) => {
                  const next = { ...h, closes_at: e.target.value };
                  setHours((prev) => prev.map((x) => (x.day_of_week === h.day_of_week ? next : x)));
                }}
                onBlur={() => void saveHour(h)}
              />
            </div>
          ))}
        </div>
      </section>

      <OwnerGoogleCalendarSync supabase={supabase} businessId={businessId} onApplied={load} />

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-lg font-semibold">סגירת תאריך ספציפי</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          בחרו יום אחד — הוא ייחסם ביומן ההזמנות של הלקוחות.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            תאריך
            <input
              type="date"
              className={`${inputClassName} mt-1 min-w-[11rem]`}
              value={singleDate}
              onChange={(e) => setSingleDate(e.target.value)}
            />
          </label>
          <Button type="button" size="sm" disabled={singleDateSaving} onClick={() => void addSingleClosedDate()}>
            {singleDateSaving ? 'שומר…' : 'סגור תאריך זה'}
          </Button>
        </div>
        {singleDateError ? <p className="mt-2 text-sm text-red-500">{singleDateError}</p> : null}
        <ul className="mt-4 space-y-2 text-sm">
          {singleDayClosures.length === 0 ? (
            <li className="rounded-lg border border-dashed border-border px-4 py-4 text-center text-muted-foreground">
              אין תאריכים סגורים בודדים.
            </li>
          ) : (
            singleDayClosures.map((r) => (
              <li
                key={r.ids[0]}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3"
              >
                <div>
                  <p className="font-medium">{formatClosureRange(r.start, r.end)}</p>
                  <p className="text-xs text-amber-800">{r.label ?? 'יום סגור'} · חסום ביומן</p>
                </div>
                <button
                  type="button"
                  className="text-destructive underline"
                  onClick={() => void removeClosureRange(r.ids)}
                >
                  פתח מחדש
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">חופשות / סגירות</h2>
            <p className="mt-1 text-sm text-muted-foreground">הגדירו טווח תאריכים — כל הימים בטווח ייסגרו להזמנות.</p>
          </div>
          <Button type="button" size="sm" className="gap-1" onClick={openClosureModal}>
            <Plus className="size-4" />
            הוסף חופשה
          </Button>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {vacationRanges.length === 0 ? (
            <li className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-muted-foreground">
              אין חופשות. לחצו על &quot;הוסף חופשה&quot; לבחירת תאריך התחלה וסיום.
            </li>
          ) : (
            vacationRanges.map((r) => (
              <li
                key={`${r.start}-${r.end}-${r.ids[0]}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-3"
              >
                <div>
                  <p className="font-medium">{formatClosureRange(r.start, r.end)}</p>
                  <p className="text-xs text-muted-foreground">{r.label ?? 'חופשה'}</p>
                </div>
                <button
                  type="button"
                  className="text-destructive underline"
                  onClick={() => void removeClosureRange(r.ids)}
                >
                  הסר
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <Modal
        open={closureModal}
        title="הוספת חופשה / סגירה"
        description="בחרו תאריך התחלה ותאריך סיום."
        onClose={() => setClosureModal(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setClosureModal(false)} disabled={closureSaving}>
              ביטול
            </Button>
            <Button type="button" onClick={() => void addClosureRange()} disabled={closureSaving}>
              {closureSaving ? 'שומר…' : 'שמור טווח'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="תאריך התחלה">
              <input
                type="date"
                className={inputClassName}
                value={closureStart}
                onChange={(e) => {
                  const v = e.target.value;
                  setClosureStart(v);
                  if (closureEnd && closureEnd < v) setClosureEnd(v);
                }}
                required
              />
            </Field>
            <Field label="תאריך סיום">
              <input
                type="date"
                className={inputClassName}
                value={closureEnd}
                min={closureStart || undefined}
                onChange={(e) => setClosureEnd(e.target.value)}
                required
              />
            </Field>
          </div>
          <Field label="תיאור (אופציונלי)">
            <input
              className={inputClassName}
              value={closureLabel}
              onChange={(e) => setClosureLabel(e.target.value)}
              placeholder="חופשה"
            />
          </Field>
          {closureError ? <p className="text-sm text-red-500">{closureError}</p> : null}
        </div>
      </Modal>

      <Modal open={staffModal} title="עובד חדש" onClose={() => setStaffModal(false)}>
        <div className="space-y-3">
          <Field label="שם">
            <input className={inputClassName} value={staffForm.name} onChange={(e) => setStaffForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="קישור לתמונה (URL)">
            <input className={inputClassName} value={staffForm.imageUrl} onChange={(e) => setStaffForm((f) => ({ ...f, imageUrl: e.target.value }))} />
          </Field>
          <Button type="button" className="w-full" onClick={() => void addStaff()}>
            שמור
          </Button>
        </div>
      </Modal>
    </div>
  );
}
