'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { CalendarDays, Clock } from 'lucide-react';

import { AppointmentDateTimePicker } from '@/components/AppointmentDateTimePicker';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const DEMO_BUSINESS = {
  name: 'סטודיו לדוגמה',
  tagline: 'חוויית הזמנת תור ללקוח',
};

const DEMO_SERVICES = [
  { id: 's1', name: 'פגישת ייעוץ', duration_minutes: 45 },
  { id: 's2', name: 'טיפול / שירות מלא', duration_minutes: 60 },
  { id: 's3', name: 'מעקב קצר', duration_minutes: 30 },
];

export function DemoBookingPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState(DEMO_SERVICES[0].id);
  const [date, setDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [time, setTime] = useState<string | null>(null);
  const [joinWaitlist, setJoinWaitlist] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const selectedService = DEMO_SERVICES.find((s) => s.id === selectedServiceId)!;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    setCompleted(true);
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-10">
        <div className="mx-auto max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-border bg-card p-8 text-center shadow-lg"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
              ✓
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">
              {joinWaitlist ? 'נרשמת לרשימת ההמתנה (דמו)' : 'התור נקבע בהצלחה (דמו)'}
            </h1>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              {joinWaitlist
                ? 'בעסק אמיתי תקבלו הודעה ב-WhatsApp כשיתפנה מקום.'
                : `בעסק אמיתי הייתם מקבלים אישור ב-WhatsApp לתור ב-${format(date, 'd בMMMM', { locale: he })} בשעה ${time ?? '—'}.`}
            </p>
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              זהו מצב הדגמה בלבד — לא נשמר מידע במערכת.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  setCompleted(false);
                  setName('');
                  setPhone('');
                  setTime(null);
                  setJoinWaitlist(false);
                }}
              >
                נסו שוב
              </Button>
              <Link
                href="/"
                className="text-sm font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                חזרה לדף הבית
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-100 to-zinc-50">
      <div className="border-b border-amber-200/80 bg-amber-50 px-4 py-2.5 text-center text-sm font-medium text-amber-950">
        מצב הדגמה · התור לא נשמר — כך נראה דף הלקוח בעסק אמיתי
      </div>

      <div className="mx-auto max-w-xl px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <span aria-hidden>→</span> חזרה ל-FlashTor
        </Link>

        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)]">
          <div className="border-b border-border bg-primary px-6 py-8 text-center text-primary-foreground">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-lg font-bold">
              {DEMO_BUSINESS.name.slice(0, 2)}
            </div>
            <h1 className="text-xl font-bold">{DEMO_BUSINESS.name}</h1>
            <p className="mt-1 text-sm text-primary-foreground/70">{DEMO_BUSINESS.tagline}</p>
            <div className="mt-4 flex justify-center gap-4 text-xs text-primary-foreground/60">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                בחירת תאריך
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                בחירת שעה
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <div>
              <label className="mb-2 block text-sm font-semibold">בחירת שירות</label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-ring/30"
                required
              >
                {DEMO_SERVICES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.duration_minutes} דק׳)
                  </option>
                ))}
              </select>
            </div>

            {!joinWaitlist ? (
              <div>
                <label className="mb-2 block text-sm font-semibold">תאריך ושעה</label>
                <AppointmentDateTimePicker
                  date={date}
                  time={time}
                  onDateChange={setDate}
                  onTimeChange={setTime}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                במצב המתנה אין בחירת שעה — נרשמים לתור כללי ליום שתבחרו בהמשך בעסק אמיתי.
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              <input
                type="text"
                placeholder="שם מלא"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
              <input
                type="tel"
                placeholder="טלפון נייד"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={joinWaitlist}
                onChange={(e) => {
                  setJoinWaitlist(e.target.checked);
                  if (e.target.checked) setTime(null);
                }}
                className="rounded border-input"
              />
              הצטרפות לרשימת המתנה במקום תור קבוע
            </label>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting || (!joinWaitlist && !time)}
            >
              {submitting
                ? 'שולח...'
                : joinWaitlist
                  ? 'הירשמו להמתנה (דמו)'
                  : `אשרו תור · ${selectedService.name}`}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          בעסק אמיתי הקישור מגיע ישירות מבעל העסק · מופעל על ידי FlashTor
        </p>
      </div>
    </div>
  );
}
