import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type CreateBookingRequest = {
  businessId?: string;
  serviceId?: string | null;
  slotId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string | null;
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, serviceRoleKey);

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = (await request.json()) as CreateBookingRequest;

    if (!body.businessId || !body.slotId || !body.customerName || !body.customerPhone) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: blocked } = await supabase.rpc('is_contact_blocked', {
      p_business_id: body.businessId,
      p_phone: body.customerPhone,
      p_email: body.customerEmail ?? null,
    });

    if (blocked === true) {
      return Response.json(
        { error: 'This contact cannot book online. Please call the business.' },
        { status: 403 }
      );
    }

    const { data: slot, error: slotError } = await supabase
      .from('appointment_slots')
      .select('id, business_id, service_id, staff_id, slot_start, slot_end, is_available')
      .eq('id', body.slotId)
      .eq('business_id', body.businessId)
      .single();

    if (slotError || !slot) {
      throw new Error('Slot not found.');
    }

    if (!slot.is_available) {
      return Response.json({ error: 'Slot is no longer available' }, { status: 409 });
    }

    const slotDate = slot.slot_start.slice(0, 10);
    const { data: closureRow } = await supabase
      .from('business_closure_dates')
      .select('id')
      .eq('business_id', body.businessId)
      .eq('closure_date', slotDate)
      .maybeSingle();

    if (closureRow) {
      return Response.json({ error: 'This date is closed for bookings.' }, { status: 409 });
    }

    const { data: slotReservation, error: updateSlotError } = await supabase
      .from('appointment_slots')
      .update({ is_available: false })
      .eq('id', slot.id)
      .eq('is_available', true)
      .select('id')
      .single();

    if (updateSlotError || !slotReservation) {
      return Response.json({ error: 'Slot is no longer available' }, { status: 409 });
    }

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        business_id: body.businessId,
        service_id: body.serviceId ?? slot.service_id,
        slot_id: slot.id,
        staff_id: slot.staff_id,
        customer_name: body.customerName,
        customer_phone: body.customerPhone,
        customer_email: body.customerEmail?.trim() || null,
        appointment_time: slot.slot_start,
        appointment_end_time: slot.slot_end,
        source: 'web',
        status: 'booked',
      })
      .select('id')
      .single();

    if (appointmentError || !appointment) {
      await supabase.from('appointment_slots').update({ is_available: true }).eq('id', slot.id);

      throw appointmentError ?? new Error('Failed to create appointment.');
    }

    return Response.json({
      success: true,
      appointmentId: appointment.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return Response.json({ error: message }, { status: 500 });
  }
});
