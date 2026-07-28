/**
 * Bootstrap FlashTor demo data after migrations exist.
 * Uses service role (server-only) — run: node scripts/bootstrap-demo-data.js
 */
const fs = require('fs');
const path = require('path');

function loadEnv(filePath) {
  const map = {};
  if (!fs.existsSync(filePath)) return map;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
    if (m) map[m[1]] = m[2].trim();
  }
  return map;
}

const env = {
  ...loadEnv(path.join(__dirname, '..', 'supabase', '.env.local')),
};

const supabaseUrl = env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey || serviceKey.includes('PASTE')) {
  console.error('Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in supabase/.env.local');
  process.exit(1);
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

async function rest(method, pathSuffix, body) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${pathSuffix}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { ok: res.ok, status: res.status, json };
}

async function main() {
  const probe = await rest('GET', 'businesses?select=id&limit=1');
  if (probe.status === 404 || (probe.json && probe.json.code === 'PGRST205')) {
    console.error(
      'Table public.businesses is missing. Run migrations first:\n' +
        '  Option A: Supabase SQL Editor -> paste supabase/apply-all-migrations.sql\n' +
        '  Option B: Add SUPABASE_DB_PASSWORD to supabase/.env.local -> .\\scripts\\push-db.ps1'
    );
    process.exit(1);
  }

  const ownerEmail = 'owner@flashtor.demo';
  const ownerPassword = 'FlashTorDemo2026!';

  let ownerUserId = null;
  const createUserRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: ownerEmail,
      password: ownerPassword,
      email_confirm: true,
    }),
  });

  if (createUserRes.ok) {
    const user = await createUserRes.json();
    ownerUserId = user.id;
    console.log('Created owner user:', ownerEmail);
  } else {
    const err = await createUserRes.text();
    if (err.includes('already been registered') || createUserRes.status === 422) {
      const listRes = await fetch(
        `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(ownerEmail)}`,
        {
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        }
      );
      const list = await listRes.json();
      ownerUserId = list.users?.[0]?.id ?? list?.[0]?.id;
      console.log('Using existing owner user:', ownerEmail);
    } else {
      console.error('Auth admin failed:', createUserRes.status, err);
      process.exit(1);
    }
  }

  if (!ownerUserId) {
    console.error('Could not resolve owner user id');
    process.exit(1);
  }

  let businessId = null;
  const existing = await rest('GET', `businesses?slug=eq.e2e-demo&select=id,name`);
  if (existing.ok && Array.isArray(existing.json) && existing.json.length > 0) {
    businessId = existing.json[0].id;
    console.log('Business e2e-demo exists:', businessId);
  } else {
    const inserted = await rest('POST', 'businesses', {
      name: 'E2E Demo Salon',
      phone: '+972500000000',
      whatsapp_phone: '+972500000000',
      slug: 'e2e-demo',
      timezone: 'Asia/Jerusalem',
      is_active: true,
    });
    if (!inserted.ok) {
      console.error('Insert business failed:', inserted.status, inserted.json);
      process.exit(1);
    }
    businessId = inserted.json[0].id;
    console.log('Created business e2e-demo:', businessId);
  }

  await rest('POST', 'business_members', {
    user_id: ownerUserId,
    business_id: businessId,
    role: 'owner',
  });

  let serviceId = null;
  const svcExisting = await rest(
    'GET',
    `services?business_id=eq.${businessId}&name=eq.${encodeURIComponent('תספורת')}&select=id`
  );
  if (svcExisting.ok && svcExisting.json?.[0]?.id) {
    serviceId = svcExisting.json[0].id;
  } else {
    const svcIns = await rest('POST', 'services', {
      business_id: businessId,
      name: 'תספורת',
      duration_minutes: 30,
      is_active: true,
    });
    if (!svcIns.ok) {
      console.error('Insert service failed:', svcIns.status, svcIns.json);
      process.exit(1);
    }
    serviceId = svcIns.json[0].id;
  }

  const slotDay = new Date();
  slotDay.setDate(slotDay.getDate() + 2);
  slotDay.setHours(0, 0, 0, 0);

  for (let hour = 10; hour <= 16; hour++) {
    const start = new Date(slotDay);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setMinutes(30);

    await rest('POST', 'appointment_slots', {
      business_id: businessId,
      service_id: serviceId,
      slot_start: start.toISOString(),
      slot_end: end.toISOString(),
      is_available: true,
    });
  }

  console.log('\nReady!');
  console.log('Owner login (mobile):', ownerEmail, '/', ownerPassword);
  console.log('Customer booking: /book/e2e-demo');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
