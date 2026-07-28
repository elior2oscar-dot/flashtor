'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field, Modal, inputClassName } from '@/components/admin/Modal';
import type { SupabaseClient } from '@supabase/supabase-js';

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
  const [newClosureDate, setNewClosureDate] = useState('');
  const [staffModal, setStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', imageUrl: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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

  async function addClosure() {
    if (!newClosureDate) return;
    await supabase.from('business_closure_dates').insert({
      business_id: businessId,
      closure_date: newClosureDate,
      label: 'חופשה',
    });
    setNewClosureDate('');
    await load();
  }

  async function removeClosure(id: string) {
    await supabase.from('business_closure_dates').delete().eq('id', id);
    await load();
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

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-lg font-semibold">חופשות / סגירות</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            type="date"
            className={inputClassName}
            value={newClosureDate}
            onChange={(e) => setNewClosureDate(e.target.value)}
          />
          <Button type="button" size="sm" onClick={() => void addClosure()}>
            הוסף תאריך סגור
          </Button>
        </div>
        <ul className="mt-3 space-y-1 text-sm">
          {closures.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 rounded border border-border px-3 py-2">
              <span>{c.closure_date}</span>
              <button type="button" className="text-destructive underline" onClick={() => void removeClosure(c.id)}>
                הסר
              </button>
            </li>
          ))}
        </ul>
      </section>

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
