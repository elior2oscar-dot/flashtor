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

type SupabaseClient = ReturnType<typeof import('@/lib/supabaseBrowser').createBrowserSupabaseClient>;

export async function ensureDefaultService(supabase: SupabaseClient, businessId: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from('services')
    .select('id')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .limit(1);

  if (existing?.[0]?.id) return existing[0].id;

  const { data, error } = await supabase
    .from('services')
    .insert({ business_id: businessId, name: 'Appointment', duration_minutes: 30, is_active: true })
    .select('id')
    .single();

  if (error) return null;
  return data?.id ?? null;
}

/** Creates open slots for the next `daysAhead` days (weekdays 09:00–17:30, 30 min). */
export async function seedUpcomingAppointmentSlots(
  supabase: SupabaseClient,
  businessId: string,
  serviceId: string,
  daysAhead = 21
) {
  const rows: {
    business_id: string;
    service_id: string;
    slot_start: string;
    slot_end: string;
    is_available: boolean;
  }[] = [];

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  for (let d = 0; d < daysAhead; d++) {
    const day = new Date(start);
    day.setDate(start.getDate() + d);
    const dow = day.getDay();
    if (dow === 5 || dow === 6) continue;

    for (let hour = 9; hour < 18; hour++) {
      for (const minute of [0, 30]) {
        if (hour === 17 && minute === 30) continue;
        const slotStart = new Date(day);
        slotStart.setHours(hour, minute, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + 30);
        if (slotStart <= new Date()) continue;

        rows.push({
          business_id: businessId,
          service_id: serviceId,
          slot_start: slotStart.toISOString(),
          slot_end: slotEnd.toISOString(),
          is_available: true,
        });
      }
    }
  }

  const chunkSize = 80;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from('appointment_slots').insert(chunk);
    if (error && error.code !== '23505') {
      console.warn('seedUpcomingAppointmentSlots', error.message);
    }
  }
}

export async function ensureClientBookingReady(supabase: SupabaseClient, businessId: string) {
  await seedDefaultBusinessHours(supabase, businessId);
  const serviceId = await ensureDefaultService(supabase, businessId);
  if (serviceId) {
    await seedUpcomingAppointmentSlots(supabase, businessId, serviceId);
  }
}
