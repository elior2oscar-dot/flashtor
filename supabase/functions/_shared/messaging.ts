export type NotificationActionButton = {
  id: string;
  label: string;
  url: string;
};

export type NotificationPayload = {
  businessId: string;
  channel: 'whatsapp' | 'sms' | 'email' | 'in_app';
  destination: string;
  templateKey: string;
  message: string;
  metadata?: Record<string, unknown>;
  actionButtons?: NotificationActionButton[];
};

type NotificationResult = {
  ok: boolean;
  status: number;
  body: unknown;
  providerName: string;
};

function normalizePhoneNumber(value: string) {
  return value.replace(/[^\d+]/g, '');
}

async function parseResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function sendViaWebhook(payload: NotificationPayload): Promise<NotificationResult> {
  const webhookUrl = Deno.env.get('NOTIFICATION_WEBHOOK_URL');

  if (!webhookUrl) {
    return {
      ok: false,
      status: 500,
      body: { error: 'NOTIFICATION_WEBHOOK_URL is not configured.' },
      providerName: 'custom_webhook',
    };
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      actionButtons: payload.actionButtons ?? [],
    }),
  });

  return {
    ok: response.ok,
    status: response.status,
    body: await parseResponse(response),
    providerName: 'custom_webhook',
  };
}

async function sendViaTwilio(payload: NotificationPayload): Promise<NotificationResult> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromWhatsApp = Deno.env.get('TWILIO_WHATSAPP_FROM');
  const contentSid = Deno.env.get('TWILIO_WHATSAPP_CONTENT_SID');

  if (!accountSid || !authToken || !fromWhatsApp) {
    return {
      ok: false,
      status: 500,
      body: { error: 'Twilio WhatsApp environment variables are missing.' },
      providerName: 'twilio',
    };
  }

  const body = new URLSearchParams({
    From: `whatsapp:${normalizePhoneNumber(fromWhatsApp)}`,
    To: `whatsapp:${normalizePhoneNumber(payload.destination)}`,
  });

  if (contentSid && payload.actionButtons?.length) {
    body.set('ContentSid', contentSid);
    body.set(
      'ContentVariables',
      JSON.stringify({
        '1': payload.message,
        '2': payload.actionButtons[0]?.url ?? '',
        '3': payload.actionButtons[1]?.url ?? '',
      })
    );
  } else {
    body.set('Body', payload.message);
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    }
  );

  return {
    ok: response.ok,
    status: response.status,
    body: await parseResponse(response),
    providerName: 'twilio',
  };
}

async function sendViaGreenApi(payload: NotificationPayload): Promise<NotificationResult> {
  const instanceId = Deno.env.get('GREEN_API_INSTANCE_ID');
  const apiToken = Deno.env.get('GREEN_API_TOKEN');

  if (!instanceId || !apiToken) {
    return {
      ok: false,
      status: 500,
      body: { error: 'Green API environment variables are missing.' },
      providerName: 'green_api',
    };
  }

  const response = await fetch(
    `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId: `${normalizePhoneNumber(payload.destination).replace(/^\+/, '')}@c.us`,
        message: payload.message,
        buttons: (payload.actionButtons ?? []).map((button) => ({
          buttonId: button.id,
          buttonText: button.label,
          urlButton: button.url,
        })),
      }),
    }
  );

  return {
    ok: response.ok,
    status: response.status,
    body: await parseResponse(response),
    providerName: 'green_api',
  };
}

export async function sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
  if (payload.channel !== 'whatsapp') {
    return sendViaWebhook(payload);
  }

  const provider = (Deno.env.get('WHATSAPP_PROVIDER') ?? 'webhook').toLowerCase();

  if (provider === 'twilio') {
    return sendViaTwilio(payload);
  }

  if (provider === 'green_api') {
    return sendViaGreenApi(payload);
  }

  return sendViaWebhook(payload);
}
