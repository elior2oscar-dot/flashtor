import type { Session } from '@supabase/supabase-js';

type PlatformAdminUsersBody = {
  action: 'create_owner' | 'attach_owner' | 'remove_member';
  email?: string;
  password?: string;
  businessId?: string;
  role?: 'owner' | 'manager';
  fullName?: string;
  userId?: string;
};

export async function callPlatformAdminUsers(
  session: Session,
  body: PlatformAdminUsersBody
): Promise<{ ok?: boolean; userId?: string; error?: string }> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) {
    return { error: 'Missing Supabase URL' };
  }

  const response = await fetch(`${base}/functions/v1/platform-admin-users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as { ok?: boolean; userId?: string; error?: string };
  if (!response.ok) {
    return { error: payload.error ?? 'Request failed' };
  }
  return payload;
}

export async function seedDefaultBusinessHours(
  supabase: ReturnType<typeof import('@/lib/supabaseBrowser').createBrowserSupabaseClient>,
  businessId: string
) {
  const defaultHours = [0, 1, 2, 3, 4, 5].map((day) => ({
    business_id: businessId,
    day_of_week: day,
    opens_at: '09:00',
    closes_at: '18:00',
    is_closed: false,
  }));
  defaultHours.push({
    business_id: businessId,
    day_of_week: 6,
    opens_at: '09:00',
    closes_at: '18:00',
    is_closed: true,
  });

  await supabase.from('business_hours').insert(defaultHours);
}
