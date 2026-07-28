'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Calendar, Copy, LogOut, Users } from 'lucide-react';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { bookingUrl } from '@/lib/paths';
import { Button } from '@/components/ui/button';

type Business = {
  id: string;
  name: string;
  slug: string | null;
};

type Appointment = {
  id: string;
  customer_name: string;
  customer_phone: string;
  appointment_time: string;
  status: string;
  arrival_confirmed_at: string | null;
};

type WaitlistRow = {
  id: string;
  customer_name: string;
  customer_phone: string;
  desired_date: string;
  status: string;
};

type Tab = 'appointments' | 'waitlist';

export function OwnerPortal({ slug }: { slug: string }) {
  const { supabase, user, loading: authLoading, signIn, signOut } = useSupabaseSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [business, setBusiness] = useState<Business | null>(null);
  const [businessError, setBusinessError] = useState('');
  const [membershipOk, setMembershipOk] = useState(false);
  const [tab, setTab] = useState<Tab>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistRow[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [copyMsg, setCopyMsg] = useState('');

  const bookingBase = bookingUrl(slug);

  const loadBusiness = useCallback(async () => {
    setBusinessError('');
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, slug')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      setBusiness(null);
      setBusinessError('לא נמצא עסק פעיל עם הקישור הזה.');
      return;
    }
    setBusiness(data);
  }, [slug, supabase]);

  const verifyMembership = useCallback(
    async (businessId: string, userId: string) => {
      const { data: member } = await supabase
        .from('business_members')
        .select('role')
        .eq('business_id', businessId)
        .eq('user_id', userId)
        .maybeSingle();

      if (member) {
        setMembershipOk(true);
        return;
      }

      const { data: legacy } = await supabase
        .from('owner_profiles')
        .select('id')
        .eq('id', userId)
        .eq('business_id', businessId)
        .maybeSingle();

      setMembershipOk(!!legacy);
      if (!legacy && !member) {
        setBusinessError('אין לך הרשאה לנהל את העסק הזה. התחבר עם חשבון הבעלים.');
      }
    },
    [supabase]
  );

  const loadDashboardData = useCallback(
    async (businessId: string) => {
      setDataLoading(true);
      const now = new Date().toISOString();

      const [apptRes, waitRes] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, customer_name, customer_phone, appointment_time, status, arrival_confirmed_at')
          .eq('business_id', businessId)
          .eq('status', 'booked')
          .gte('appointment_time', now)
          .order('appointment_time', { ascending: true })
          .limit(50),
        supabase
          .from('waitlist')
          .select('id, customer_name, customer_phone, desired_date, status')
          .eq('business_id', businessId)
          .order('created_at', { ascending: true })
          .limit(50),
      ]);

      setAppointments(apptRes.data ?? []);
      setWaitlist(waitRes.data ?? []);
      setDataLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    void loadBusiness();
  }, [loadBusiness]);

  useEffect(() => {
    if (!user || !business) return;
    void verifyMembership(business.id, user.id);
  }, [user, business, verifyMembership]);

  useEffect(() => {
    if (!business || !membershipOk) return;
    void loadDashboardData(business.id);
  }, [business, membershipOk, loadDashboardData]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) {
      setAuthError('התחברות נכשלה. בדקו אימייל וסיסמה.');
    }
  }

  async function cancelAppointment(appointmentId: string) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const response = await fetch(`${base}/functions/v1/cancel-appointment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anon ?? '',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ appointmentId }),
    });

    if (response.ok && business) {
      await loadDashboardData(business.id);
    }
  }

  async function copyBookingLink() {
    try {
      await navigator.clipboard.writeText(bookingBase);
      setCopyMsg('הקישור הועתק');
      setTimeout(() => setCopyMsg(''), 2000);
    } catch {
      setCopyMsg('לא ניתן להעתיק');
    }
  }

  if (authLoading) {
    return <p className="p-10 text-center text-muted-foreground">טוען...</p>;
  }

  if (businessError && !business) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <p className="text-destructive">{businessError}</p>
        <Link href="/" className="mt-4 inline-block text-sm text-primary underline">
          חזרה לדף הבית
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-12">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            פורטל ניהול · {slug}
          </p>
          <h1 className="mt-2 text-center text-2xl font-bold">כניסת בעל עסק</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {business?.name ?? 'טוען פרטי עסק...'}
          </p>
          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <input
              type="email"
              placeholder="אימייל"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-input px-4 py-3 text-sm"
            />
            <input
              type="password"
              placeholder="סיסמה"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-input px-4 py-3 text-sm"
            />
            {authError ? <p className="text-sm text-destructive">{authError}</p> : null}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'מתחבר...' : 'התחברות'}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            אין לכם חשבון? הירשמו דרך אפליקציית FlashTor לנייד.
          </p>
        </div>
      </div>
    );
  }

  if (!membershipOk) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <p className="text-destructive">{businessError || 'בודק הרשאות...'}</p>
        <Button variant="outline" className="mt-4" onClick={() => void signOut()}>
          התנתקות
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs text-muted-foreground">פורטל ניהול</p>
            <h1 className="text-xl font-bold">{business?.name}</h1>
            <p className="text-sm text-muted-foreground">/{slug}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void copyBookingLink()}>
              <Copy className="ms-1 size-4" />
              קישור ללקוחות
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void signOut()}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
        {copyMsg ? <p className="pb-2 text-center text-xs text-emerald-600">{copyMsg}</p> : null}
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex gap-2">
          <Button
            variant={tab === 'appointments' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('appointments')}
          >
            <Calendar className="ms-1 size-4" />
            תורים קרובים
          </Button>
          <Button
            variant={tab === 'waitlist' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('waitlist')}
          >
            <Users className="ms-1 size-4" />
            רשימת המתנה
          </Button>
        </div>

        {dataLoading ? (
          <p className="text-muted-foreground">טוען נתונים...</p>
        ) : tab === 'appointments' ? (
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                אין תורים קרובים.
              </p>
            ) : (
              appointments.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <div>
                    <p className="font-semibold">{a.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{a.customer_phone}</p>
                    <p className="text-sm">
                      {new Date(a.appointment_time).toLocaleString('he-IL')}
                      {a.arrival_confirmed_at ? ' · אושר הגעה' : ''}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => void cancelAppointment(a.id)}>
                    ביטול תור
                  </Button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {waitlist.length === 0 ? (
              <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                אין ממתינים.
              </p>
            ) : (
              waitlist.map((w) => (
                <div key={w.id} className="rounded-xl border border-border bg-card p-4">
                  <p className="font-semibold">{w.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{w.customer_phone}</p>
                  <p className="text-sm">
                    תאריך מבוקש: {w.desired_date} · {w.status}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
