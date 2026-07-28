import { sendNotification } from './messaging.ts';

type SupabaseClientLike = any;

export async function cancelAppointmentAndTriggerWaitlist(params: {
  supabase: SupabaseClientLike;
  appointmentId: string;
  siteUrl: string;
  offerDurationMinutes?: number;
}) {
  const { supabase, appointmentId, siteUrl, offerDurationMinutes = 30 } = params;

  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .select('id, business_id, service_id, appointment_time, appointment_end_time, customer_name, customer_phone, status')
    .eq('id', appointmentId)
    .single();

  if (appointmentError || !appointment) {
    throw new Error('Appointment not found.');
  }

  if (appointment.status !== 'booked') {
    throw new Error('Appointment is no longer active.');
  }

  const { error: cancelError } = await supabase
    .from('appointments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', appointment.id);

  if (cancelError) {
    throw cancelError;
  }

  const { error: tokenCleanupError } = await supabase
    .from('appointment_confirmation_tokens')
    .update({
      expires_at: new Date().toISOString(),
    })
    .eq('appointment_id', appointment.id);

  if (tokenCleanupError) {
    throw tokenCleanupError;
  }

  if (appointment.appointment_time) {
    const { error: slotError } = await supabase
      .from('appointment_slots')
      .update({ is_available: true })
      .eq('business_id', appointment.business_id)
      .eq('slot_start', appointment.appointment_time);

    if (slotError) {
      throw slotError;
    }
  }

  const appointmentDate = appointment.appointment_time.slice(0, 10);

  const { data: waitlistEntries, error: waitlistError } = await supabase
    .from('waitlist')
    .select('id, customer_name, customer_phone, desired_date, status, priority')
    .eq('business_id', appointment.business_id)
    .eq('desired_date', appointmentDate)
    .eq('status', 'waiting')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true });

  if (waitlistError) {
    throw waitlistError;
  }

  let offersCreated = 0;
  let notificationsQueued = 0;

  for (const entry of waitlistEntries ?? []) {
    const expiresAt = new Date(Date.now() + offerDurationMinutes * 60 * 1000).toISOString();

    const { data: offer, error: offerError } = await supabase
      .from('waitlist_offers')
      .insert({
        business_id: appointment.business_id,
        waitlist_id: entry.id,
        appointment_id: appointment.id,
        slot_start: appointment.appointment_time,
        slot_end: appointment.appointment_end_time ?? appointment.appointment_time,
        status: 'pending',
        expires_at: expiresAt,
      })
      .select('id, offer_token')
      .single();

    if (offerError || !offer) {
      throw offerError ?? new Error('Failed to create waitlist offer.');
    }

    offersCreated += 1;

    const offerUrl = `${siteUrl}/offer?offerId=${encodeURIComponent(offer.id)}`;
    const message = `התפנה תור עבור ${appointmentDate}. אשרו כאן בהקדם: ${offerUrl}`;

    const notificationResult = await sendNotification({
      businessId: appointment.business_id,
      channel: 'whatsapp',
      destination: entry.customer_phone,
      templateKey: 'waitlist_offer',
      message,
      metadata: {
        offerId: offer.id,
        appointmentId: appointment.id,
      },
    });

    const { error: logError } = await supabase.from('notification_logs').insert({
      business_id: appointment.business_id,
      waitlist_offer_id: offer.id,
      appointment_id: appointment.id,
      channel: 'whatsapp',
      destination: entry.customer_phone,
      template_key: 'waitlist_offer',
      provider_name: notificationResult.providerName,
      status: notificationResult.ok ? 'sent' : 'failed',
      payload: {
        message,
        offerUrl,
      },
      response_payload: notificationResult.body ?? {},
      error_message: notificationResult.ok ? null : 'Webhook delivery failed',
    });

    if (logError) {
      throw logError;
    }

    const { error: waitlistUpdateError } = await supabase
      .from('waitlist')
      .update({
        status: 'notified',
        last_notified_at: new Date().toISOString(),
      })
      .eq('id', entry.id);

    if (waitlistUpdateError) {
      throw waitlistUpdateError;
    }

    notificationsQueued += 1;
  }

  return {
    success: true,
    offersCreated,
    notificationsQueued,
    appointment,
  };
}
