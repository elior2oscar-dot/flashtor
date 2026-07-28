'use client';

import { useEffect, useState } from 'react';

import { Field, Modal, inputClassName, selectClassName } from '@/components/admin/Modal';
import {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUSES,
  type BusinessRow,
  type SubscriptionPlan,
  type SubscriptionStatus,
  bookingUrl,
  slugifyName,
} from '@/components/admin/types';
import { Button } from '@/components/ui/button';

export type BusinessFormValues = {
  name: string;
  slug: string;
  phone: string;
  whatsapp_phone: string;
  timezone: string;
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  is_active: boolean;
};

const emptyForm = (): BusinessFormValues => ({
  name: '',
  slug: '',
  phone: '',
  whatsapp_phone: '',
  timezone: 'Asia/Jerusalem',
  subscription_plan: 'trial',
  subscription_status: 'active',
  is_active: true,
});

type BusinessFormModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  business: BusinessRow | null;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (values: BusinessFormValues) => void;
};

export function BusinessFormModal({
  open,
  mode,
  business,
  saving,
  error,
  onClose,
  onSubmit,
}: BusinessFormModalProps) {
  const [form, setForm] = useState<BusinessFormValues>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && business) {
      setForm({
        name: business.name,
        slug: business.slug ?? '',
        phone: business.phone,
        whatsapp_phone: business.whatsapp_phone ?? '',
        timezone: business.timezone,
        subscription_plan: business.subscription_plan ?? 'trial',
        subscription_status: business.subscription_status ?? 'active',
        is_active: business.is_active,
      });
      setSlugTouched(true);
    } else {
      setForm(emptyForm());
      setSlugTouched(false);
    }
  }, [open, mode, business]);

  function update<K extends keyof BusinessFormValues>(key: K, value: BusinessFormValues[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'name' && !slugTouched && mode === 'create') {
        next.slug = slugifyName(String(value));
      }
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <Modal
      open={open}
      title={mode === 'create' ? 'New client' : 'Edit client'}
      description="Business display name, booking slug, and subscription."
      onClose={onClose}
      wide
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="business-form" disabled={saving}>
            {saving ? 'Saving…' : mode === 'create' ? 'Create client' : 'Save changes'}
          </Button>
        </div>
      }
    >
      <form id="business-form" className="space-y-4" onSubmit={handleSubmit}>
        <Field label="Business name" hint="Shown to customers and in the owner portal.">
          <input
            className={inputClassName}
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            required
          />
        </Field>
        <Field label="Booking slug" hint="URL segment: /book/{slug} and /portal/{slug}">
          <input
            className={inputClassName}
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              update('slug', slugifyName(e.target.value));
            }}
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          />
        </Field>
        {form.slug ? (
          <div className="rounded-lg border border-zinc-700 bg-zinc-950/80 px-3 py-2 text-xs text-zinc-400">
            <span className="text-zinc-500">Customer booking link: </span>
            <a
              href={bookingUrl(form.slug)}
              target="_blank"
              rel="noreferrer"
              className="break-all text-sky-400 underline"
            >
              {bookingUrl(form.slug)}
            </a>
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone">
            <input
              className={inputClassName}
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              required
            />
          </Field>
          <Field label="WhatsApp (optional)">
            <input
              className={inputClassName}
              value={form.whatsapp_phone}
              onChange={(e) => update('whatsapp_phone', e.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subscription plan">
            <select
              className={selectClassName}
              value={form.subscription_plan}
              onChange={(e) => update('subscription_plan', e.target.value as SubscriptionPlan)}
            >
              {SUBSCRIPTION_PLANS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Subscription status">
            <select
              className={selectClassName}
              value={form.subscription_status}
              onChange={(e) => update('subscription_status', e.target.value as SubscriptionStatus)}
            >
              {SUBSCRIPTION_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Timezone">
          <input
            className={inputClassName}
            value={form.timezone}
            onChange={(e) => update('timezone', e.target.value)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => update('is_active', e.target.checked)}
            className="rounded border-zinc-600"
          />
          Active (accepts new bookings)
        </label>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </form>
    </Modal>
  );
}
