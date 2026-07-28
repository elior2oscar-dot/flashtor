import { createClient } from '@supabase/supabase-js';

export async function fetchBusinessBookingParams(): Promise<{ businessId: string }[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes('YOUR_PROJECT') || key.includes('PASTE')) {
    return [{ businessId: 'e2e-demo' }];
  }

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.from('businesses').select('id, slug');

  if (error || !data?.length) {
    return [{ businessId: 'e2e-demo' }];
  }

  const identifiers = new Set<string>();
  for (const row of data) {
    identifiers.add(row.id);
    if (row.slug) {
      identifiers.add(row.slug);
    }
  }

  return [...identifiers].map((businessId) => ({ businessId }));
}
