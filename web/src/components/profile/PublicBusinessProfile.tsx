'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarPlus, MapPin, MessageCircle, Phone } from 'lucide-react';

import { SocialEmbeds } from '@/components/profile/SocialEmbeds';
import { Button } from '@/components/ui/button';
import { bookingHref } from '@/lib/paths';
import { supabase, supabaseConfigError } from '@/lib/supabase';
import { telLink, whatsappLink } from '@/lib/social';

type Profile = {
  id: string;
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

type GalleryRow = { id: string; image_url: string };
type PriceRow = { id: string; name: string; price_ils: number | null; description: string | null };

export function PublicBusinessProfile({ slug }: { slug: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [gallery, setGallery] = useState<GalleryRow[]>([]);
  const [prices, setPrices] = useState<PriceRow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      if (supabaseConfigError) {
        setError(supabaseConfigError);
        setLoading(false);
        return;
      }

      const { data: biz, error: bizErr } = await supabase
        .from('businesses')
        .select(
          'id, name, phone, whatsapp_phone, profile_tagline, instagram_url, tiktok_url, waze_url, price_catalog_pdf_url, slug'
        )
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (bizErr || !biz) {
        setError('לא נמצא פרופיל עסק פעיל.');
        setLoading(false);
        return;
      }

      setProfile(biz as Profile);

      const [gal, pr] = await Promise.all([
        supabase
          .from('business_gallery_images')
          .select('id, image_url')
          .eq('business_id', biz.id)
          .order('sort_order'),
        supabase
          .from('business_price_items')
          .select('id, name, price_ils, description')
          .eq('business_id', biz.id)
          .order('sort_order'),
      ]);

      setGallery((gal.data as GalleryRow[]) ?? []);
      setPrices((pr.data as PriceRow[]) ?? []);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return <p className="p-10 text-center text-muted-foreground">טוען פרופיל...</p>;
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <p className="text-destructive">{error || 'שגיאה'}</p>
        <Link href="/" className="mt-4 inline-block text-sm underline">
          חזרה לדף הבית
        </Link>
      </div>
    );
  }

  const wa = whatsappLink(profile.whatsapp_phone || profile.phone);
  const phoneHref = telLink(profile.phone);
  const bookHref = bookingHref(slug);

  return (
    <div className="min-h-screen bg-zinc-50 pb-28" dir="rtl">
      <header className="relative overflow-hidden bg-zinc-900 text-white">
        {gallery[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gallery[0].image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        ) : null}
        <div className="relative mx-auto max-w-3xl px-4 py-14 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-300">FlashTor</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{profile.name}</h1>
          {profile.profile_tagline ? (
            <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-200">{profile.profile_tagline}</p>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        <section className="flex flex-wrap justify-center gap-3">
          {phoneHref ? (
            <a
              href={phoneHref}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold shadow-sm ring-1 ring-zinc-200"
            >
              <Phone className="size-4" />
              טלפון
            </a>
          ) : null}
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm"
            >
              <MessageCircle className="size-4" />
              וואטסאפ
            </a>
          ) : null}
          {profile.waze_url ? (
            <a
              href={profile.waze_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm"
            >
              <MapPin className="size-4" />
              Waze
            </a>
          ) : null}
        </section>

        {gallery.length > 1 ? (
          <section>
            <h2 className="mb-3 text-lg font-semibold">גלריה</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {gallery.map((g) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={g.id} src={g.image_url} alt="" className="aspect-square rounded-xl object-cover" />
              ))}
            </div>
          </section>
        ) : gallery.length === 1 ? (
          <section>
            <h2 className="mb-3 text-lg font-semibold">גלריה</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gallery[0].image_url} alt="" className="w-full rounded-2xl object-cover" />
          </section>
        ) : null}

        {(profile.instagram_url || profile.tiktok_url) ? (
          <section>
            <h2 className="mb-3 text-lg font-semibold">רשתות חברתיות</h2>
            <SocialEmbeds instagramUrl={profile.instagram_url} tiktokUrl={profile.tiktok_url} />
          </section>
        ) : null}

        {(prices.length > 0 || profile.price_catalog_pdf_url) ? (
          <section className="rounded-2xl border border-border bg-white p-5">
            <h2 className="text-lg font-semibold">מחירון</h2>
            {profile.price_catalog_pdf_url ? (
              <a
                href={profile.price_catalog_pdf_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm text-sky-600 underline"
              >
                הורדת קטלוג PDF
              </a>
            ) : null}
            {prices.length > 0 ? (
              <ul className="mt-4 divide-y divide-border">
                {prices.map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      {p.description ? <p className="text-sm text-muted-foreground">{p.description}</p> : null}
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums">
                      {p.price_ils != null ? `₪${Number(p.price_ils).toFixed(0)}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 p-4 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          <Button asChild className="h-12 w-full text-base font-bold">
            <Link href={bookHref}>
              <CalendarPlus className="ms-2 size-5" />
              זימון תור
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
