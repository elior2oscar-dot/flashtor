'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Building2, LogOut } from 'lucide-react';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Button } from '@/components/ui/button';

type BusinessRow = {
  id: string;
  name: string;
  slug: string | null;
  phone: string;
  is_active: boolean;
  created_at: string;
};

type Stats = {
  businesses: number;
  appointments: number;
  waitlist: number;
};

export function PlatformAdminPanel() {
  const { supabase, user, loading: authLoading, signIn, signOut } = useSupabaseSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadError, setLoadError] = useState('');

  const checkAdmin = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    const { data, error } = await supabase
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      setIsAdmin(false);
      setLoadError('לא ניתן לאמת הרשאות אדמין. ודאו שהמיגרציה 007 הוחלה.');
      return;
    }
    setIsAdmin(!!data);
  }, [supabase, user]);

  const loadPlatformData = useCallback(async () => {
    setLoadError('');
    const [bizRes, apptRes, waitRes] = await Promise.all([
      supabase
        .from('businesses')
        .select('id, name, slug, phone, is_active, created_at')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase.from('appointments').select('id', { count: 'exact', head: true }),
      supabase.from('waitlist').select('id', { count: 'exact', head: true }),
    ]);

    if (bizRes.error) {
      setLoadError(bizRes.error.message);
      return;
    }

    setBusinesses(bizRes.data ?? []);
    setStats({
      businesses: bizRes.data?.length ?? 0,
      appointments: apptRes.count ?? 0,
      waitlist: waitRes.count ?? 0,
    });
  }, [supabase]);

  useEffect(() => {
    if (!authLoading && user) {
      void checkAdmin();
    }
    if (!authLoading && !user) {
      setIsAdmin(false);
    }
  }, [authLoading, user, checkAdmin]);

  useEffect(() => {
    if (isAdmin) {
      void loadPlatformData();
    }
  }, [isAdmin, loadPlatformData]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) setAuthError('התחברות נכשלה.');
  }

  async function toggleBusinessActive(business: BusinessRow) {
    const { error } = await supabase
      .from('businesses')
      .update({ is_active: !business.is_active })
      .eq('id', business.id);

    if (!error) {
      await loadPlatformData();
    }
  }

  if (authLoading) {
    return <p className="p-10 text-center text-muted-foreground">טוען...</p>;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-100"
        >
          <h1 className="text-xl font-bold">FlashTor Platform Admin</h1>
          <p className="mt-1 text-sm text-zinc-400">גישה ישירה בלבד — ללא קישור מהאתר הציבורי.</p>
          <div className="mt-6 space-y-3">
            <input
              type="email"
              placeholder="אימייל"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            />
            <input
              type="password"
              placeholder="סיסמה"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            />
            {authError ? <p className="text-sm text-red-400">{authError}</p> : null}
            <Button type="submit" className="w-full" disabled={submitting}>
              כניסה
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 text-zinc-100">
        <p>אין הרשאת אדמין פלטפורמה למשתמש זה.</p>
        {loadError ? <p className="max-w-md text-center text-sm text-zinc-400">{loadError}</p> : null}
        <Button variant="outline" onClick={() => void signOut()}>
          התנתקות
        </Button>
      </div>
    );
  }

  if (isAdmin === null) {
    return <p className="p-10 text-center">בודק הרשאות...</p>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-bold">FlashTor · אדמין פלטפורמה</h1>
            <p className="text-xs text-zinc-500">{user.email}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => void signOut()}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {stats ? (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs text-zinc-500">עסקים (מוצגים)</p>
              <p className="text-2xl font-bold">{stats.businesses}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs text-zinc-500">תורים (סה״כ)</p>
              <p className="text-2xl font-bold">{stats.appointments}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs text-zinc-500">רשומות המתנה</p>
              <p className="text-2xl font-bold">{stats.waitlist}</p>
            </div>
          </div>
        ) : null}

        {loadError ? <p className="mb-4 text-sm text-red-400">{loadError}</p> : null}

        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Building2 className="size-5" />
          עסקים
        </h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full min-w-[640px] text-start text-sm">
            <thead className="bg-zinc-900 text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">שם</th>
                <th className="px-4 py-3 font-medium">slug</th>
                <th className="px-4 py-3 font-medium">טלפון</th>
                <th className="px-4 py-3 font-medium">פעיל</th>
                <th className="px-4 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((b) => (
                <tr key={b.id} className="border-t border-zinc-800">
                  <td className="px-4 py-3">{b.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{b.slug ?? '—'}</td>
                  <td className="px-4 py-3">{b.phone}</td>
                  <td className="px-4 py-3">{b.is_active ? 'כן' : 'לא'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {b.slug ? (
                        <Link
                          href={`/portal/${b.slug}`}
                          className="text-xs text-sky-400 underline"
                        >
                          פורטל
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        className="text-xs text-amber-400 underline"
                        onClick={() => void toggleBusinessActive(b)}
                      >
                        {b.is_active ? 'השבת' : 'הפעל'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
