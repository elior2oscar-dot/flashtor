import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { cancelAppointmentAndTriggerWaitlist } from '../_shared/cancelAppointment.ts';

type CancelAppointmentRequest = {
  appointmentId?: string;
  offerDurationMinutes?: number;
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
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    if (!accessToken) {
      return Response.json({ error: 'Missing access token' }, { status: 401 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as CancelAppointmentRequest;
    if (!body.appointmentId) {
      return Response.json({ error: 'appointmentId is required' }, { status: 400 });
    }

    const offerDurationMinutes = body.offerDurationMinutes ?? 30;

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('id, business_id')
      .eq('id', body.appointmentId)
      .single();

    if (appointmentError || !appointment) {
      throw new Error('Appointment not found.');
    }

    const { data: membership, error: membershipError } = await supabase
      .from('business_members')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('business_id', appointment.business_id)
      .maybeSingle();

    if (membershipError) {
      throw membershipError;
    }

    if (!membership) {
      const { data: ownerProfile, error: ownerError } = await supabase
        .from('owner_profiles')
        .select('id')
        .eq('id', user.id)
        .eq('business_id', appointment.business_id)
        .maybeSingle();

      if (ownerError || !ownerProfile) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const result = await cancelAppointmentAndTriggerWaitlist({
      supabase,
      appointmentId: appointment.id,
      siteUrl,
      offerDurationMinutes,
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
