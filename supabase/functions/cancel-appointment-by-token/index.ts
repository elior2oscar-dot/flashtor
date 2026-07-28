import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { cancelAppointmentAndTriggerWaitlist } from '../_shared/cancelAppointment.ts';
import { sendNotification } from '../_shared/messaging.ts';
import { formatAppointmentHebrew } from '../_shared/reminders.ts';

type CancelByTokenRequest = {
  token?: string;
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const siteUrl = Deno.env.get('PUBLIC_APP_URL') ?? 'http://localhost:3000';
const supabase = createClient(supabaseUrl, serviceRoleKey);

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = (await request.json()) as CancelByTokenRequest;
    if (!body.token) {
      return Response.json({ error: 'token is required' }, { status: 400 });
    }

    const { data: tokenRecord, error: tokenError } = await supabase
      .from('appointment_cancellation_tokens')
      .select('id, appointment_id, expires_at, cancelled_at')
      .eq('token', body.token)
      .maybeSingle();

    if (tokenError || !tokenRecord) {
      throw tokenError ?? new Error('Cancellation link not found.');
    }

    if (tokenRecord.cancelled_at) {
      return Response.json({ success: true, alreadyCancelled: true });
    }

    if (new Date(tokenRecord.expires_at).getTime() <= Date.now()) {
      return Response.json({ error: 'Cancellation link expired' }, { status: 410 });
    }

    const result = await cancelAppointmentAndTriggerWaitlist({
      supabase,
      appointmentId: tokenRecord.appointment_id,
      siteUrl,
      offerDurationMinutes: 30,
    });

    const { error: cancelTokenError } = await supabase
      .from('appointment_cancellation_tokens')
      .update({
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', tokenRecord.id);

    if (cancelTokenError) {
      throw cancelTokenError;
    }

    const appointment = result.appointment;
    const cancellationMessage = `FlashTor: התור שלך ב-${formatAppointmentHebrew(
      appointment.appointment_time
    )} בוטל בהצלחה.`;

    const notificationResult = await sendNotification({
      businessId: appointment.business_id,
      channel: 'whatsapp',
      destination: appointment.customer_phone,
      templateKey: 'appointment_cancelled',
      message: cancellationMessage,
      metadata: {
        appointmentId: appointment.id,
      },
    });

    await supabase.from('notification_logs').insert({
      business_id: appointment.business_id,
      appointment_id: appointment.id,
      channel: 'whatsapp',
      destination: appointment.customer_phone,
      template_key: 'appointment_cancelled',
      provider_name: notificationResult.providerName,
      status: notificationResult.ok ? 'sent' : 'failed',
      payload: {
        message: cancellationMessage,
      },
      response_payload: notificationResult.body ?? {},
      error_message: notificationResult.ok ? null : 'Cancellation message failed',
    });

    return Response.json({
      success: true,
      offersCreated: result.offersCreated,
      notificationsQueued: result.notificationsQueued,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return Response.json({ error: message }, { status: 500 });
  }
});
