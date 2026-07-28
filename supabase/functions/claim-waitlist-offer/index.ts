import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { sendNotification } from '../_shared/messaging.ts';

type ClaimOfferRequest = {
  offerId?: string;
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, serviceRoleKey);

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = (await request.json()) as ClaimOfferRequest;
    if (!body.offerId) {
      return Response.json({ error: 'offerId is required' }, { status: 400 });
    }

    const { data: offer, error: rpcError } = await supabase.rpc('claim_waitlist_offer', {
      target_offer_id: body.offerId,
    });

    if (rpcError || !offer) {
      throw rpcError ?? new Error('Unable to claim offer.');
    }

    const { data: waitlistOffer, error: offerError } = await supabase
      .from('waitlist_offers')
      .select(
        'id, business_id, appointment_id, waitlist:waitlist_id(customer_name, customer_phone), slot_start, slot_end'
      )
      .eq('id', body.offerId)
      .single();

    if (offerError || !waitlistOffer) {
      throw offerError ?? new Error('Offer details not found.');
    }

    const waitlistCustomer = Array.isArray(waitlistOffer.waitlist)
      ? waitlistOffer.waitlist[0]
      : waitlistOffer.waitlist;

    const confirmationMessage = `התור נשמר עבורך בהצלחה ל-${new Date(waitlistOffer.slot_start).toLocaleString('he-IL')}.`;

    const notificationResult = await sendNotification({
      businessId: waitlistOffer.business_id,
      channel: 'whatsapp',
      destination: waitlistCustomer.customer_phone,
      templateKey: 'waitlist_claimed',
      message: confirmationMessage,
      metadata: {
        offerId: waitlistOffer.id,
        appointmentId: waitlistOffer.appointment_id,
      },
    });

    const { error: logError } = await supabase.from('notification_logs').insert({
      business_id: waitlistOffer.business_id,
      waitlist_offer_id: waitlistOffer.id,
      appointment_id: waitlistOffer.appointment_id,
      channel: 'whatsapp',
      destination: waitlistCustomer.customer_phone,
      template_key: 'waitlist_claimed',
      provider_name: notificationResult.providerName,
      status: notificationResult.ok ? 'sent' : 'failed',
      payload: {
        message: confirmationMessage,
      },
      response_payload: notificationResult.body ?? {},
      error_message: notificationResult.ok ? null : 'Webhook delivery failed',
    });

    if (logError) {
      throw logError;
    }

    return Response.json({
      success: true,
      offerId: waitlistOffer.id,
      appointmentId: waitlistOffer.appointment_id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return Response.json({ error: message }, { status: 500 });
  }
});
