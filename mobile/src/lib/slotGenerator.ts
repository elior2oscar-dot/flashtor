import { supabase } from './supabase';

export async function generateSlotsForNextNDays(businessId: string, daysAhead = 7): Promise<number> {
  // 1. Load active services
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('id, duration_minutes')
    .eq('business_id', businessId)
    .eq('is_active', true);

  if (servicesError || !services || services.length === 0) {
    throw new Error('יש להגדיר לפחות שירות פעיל אחד בעסק.');
  }

  // 2. Load business hours
  const { data: hours, error: hoursError } = await supabase
    .from('business_hours')
    .select('day_of_week, opens_at, closes_at, is_closed')
    .eq('business_id', businessId);

  if (hoursError || !hours) {
    throw new Error('יש להגדיר שעות פעילות בעסק.');
  }

  const hoursMap = new Map(hours.map((h) => [h.day_of_week, h]));

  const slotsToInsert = [];
  const now = new Date();

  for (let i = 0; i < daysAhead; i++) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + i);

    const dayOfWeek = targetDate.getDay(); // 0 is Sunday, etc.
    const dayConfig = hoursMap.get(dayOfWeek);

    if (!dayConfig || dayConfig.is_closed) {
      continue;
    }

    const [opensHour, opensMin] = dayConfig.opens_at.split(':').map(Number);
    const [closesHour, closesMin] = dayConfig.closes_at.split(':').map(Number);

    const dateStr = targetDate.toISOString().split('T')[0];
    const startTime = new Date(`${dateStr}T${String(opensHour).padStart(2, '0')}:${String(opensMin).padStart(2, '0')}:00`);
    const endTime = new Date(`${dateStr}T${String(closesHour).padStart(2, '0')}:${String(closesMin).padStart(2, '0')}:00`);

    // Generate slots for each service
    for (const service of services) {
      let currentSlotStart = new Date(startTime);
      const slotDurationMs = service.duration_minutes * 60 * 1000;

      while (currentSlotStart.getTime() + slotDurationMs <= endTime.getTime()) {
        const slotEnd = new Date(currentSlotStart.getTime() + slotDurationMs);
        slotsToInsert.push({
          business_id: businessId,
          service_id: service.id,
          slot_start: currentSlotStart.toISOString(),
          slot_end: slotEnd.toISOString(),
          is_available: true,
        });

        // Advance
        currentSlotStart = slotEnd;
      }
    }
  }

  if (slotsToInsert.length === 0) {
    return 0;
  }

  // Insert slots, ignore conflicts
  const { error } = await supabase
    .from('appointment_slots')
    .upsert(slotsToInsert, { onConflict: 'business_id,slot_start' });

  if (error) {
    throw error;
  }

  return slotsToInsert.length;
}
