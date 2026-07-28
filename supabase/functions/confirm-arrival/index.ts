import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { sendNotification } from '../_shared/messaging.ts';
import { formatAppointmentHebrew } from '../_shared/reminders.ts';

type ConfirmArrivalRequest = {
  token?: string;
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, serviceRoleKey);

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = (await request.json()) as ConfirmArrivalRequest;
    if (!body.token) {
      return Response.json({ error: 'token is required' }, { status: 400 });
    }

    const { data: appointment, error: rpcError } = await supabase.rpc('confirm_arrival_by_token', {
      target_token: body.token,
    });

    if (rpcError || !appointment) {
      throw rpcError ?? new Error('Unable to confirm arrival.');
    }

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('id', appointment.business_id)
      .single();

    if (businessError || !business) {
      throw businessError ?? new Error('Business not found.');
    }

    const confirmationMessage = `FlashTor: ההגעה אושרה לתור ב-${formatAppointmentHebrew(
      appointment.appointment_time
    )} ב-${business.name}.`;

    const notificationResult = await sendNotification({
      businessId: appointment.business_id,
      channel: 'whatsapp',
      destination: appointment.customer_phone,
      templateKey: 'arrival_confirmed',
      message: confirmationMessage,
      metadata: {
        appointmentId: appointment.id,
      },
    });

    await supabase.from('notification_logs').insert({
      business_id: appointment.business_id,
      appointment_id: appointment.id,
      channel: 'whatsapp',
      destination: appointment.customer_phone,
      template_key: 'arrival_confirmed',
      provider_name: notificationResult.providerName,
      status: notificationResult.ok ? 'sent' : 'failed',
      payload: {
        message: confirmationMessage,
      },
      response_payload: notificationResult.body ?? {},
      error_message: notificationResult.ok ? null : 'Confirmation message failed',
    });

    return Response.json({
      success: true,
      appointmentId: appointment.id,
      arrivalConfirmedAt: appointment.arrival_confirmed_at,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return Response.json({ error: message }, { status: 500 });
  }
});
