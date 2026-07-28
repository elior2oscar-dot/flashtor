import { createClient } from '@supabase/supabase-js';

export async function fetchBusinessBookingParams(): Promise<{ businessId: string }[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const fallbacks = ['e2e-demo', 'demo-studio'];

  if (!url || !key || url.includes('YOUR_PROJECT') || key.includes('PASTE')) {
    return fallbacks.map((businessId) => ({ businessId }));
  }

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.from('businesses').select('id, slug');

  if (error || !data?.length) {
    return fallbacks.map((businessId) => ({ businessId }));
  }

  const identifiers = new Set<string>();
  for (const row of data) {
    identifiers.add(row.id);
    if (row.slug) {
      identifiers.add(row.slug);
    }
  }

  for (const slug of fallbacks) {
    identifiers.add(slug);
  }

  return [...identifiers].map((businessId) => ({ businessId }));
}
