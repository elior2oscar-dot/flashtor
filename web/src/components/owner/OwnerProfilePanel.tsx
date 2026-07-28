'use client';

import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Plus, Trash2, Upload } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';

import { Field, Modal, inputClassName } from '@/components/admin/Modal';
import { SocialEmbeds } from '@/components/profile/SocialEmbeds';
import { Button } from '@/components/ui/button';
import { uploadBusinessMedia } from '@/lib/mediaUpload';
import { profileUrl } from '@/lib/paths';
import { whatsappLink } from '@/lib/social';

type ProfileFields = {
  name: string;
  phone: string;
  whatsapp_phone: string | null;
  profile_tagline: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  waze_url: string | null;
  price_catalog_pdf_url: string | null;
  slug: string | null;
};

type GalleryRow = { id: string; image_url: string; sort_order: number };
type PriceRow = { id: string; name: string; price_ils: number | null; description: string | null; sort_order: number };

type OwnerProfilePanelProps = {
  supabase: SupabaseClient;
  businessId: string;
};

export function OwnerProfilePanel({ supabase, businessId }: OwnerProfilePanelProps) {
  const [profile, setProfile] = useState<ProfileFields | null>(null);
  const [gallery, setGallery] = useState<GalleryRow[]>([]);
  const [prices, setPrices] = useState<PriceRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [priceModal, setPriceModal] = useState(false);
  const [priceForm, setPriceForm] = useState({ name: '', price: '', description: '' });
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const [biz, gal, pr] = await Promise.all([
      supabase
        .from('businesses')
        .select(
          'name, phone, whatsapp_phone, profile_tagline, instagram_url, tiktok_url, waze_url, price_catalog_pdf_url, slug'
        )
        .eq('id', businessId)
        .single(),
      supabase
        .from('business_gallery_images')
        .select('id, image_url, sort_order')
        .eq('business_id', businessId)
        .order('sort_order'),
      supabase
        .from('business_price_items')
        .select('id, name, price_ils, description, sort_order')
        .eq('business_id', businessId)
        .order('sort_order'),
    ]);

    if (biz.data) setProfile(biz.data as ProfileFields);
    setGallery((gal.data as GalleryRow[]) ?? []);
    setPrices((pr.data as PriceRow[]) ?? []);
  }, [supabase, businessId]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateField<K extends keyof ProfileFields>(key: K, value: ProfileFields[K]) {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
  }

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    setErr('');
    const { error } = await supabase
      .from('businesses')
      .update({
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        whatsapp_phone: profile.whatsapp_phone?.trim() || null,
        profile_tagline: profile.profile_tagline?.trim() || null,
        instagram_url: profile.instagram_url?.trim() || null,
        tiktok_url: profile.tiktok_url?.trim() || null,
        waze_url: profile.waze_url?.trim() || null,
        price_catalog_pdf_url: profile.price_catalog_pdf_url?.trim() || null,
      })
      .eq('id', businessId);
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setMsg('הפרופיל נשמר');
    setTimeout(() => setMsg(''), 2000);
  }

  async function onGalleryFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setErr('');
    for (const file of Array.from(files)) {
      const result = await uploadBusinessMedia(supabase, businessId, file, 'gallery');
      if ('error' in result) {
        setErr(result.error);
        break;
      }
      await supabase.from('business_gallery_images').insert({
        business_id: businessId,
        image_url: result.url,
        sort_order: gallery.length,
      });
    }
    setUploading(false);
    await load();
  }

  async function removeGallery(id: string) {
    await supabase.from('business_gallery_images').delete().eq('id', id);
    await load();
  }

  async function onPdfFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    const result = await uploadBusinessMedia(supabase, businessId, file, 'catalog');
    setUploading(false);
    if ('error' in result) {
      setErr(result.error);
      return;
    }
    await supabase.from('businesses').update({ price_catalog_pdf_url: result.url }).eq('id', businessId);
    await load();
  }

  async function addPriceItem() {
    if (!priceForm.name.trim()) return;
    await supabase.from('business_price_items').insert({
      business_id: businessId,
      name: priceForm.name.trim(),
      price_ils: priceForm.price ? Number(priceForm.price) : null,
      description: priceForm.description.trim() || null,
      sort_order: prices.length,
    });
    setPriceForm({ name: '', price: '', description: '' });
    setPriceModal(false);
    await load();
  }

  async function removePrice(id: string) {
    await supabase.from('business_price_items').delete().eq('id', id);
    await load();
  }

  if (!profile) {
    return <p className="text-sm text-muted-foreground">טוען פרופיל...</p>;
  }

  const publicProfile = profile.slug ? profileUrl(profile.slug) : null;

  return (
    <div className="space-y-8">
      {msg ? <p className="text-sm text-emerald-600">{msg}</p> : null}
      {err ? <p className="text-sm text-destructive">{err}</p> : null}

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">פרופיל עסק</h2>
            <p className="mt-1 text-sm text-muted-foreground">הדף שהלקוחות רואים לפני זימון תור.</p>
          </div>
          {publicProfile ? (
            <a
              href={publicProfile}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-sky-600 underline"
            >
              <ExternalLink className="size-3.5" />
              תצוגה ללקוח
            </a>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="שם העסק">
            <input className={inputClassName} value={profile.name} onChange={(e) => updateField('name', e.target.value)} />
          </Field>
          <Field label="תיאור קצר">
            <input
              className={inputClassName}
              value={profile.profile_tagline ?? ''}
              onChange={(e) => updateField('profile_tagline', e.target.value)}
              placeholder="למשל: סטודיו לעיצוב שיער במרכז"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-lg font-semibold">יצירת קשר וניווט</h2>
        <p className="mt-1 text-sm text-muted-foreground">הכפתורים יופיעו בדף הציבורי — ניתן לערוך כאן.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="טלפון">
            <input className={inputClassName} value={profile.phone} onChange={(e) => updateField('phone', e.target.value)} />
          </Field>
          <Field label="וואטסאפ">
            <input
              className={inputClassName}
              value={profile.whatsapp_phone ?? ''}
              onChange={(e) => updateField('whatsapp_phone', e.target.value)}
              placeholder={profile.phone}
            />
          </Field>
          <Field label="קישור Waze" hint="הדביקו קישור ניווט מ-Waze">
            <input
              className={inputClassName}
              value={profile.waze_url ?? ''}
              onChange={(e) => updateField('waze_url', e.target.value)}
              placeholder="https://waze.com/ul/..."
            />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {profile.phone ? (
            <a href={`tel:${profile.phone}`} className="rounded-full border border-border px-4 py-2 text-sm">
              📞 טלפון
            </a>
          ) : null}
          {(profile.whatsapp_phone || profile.phone) ? (
            <a
              href={whatsappLink(profile.whatsapp_phone || profile.phone)}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border px-4 py-2 text-sm"
            >
              וואטסאפ
            </a>
          ) : null}
          {profile.waze_url ? (
            <a href={profile.waze_url} target="_blank" rel="noreferrer" className="rounded-full border border-border px-4 py-2 text-sm">
              Waze
            </a>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-lg font-semibold">Instagram & TikTok</h2>
        <p className="mt-1 text-sm text-muted-foreground">הדביקו קישור לפרופיל — יוצג בדף דרך ה-embed שלהם.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Instagram">
            <input
              className={inputClassName}
              value={profile.instagram_url ?? ''}
              onChange={(e) => updateField('instagram_url', e.target.value)}
              placeholder="https://instagram.com/yourpage או @username"
              dir="ltr"
            />
          </Field>
          <Field label="TikTok">
            <input
              className={inputClassName}
              value={profile.tiktok_url ?? ''}
              onChange={(e) => updateField('tiktok_url', e.target.value)}
              placeholder="https://tiktok.com/@yourpage או @username"
              dir="ltr"
            />
          </Field>
        </div>
        <div className="mt-4">
          <SocialEmbeds instagramUrl={profile.instagram_url} tiktokUrl={profile.tiktok_url} />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">גלריית תמונות</h2>
            <p className="mt-1 text-sm text-muted-foreground">העלו כמה תמונות של העסק.</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <Upload className="size-4" />
            {uploading ? 'מעלה…' : 'העלה תמונות'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => void onGalleryFiles(e.target.files)}
            />
          </label>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {gallery.length === 0 ? (
            <p className="col-span-full text-sm text-muted-foreground">עדיין אין תמונות.</p>
          ) : (
            gallery.map((g) => (
              <div key={g.id} className="group relative overflow-hidden rounded-xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.image_url} alt="" className="aspect-square w-full object-cover" />
                <button
                  type="button"
                  className="absolute end-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition group-hover:opacity-100"
                  onClick={() => void removeGallery(g.id)}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">קטלוג PDF</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              טיפולים לזימון (שם, משך, מחיר) מנוהלים בטאב <strong>מחירון</strong>. כאן אפשר לצרף PDF לתצוגה בפרופיל.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <Upload className="size-4" />
              העלה PDF
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                disabled={uploading}
                onChange={(e) => void onPdfFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <Button type="button" size="sm" className="gap-1" onClick={() => setPriceModal(true)}>
              <Plus className="size-4" />
              פריט מחיר
            </Button>
          </div>
        </div>
        {profile.price_catalog_pdf_url ? (
          <p className="mt-3 text-sm">
            PDF:{' '}
            <a href={profile.price_catalog_pdf_url} target="_blank" rel="noreferrer" className="text-sky-600 underline">
              צפייה בקטלוג
            </a>
            <button
              type="button"
              className="ms-3 text-destructive underline"
              onClick={() => {
                updateField('price_catalog_pdf_url', null);
                void supabase.from('businesses').update({ price_catalog_pdf_url: null }).eq('id', businessId).then(() => load());
              }}
            >
              הסר PDF
            </button>
          </p>
        ) : null}
        <ul className="mt-4 space-y-2">
          {prices.length === 0 ? (
            <li className="text-sm text-muted-foreground">אין פריטי מחיר ידניים.</li>
          ) : (
            prices.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{p.name}</p>
                  {p.description ? <p className="text-xs text-muted-foreground">{p.description}</p> : null}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold tabular-nums">
                    {p.price_ils != null ? `₪${Number(p.price_ils).toFixed(0)}` : '—'}
                  </span>
                  <button type="button" className="text-destructive" onClick={() => void removePrice(p.id)}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      <div className="flex justify-end">
        <Button type="button" disabled={saving} onClick={() => void saveProfile()}>
          {saving ? 'שומר…' : 'שמור פרופיל'}
        </Button>
      </div>

      <Modal
        open={priceModal}
        title="פריט במחירון"
        onClose={() => setPriceModal(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPriceModal(false)}>
              ביטול
            </Button>
            <Button type="button" onClick={() => void addPriceItem()}>
              הוסף
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Field label="שם השירות">
            <input className={inputClassName} value={priceForm.name} onChange={(e) => setPriceForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="מחיר (₪)">
            <input
              type="number"
              className={inputClassName}
              value={priceForm.price}
              onChange={(e) => setPriceForm((f) => ({ ...f, price: e.target.value }))}
            />
          </Field>
          <Field label="תיאור">
            <input
              className={inputClassName}
              value={priceForm.description}
              onChange={(e) => setPriceForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
