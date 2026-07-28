import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { sendNotification } from '../_shared/messaging.ts';
import {
  buildReminderActions,
  buildReminderMessage,
  formatAppointmentHebrew,
  type ReminderKind,
} from '../_shared/reminders.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const siteUrl = Deno.env.get('PUBLIC_APP_URL') ?? 'http://localhost:3000';
const cronSecret = Deno.env.get('CRON_SECRET');

const supabase = createClient(supabaseUrl, serviceRoleKey);

type AppointmentRow = {
  id: string;
  business_id: string;
  customer_name: string;
  customer_phone: string;
  appointment_time: string;
  status: string;
  reminder_24h_sent_at: string | null;
  reminder_2h_sent_at: string | null;
  reminder_1h_sent_at: string | null;
  arrival_confirmed_at: string | null;
};

type BusinessRow = {
  id: string;
  name: string;
};

function authorizeCron(request: Request) {
  if (!cronSecret) {
    return true;
  }

  const headerSecret = request.headers.get('x-cron-secret');
  return headerSecret === cronSecret;
}

function windowBounds(hoursAhead: number, halfWindowMinutes = 30) {
  const now = Date.now();
  const target = now + hoursAhead * 60 * 60 * 1000;
  const delta = halfWindowMinutes * 60 * 1000;
  return {
    startIso: new Date(target - delta).toISOString(),
    endIso: new Date(target + delta).toISOString(),
  };
}

async function ensureConfirmationToken(appointmentId: string, appointmentTimeIso: string) {
  const { data: existing } = await supabase
    .from('appointment_confirmation_tokens')
    .select('id, token, confirmed_at, expires_at')
    .eq('appointment_id', appointmentId)
    .maybeSingle();

  if (existing?.confirmed_at) {
    return null;
  }

  if (existing?.token) {
    return existing.token as string;
  }

  const appointmentEnd = new Date(appointmentTimeIso);
  appointmentEnd.setHours(appointmentEnd.getHours() + 2);

  const { data: created, error } = await supabase
    .from('appointment_confirmation_tokens')
    .insert({
      appointment_id: appointmentId,
      expires_at: appointmentEnd.toISOString(),
    })
    .select('token')
    .single();

  if (error || !created) {
    throw error ?? new Error('Failed to create confirmation token.');
  }

  return created.token as string;
}

async function ensureCancellationToken(appointmentId: string, appointmentTimeIso: string) {
  const { data: existing } = await supabase
    .from('appointment_cancellation_tokens')
    .select('id, token, cancelled_at, expires_at')
    .eq('appointment_id', appointmentId)
    .maybeSingle();

  if (existing?.cancelled_at) {
    return existing.token as string;
  }

  if (existing?.token) {
    return existing.token as string;
  }

  const appointmentEnd = new Date(appointmentTimeIso);
  appointmentEnd.setHours(appointmentEnd.getHours() + 2);

  const { data: created, error } = await supabase
    .from('appointment_cancellation_tokens')
    .insert({
      appointment_id: appointmentId,
      expires_at: appointmentEnd.toISOString(),
    })
    .select('token')
    .single();

  if (error || !created) {
    throw error ?? new Error('Failed to create cancellation token.');
  }

  return created.token as string;
}

async function processReminderBatch(
  reminderKind: ReminderKind,
  hoursAhead: number,
  sentColumn: 'reminder_24h_sent_at' | 'reminder_2h_sent_at' | 'reminder_1h_sent_at',
  halfWindowMinutes = 30
) {
  const { startIso, endIso } = windowBounds(hoursAhead, halfWindowMinutes);

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(
      'id, business_id, customer_name, customer_phone, appointment_time, status, reminder_24h_sent_at, reminder_2h_sent_at, reminder_1h_sent_at, arrival_confirmed_at'
    )
    .eq('status', 'booked')
    .is(sentColumn, null)
    .gte('appointment_time', startIso)
    .lte('appointment_time', endIso);

  if (error) {
    throw error;
  }

  let sent = 0;
  let failed = 0;

  for (const appointment of (appointments ?? []) as AppointmentRow[]) {
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('id', appointment.business_id)
      .single();

    if (businessError || !business) {
      failed += 1;
      continue;
    }

    const businessRow = business as BusinessRow;
    const alreadyConfirmed = Boolean(appointment.arrival_confirmed_at);
    const token = alreadyConfirmed
      ? null
      : await ensureConfirmationToken(appointment.id, appointment.appointment_time);
    const cancellationToken = await ensureCancellationToken(appointment.id, appointment.appointment_time);
    const confirmUrl = token ? `${siteUrl}/confirm/${token}` : null;
    const cancelUrl = `${siteUrl}/cancel/${cancellationToken}`;
    const message = alreadyConfirmed
      ? `FlashTor | ${businessRow.name}\nהתור ב-${formatAppointmentHebrew(
          appointment.appointment_time
        )} כבר אושר. נתראה בקרוב!`
      : buildReminderMessage({
          businessName: businessRow.name,
          appointmentTimeIso: appointment.appointment_time,
          reminderKind,
          confirmUrl: confirmUrl ?? `${siteUrl}`,
          cancelUrl,
        });
    const actionButtons = confirmUrl ? buildReminderActions(confirmUrl, cancelUrl) : [];

    const notificationResult = await sendNotification({
      businessId: appointment.business_id,
      channel: 'whatsapp',
      destination: appointment.customer_phone,
      templateKey: reminderKind,
      message,
      actionButtons,
      metadata: {
        appointmentId: appointment.id,
        confirmUrl,
        cancelUrl,
        reminderKind,
      },
    });

    await supabase.from('notification_logs').insert({
      business_id: appointment.business_id,
      appointment_id: appointment.id,
      channel: 'whatsapp',
      destination: appointment.customer_phone,
      template_key: reminderKind,
      provider_name: notificationResult.providerName,
      status: notificationResult.ok ? 'sent' : 'failed',
      payload: {
        message,
        confirmUrl,
        actionButtons,
      },
      response_payload: notificationResult.body ?? {},
      error_message: notificationResult.ok ? null : 'Reminder delivery failed',
    });

    if (!notificationResult.ok) {
      failed += 1;
      continue;
    }

    const { error: updateError } = await supabase
      .from('appointments')
      .update({ [sentColumn]: new Date().toISOString() })
      .eq('id', appointment.id);

    if (updateError) {
      failed += 1;
      continue;
    }

    sent += 1;
  }

  return { scanned: appointments?.length ?? 0, sent, failed };
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  if (!authorizeCron(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result24 = await processReminderBatch('reminder_24h', 24, 'reminder_24h_sent_at');
    const result2 = await processReminderBatch('reminder_2h', 2, 'reminder_2h_sent_at');
    const result1 = await processReminderBatch('reminder_1h', 1, 'reminder_1h_sent_at', 15);

    return Response.json({
      success: true,
      reminder24h: result24,
      reminder2h: result2,
      reminder1h: result1,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return Response.json({ error: message }, { status: 500 });
  }
});
