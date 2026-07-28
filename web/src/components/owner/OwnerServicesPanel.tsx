'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';

import { Field, Modal, inputClassName } from '@/components/admin/Modal';
import { Button } from '@/components/ui/button';

type ServiceRow = {
  id: string;
  name: string;
  duration_minutes: number;
  price_ils: number | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
};

type FormState = {
  name: string;
  duration: string;
  price: string;
  description: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  name: '',
  duration: '60',
  price: '',
  description: '',
  is_active: true,
};

type OwnerServicesPanelProps = {
  supabase: SupabaseClient;
  businessId: string;
};

export function OwnerServicesPanel({ supabase, businessId }: OwnerServicesPanelProps) {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('services')
      .select('id, name, duration_minutes, price_ils, description, is_active, sort_order')
      .eq('business_id', businessId)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      setErr(error.message);
      return;
    }
    setServices((data as ServiceRow[]) ?? []);
  }, [supabase, businessId]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setErr('');
    setModalOpen(true);
  }

  function openEdit(row: ServiceRow) {
    setEditingId(row.id);
    setForm({
      name: row.name,
      duration: String(row.duration_minutes),
      price: row.price_ils != null ? String(row.price_ils) : '',
      description: row.description ?? '',
      is_active: row.is_active,
    });
    setErr('');
    setModalOpen(true);
  }

  async function saveService() {
    const name = form.name.trim();
    const duration = Number(form.duration);
    if (!name) {
      setErr('יש להזין שם טיפול.');
      return;
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      setErr('משך הטיפול חייב להיות מספר דקות חיובי.');
      return;
    }

    const priceRaw = form.price.trim();
    const price_ils = priceRaw === '' ? null : Number(priceRaw);
    if (price_ils != null && (!Number.isFinite(price_ils) || price_ils < 0)) {
      setErr('מחיר לא תקין.');
      return;
    }

    setSaving(true);
    setErr('');

    const payload = {
      name,
      duration_minutes: Math.round(duration),
      price_ils,
      description: form.description.trim() || null,
      is_active: form.is_active,
    };

    if (editingId) {
      const { error } = await supabase.from('services').update(payload).eq('id', editingId).eq('business_id', businessId);
      setSaving(false);
      if (error) {
        setErr(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('services').insert({
        business_id: businessId,
        ...payload,
        sort_order: services.length,
      });
      setSaving(false);
      if (error) {
        setErr(error.message);
        return;
      }
    }

    setModalOpen(false);
    setMsg(editingId ? 'הטיפול עודכן' : 'הטיפול נוסף');
    setTimeout(() => setMsg(''), 2000);
    await load();
  }

  async function removeService(id: string) {
    if (!confirm('למחוק את הטיפול? לקוחות לא יוכלו לבחור אותו יותר.')) return;
    const { error } = await supabase.from('services').delete().eq('id', id).eq('business_id', businessId);
    if (error) {
      setErr(error.message);
      return;
    }
    await load();
  }

  async function toggleActive(row: ServiceRow) {
    const { error } = await supabase
      .from('services')
      .update({ is_active: !row.is_active })
      .eq('id', row.id)
      .eq('business_id', businessId);
    if (error) {
      setErr(error.message);
      return;
    }
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">מחירון / טיפולים</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            הגדירו טיפולים עם משך ומחיר — הלקוח בוחר אותם במקום «פגישה» כללית בעת הזימון.
          </p>
        </div>
        <Button type="button" size="sm" className="gap-1" onClick={openCreate}>
          <Plus className="size-4" />
          טיפול חדש
        </Button>
      </div>

      {msg ? <p className="text-sm text-emerald-600">{msg}</p> : null}
      {err && !modalOpen ? <p className="text-sm text-destructive">{err}</p> : null}

      <ul className="space-y-2">
        {services.length === 0 ? (
          <li className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            עדיין אין טיפולים. הוסיפו טיפול ראשון כדי שלקוחות יוכלו לבחור אותו בזימון.
          </li>
        ) : (
          services.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{s.name}</p>
                  {!s.is_active ? (
                    <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                      לא פעיל
                    </span>
                  ) : null}
                </div>
                {s.description ? <p className="mt-0.5 text-sm text-muted-foreground">{s.description}</p> : null}
                <p className="mt-1 text-sm text-muted-foreground">
                  {s.duration_minutes} דק׳
                  {s.price_ils != null ? ` · ₪${Number(s.price_ils).toFixed(0)}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => void toggleActive(s)}>
                  {s.is_active ? 'השבת' : 'הפעל'}
                </Button>
                <Button type="button" size="sm" variant="outline" className="gap-1" onClick={() => openEdit(s)}>
                  <Pencil className="size-3.5" />
                  עריכה
                </Button>
                <Button type="button" size="sm" variant="destructive" onClick={() => void removeService(s.id)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>

      <Modal
        open={modalOpen}
        title={editingId ? 'עריכת טיפול' : 'טיפול חדש'}
        description="שם, משך בדקות ומחיר אופציונלי."
        onClose={() => setModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              ביטול
            </Button>
            <Button type="button" onClick={() => void saveService()} disabled={saving}>
              {saving ? 'שומר…' : 'שמור'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {err ? <p className="text-sm text-red-400">{err}</p> : null}
          <Field label="שם הטיפול">
            <input
              className={inputClassName}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="למשל: תספורת גברים"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="משך (דקות)">
              <input
                className={inputClassName}
                type="number"
                min={5}
                step={5}
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
              />
            </Field>
            <Field label="מחיר (₪)">
              <input
                className={inputClassName}
                type="number"
                min={0}
                step={1}
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="אופציונלי"
              />
            </Field>
          </div>
          <Field label="תיאור קצר">
            <input
              className={inputClassName}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="אופציונלי"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-zinc-200">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            />
            פעיל לזימון לקוחות
          </label>
        </div>
      </Modal>
    </div>
  );
}
