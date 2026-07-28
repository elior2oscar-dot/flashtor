'use client';

import { useCallback, useEffect, useState } from 'react';

import { AdminShell } from '@/components/admin/AdminShell';
import { BusinessFormModal, type BusinessFormValues } from '@/components/admin/modals/BusinessFormModal';
import { MemberFormModal, type MemberFormMode, type MemberFormSubmit } from '@/components/admin/modals/MemberFormModal';
import type { AdminNav, BusinessRow, MemberRow } from '@/components/admin/types';
import { ClientsView } from '@/components/admin/views/ClientsView';
import { DashboardView } from '@/components/admin/views/DashboardView';
import { TeamView } from '@/components/admin/views/TeamView';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { callPlatformAdminUsers, ensureClientBookingReady } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';

export function PlatformAdminPanel() {
  const { supabase, session, user, loading: authLoading, signIn, signOut } = useSupabaseSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [nav, setNav] = useState<AdminNav>('dashboard');
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [stats, setStats] = useState<{ businesses: number; appointments: number; waitlist: number } | null>(null);
  const [loadError, setLoadError] = useState('');

  const [businessModal, setBusinessModal] = useState<{ open: boolean; mode: 'create' | 'edit'; business: BusinessRow | null }>({
    open: false,
    mode: 'create',
    business: null,
  });
  const [businessSaving, setBusinessSaving] = useState(false);
  const [businessFormError, setBusinessFormError] = useState('');

  const [memberModal, setMemberModal] = useState<{
    open: boolean;
    mode: MemberFormMode;
    businessId?: string;
    member?: MemberRow;
  }>({ open: false, mode: 'create' });
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberFormError, setMemberFormError] = useState('');

  const checkAdmin = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    const { data: rpcAdmin, error: rpcError } = await supabase.rpc('is_platform_admin');

    if (!rpcError && rpcAdmin === true) {
      setIsAdmin(true);
      return;
    }

    const { data, error } = await supabase
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      setIsAdmin(false);
      setLoadError(
        `Could not verify admin access (${error.message}). Apply migrations 007–008 and add a row to platform_admins.`
      );
      return;
    }
    setIsAdmin(!!data);
  }, [supabase, user]);

  const loadBusinesses = useCallback(async () => {
    const { data, error } = await supabase
      .from('businesses')
      .select(
        'id, name, slug, phone, whatsapp_phone, timezone, is_active, subscription_plan, subscription_status, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      setLoadError(error.message);
      return [];
    }
    return (data ?? []) as BusinessRow[];
  }, [supabase]);

  const loadMembers = useCallback(async () => {
    const { data, error } = await supabase
      .from('business_members')
      .select('user_id, business_id, role, created_at, businesses(name, slug)')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      setLoadError(error.message);
      return [];
    }
    return (data ?? []).map((row) => {
      const biz = row.businesses as { name: string; slug: string | null } | { name: string; slug: string | null }[] | null;
      return {
        ...row,
        businesses: Array.isArray(biz) ? biz[0] ?? null : biz,
      };
    }) as MemberRow[];
  }, [supabase]);

  const refreshAll = useCallback(async () => {
    setLoadError('');
    const [bizList, memberList, apptRes, waitRes] = await Promise.all([
      loadBusinesses(),
      loadMembers(),
      supabase.from('appointments').select('id', { count: 'exact', head: true }),
      supabase.from('waitlist').select('id', { count: 'exact', head: true }),
    ]);

    setBusinesses(bizList);
    setMembers(memberList);
    setStats({
      businesses: bizList.length,
      appointments: apptRes.count ?? 0,
      waitlist: waitRes.count ?? 0,
    });
  }, [loadBusinesses, loadMembers, supabase]);

  useEffect(() => {
    if (!authLoading && user) void checkAdmin();
    if (!authLoading && !user) setIsAdmin(false);
  }, [authLoading, user, checkAdmin]);

  useEffect(() => {
    if (isAdmin) void refreshAll();
  }, [isAdmin, refreshAll]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) setAuthError('Sign-in failed.');
  }

  async function saveBusiness(values: BusinessFormValues) {
    setBusinessSaving(true);
    setBusinessFormError('');
    const payload = {
      name: values.name.trim(),
      slug: values.slug.trim() || null,
      phone: values.phone.trim(),
      whatsapp_phone: values.whatsapp_phone.trim() || null,
      timezone: values.timezone.trim() || 'Asia/Jerusalem',
      subscription_plan: values.subscription_plan,
      subscription_status: values.subscription_status,
      is_active: values.is_active,
    };

    if (businessModal.mode === 'create') {
      const { data, error } = await supabase.from('businesses').insert(payload).select('id').single();
      if (error) {
        setBusinessFormError(error.message);
        setBusinessSaving(false);
        return;
      }
      if (data?.id) {
        await ensureClientBookingReady(supabase, data.id);
      }
    } else if (businessModal.business) {
      const { error } = await supabase.from('businesses').update(payload).eq('id', businessModal.business.id);
      if (error) {
        setBusinessFormError(error.message);
        setBusinessSaving(false);
        return;
      }
    }

    setBusinessSaving(false);
    setBusinessModal({ open: false, mode: 'create', business: null });
    await refreshAll();
  }

  async function toggleBusinessActive(business: BusinessRow) {
    await supabase.from('businesses').update({ is_active: !business.is_active }).eq('id', business.id);
    await refreshAll();
  }

  async function prepareBooking(business: BusinessRow) {
    await ensureClientBookingReady(supabase, business.id);
    await refreshAll();
  }

  async function submitMemberForm(payload: MemberFormSubmit) {
    setMemberSaving(true);
    setMemberFormError('');

    if (payload.mode === 'edit' && memberModal.member) {
      const { error } = await supabase
        .from('business_members')
        .update({ role: payload.role })
        .eq('user_id', memberModal.member.user_id)
        .eq('business_id', memberModal.member.business_id);
      if (error) {
        setMemberFormError(error.message);
        setMemberSaving(false);
        return;
      }
    } else if (payload.mode === 'remove' && memberModal.member) {
      const { error } = await supabase
        .from('business_members')
        .delete()
        .eq('user_id', memberModal.member.user_id)
        .eq('business_id', memberModal.member.business_id);
      if (error) {
        setMemberFormError(error.message);
        setMemberSaving(false);
        return;
      }
    } else if ((payload.mode === 'create' || payload.mode === 'attach') && session) {
      const result = await callPlatformAdminUsers(session, {
        action: payload.mode === 'create' ? 'create_owner' : 'attach_owner',
        email: payload.email,
        password: payload.mode === 'create' ? payload.password : undefined,
        businessId: payload.businessId,
        role: payload.role,
        fullName: payload.fullName,
      });
      if (result.error) {
        setMemberFormError(result.error);
        setMemberSaving(false);
        return;
      }
    }

    setMemberSaving(false);
    setMemberModal({ open: false, mode: 'create' });
    await refreshAll();
  }

  if (authLoading) {
    return <p className="p-10 text-center text-muted-foreground">Loading…</p>;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-100"
        >
          <h1 className="text-xl font-bold">FlashTor Platform Admin</h1>
          <p className="mt-1 text-sm text-zinc-400">Direct URL only — not linked from the public site.</p>
          <div className="mt-6 space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            />
            {authError ? <p className="text-sm text-red-400">{authError}</p> : null}
            <Button type="submit" className="w-full" disabled={submitting}>
              Sign in
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-4 text-zinc-100">
        <p>This account does not have platform admin permission.</p>
        <p className="max-w-md text-center text-sm text-zinc-400">
          Signed in as <span className="text-zinc-200">{user.email ?? 'no email'}</span>
          <br />
          User id: <code className="text-xs text-amber-200/90">{user.id}</code>
        </p>
        {loadError ? <p className="max-w-md text-center text-sm text-red-400">{loadError}</p> : null}
        <Button variant="outline" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    );
  }

  if (isAdmin === null) {
    return <p className="p-10 text-center">Checking permissions…</p>;
  }

  const pageTitles: Record<AdminNav, { title: string; description?: string }> = {
    dashboard: { title: 'Dashboard', description: 'Platform overview' },
    clients: { title: 'Clients', description: 'Businesses, slugs, subscriptions' },
    team: { title: 'Team access', description: 'Owner and manager accounts' },
  };

  return (
    <>
      <AdminShell email={user.email} active={nav} onNavigate={setNav} onSignOut={() => void signOut()}>
        {nav === 'dashboard' ? (
          <>
            <h1 className="mb-6 text-2xl font-bold">{pageTitles.dashboard.title}</h1>
            <DashboardView stats={stats} loadError={loadError} />
          </>
        ) : null}
        {nav === 'clients' ? (
          <ClientsView
            businesses={businesses}
            onCreate={() => {
              setBusinessFormError('');
              setBusinessModal({ open: true, mode: 'create', business: null });
            }}
            onEdit={(b) => {
              setBusinessFormError('');
              setBusinessModal({ open: true, mode: 'edit', business: b });
            }}
            onAddMember={(b) => {
              setMemberFormError('');
              setMemberModal({ open: true, mode: 'create', businessId: b.id });
            }}
            onToggleActive={(b) => void toggleBusinessActive(b)}
            onPrepareBooking={(b) => void prepareBooking(b)}
          />
        ) : null}
        {nav === 'team' ? (
          <TeamView
            members={members}
            onCreateAccount={() => {
              setMemberFormError('');
              setMemberModal({ open: true, mode: 'create' });
            }}
            onAttach={() => {
              setMemberFormError('');
              setMemberModal({ open: true, mode: 'attach' });
            }}
            onEdit={(m) => {
              setMemberFormError('');
              setMemberModal({ open: true, mode: 'edit', member: m });
            }}
            onRemove={(m) => {
              setMemberFormError('');
              setMemberModal({ open: true, mode: 'remove', member: m });
            }}
          />
        ) : null}
      </AdminShell>

      <BusinessFormModal
        open={businessModal.open}
        mode={businessModal.mode}
        business={businessModal.business}
        saving={businessSaving}
        error={businessFormError}
        onClose={() => setBusinessModal({ open: false, mode: 'create', business: null })}
        onSubmit={(v) => void saveBusiness(v)}
      />

      <MemberFormModal
        open={memberModal.open}
        mode={memberModal.mode}
        businesses={businesses}
        defaultBusinessId={memberModal.businessId}
        memberLabel={
          memberModal.member
            ? `${memberModal.member.businesses?.name ?? 'Business'} · ${memberModal.member.user_id.slice(0, 8)}…`
            : undefined
        }
        memberRole={memberModal.member?.role}
        saving={memberSaving}
        error={memberFormError}
        onClose={() => setMemberModal({ open: false, mode: 'create' })}
        onSubmit={(p) => void submitMemberForm(p)}
      />
    </>
  );
}
