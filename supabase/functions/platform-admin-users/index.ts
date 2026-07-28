import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Action = 'create_owner' | 'attach_owner' | 'remove_member';

type RequestBody = {
  action?: Action;
  email?: string;
  password?: string;
  businessId?: string;
  role?: 'owner' | 'manager';
  fullName?: string;
  userId?: string;
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function assertPlatformAdmin(userId: string) {
  const { data, error } = await supabase
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    return false;
  }
  return true;
}

async function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  let page = 1;

  while (page <= 25) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === normalized);
    if (found) return found;
    if (data.users.length < 200) break;
    page += 1;
  }

  return null;
}

async function linkMember(params: {
  userId: string;
  businessId: string;
  role: 'owner' | 'manager';
  fullName?: string;
}) {
  const { error: memberError } = await supabase.from('business_members').upsert(
    {
      user_id: params.userId,
      business_id: params.businessId,
      role: params.role,
    },
    { onConflict: 'user_id,business_id' }
  );

  if (memberError) throw memberError;

  if (params.fullName?.trim()) {
    await supabase.from('owner_profiles').upsert(
      {
        id: params.userId,
        business_id: params.businessId,
        full_name: params.fullName.trim(),
        role: params.role,
      },
      { onConflict: 'id,business_id' }
    );
  }
}

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

    const isAdmin = await assertPlatformAdmin(user.id);
    if (!isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as RequestBody;
    const action = body.action;

    if (!action) {
      return Response.json({ error: 'action is required' }, { status: 400 });
    }

    if (action === 'remove_member') {
      if (!body.userId || !body.businessId) {
        return Response.json({ error: 'userId and businessId are required' }, { status: 400 });
      }

      const { error } = await supabase
        .from('business_members')
        .delete()
        .eq('user_id', body.userId)
        .eq('business_id', body.businessId);

      if (error) throw error;
      return Response.json({ ok: true });
    }

    if (!body.businessId || !body.email?.trim()) {
      return Response.json({ error: 'businessId and email are required' }, { status: 400 });
    }

    const role = body.role === 'manager' ? 'manager' : 'owner';

    if (action === 'create_owner') {
      if (!body.password || body.password.length < 6) {
        return Response.json({ error: 'password must be at least 6 characters' }, { status: 400 });
      }

      const existing = await findUserByEmail(body.email);
      if (existing) {
        return Response.json({ error: 'A user with this email already exists. Use attach instead.' }, { status: 409 });
      }

      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: body.email.trim(),
        password: body.password,
        email_confirm: true,
      });

      if (createError || !created.user) {
        throw createError ?? new Error('Failed to create user');
      }

      await linkMember({
        userId: created.user.id,
        businessId: body.businessId,
        role,
        fullName: body.fullName,
      });

      return Response.json({ ok: true, userId: created.user.id });
    }

    if (action === 'attach_owner') {
      const existing = await findUserByEmail(body.email);
      if (!existing) {
        return Response.json({ error: 'No Auth user found for this email. Use create instead.' }, { status: 404 });
      }

      await linkMember({
        userId: existing.id,
        businessId: body.businessId,
        role,
        fullName: body.fullName,
      });

      return Response.json({ ok: true, userId: existing.id });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return Response.json({ error: message }, { status: 500 });
  }
});
