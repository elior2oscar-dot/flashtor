import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'business-media';

export async function uploadBusinessMedia(
  supabase: SupabaseClient,
  businessId: string,
  file: File,
  folder: 'gallery' | 'catalog'
): Promise<{ url: string } | { error: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const path = `${businessId}/${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) {
    return { error: error.message };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
