'use client';

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef, useState, type ReactNode } from 'react';

function FadeIn({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ScheduleHeroMock() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.18)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500">יומן השבוע</p>
            <p className="text-lg font-bold text-zinc-900">מרץ 2026</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            12 תורים פנויים
          </span>
        </div>

        <div className="mb-4 grid grid-cols-7 gap-1 text-center text-xs text-zinc-500">
          {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="mb-5 grid grid-cols-7 gap-1">
          {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
            <div
              key={day}
              className={`flex h-8 items-center justify-center rounded-lg text-sm ${
                day === 12
                  ? 'bg-zinc-900 font-semibold text-white'
                  : day === 8 || day === 15
                    ? 'bg-zinc-100 font-medium text-zinc-800'
                    : 'text-zinc-600'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {[
            { time: '09:00', title: 'ייעוץ ראשוני', meta: '45 דק׳ · דנה כהן' },
            { time: '11:30', title: 'טיפול מתמשך', meta: '30 דק׳ · יוסי לוי' },
            { time: '14:00', title: 'פגישת מעקב', meta: '60 דק׳ · מיכל אברהם' },
          ].map((slot, i) => (
            <div
              key={slot.time}
              className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2.5"
            >
              <span className="w-12 text-sm font-semibold text-zinc-900">{slot.time}</span>
              <div className="h-8 w-px bg-zinc-200" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-900">{slot.title}</p>
                <p className="truncate text-xs text-zinc-500">{slot.meta}</p>
              </div>
              <div
                className={`h-2 w-2 shrink-0 rounded-full ${i === 0 ? 'bg-emerald-500' : 'bg-zinc-300'}`}
              />
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -start-4 top-8 hidden rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-lg sm:block"
      >
        <p className="text-xs text-zinc-500">תזכורת נשלחה</p>
        <p className="text-sm font-semibold">WhatsApp · אישור הגעה</p>
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute -end-2 bottom-12 hidden rounded-xl border border-zinc-200 bg-zinc-900 px-4 py-3 text-white shadow-lg sm:block"
      >
        <p className="text-xs text-zinc-400">תור חדש</p>
        <p className="text-sm font-semibold">הוזמן דרך הקישור</p>
      </motion.div>
    </div>
  );
}

const faqItems = [
  {
    q: 'האם הלקוח צריך להוריד אפליקציה?',
    a: 'לא. הלקוח פותח קישור בדפדפן, בוחר שירות ושעה — בלי הרשמה ובלי סיסמה.',
  },
  {
    q: 'איך בעל העסק מנהל את היומן?',
    a: 'דרך אפליקציית FlashTor לנייד: תורים, המתנה, ביטולים, מדדים והגדרות העסק.',
  },
  {
    q: 'מה קורה כשלקוח מבטל ברגע האחרון?',
    a: 'רשימת ההמתנה מקבלת הצעה אוטומטית לתפוס את המקום — פחות חורים ביומן.',
  },
  {
    q: 'אילו סוגי עסקים מתאימים?',
    a: 'כל עסק שעובד בתורים: קליניקות, מספרות, יועצים, מטפלים, סטודיואים ועוד.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-zinc-200 py-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 text-start"
      >
        <span className="text-base font-semibold text-zinc-900">{q}</span>
        <span className="text-xl font-light text-zinc-400">{open ? '−' : '+'}</span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        className="overflow-hidden"
      >
        <p className="pt-3 text-sm leading-relaxed text-zinc-600">{a}</p>
      </motion.div>
    </div>
  );
}

export function HomeLandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-zinc-900 text-sm font-bold text-white">
              FT
            </span>
            <span className="text-lg font-bold tracking-tight">FlashTor</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-600 md:flex">
            <a href="#features" className="transition hover:text-zinc-900">
              יכולות
            </a>
            <a href="#bento" className="transition hover:text-zinc-900">
              למה אנחנו
            </a>
            <a href="#faq" className="transition hover:text-zinc-900">
              שאלות נפוצות
            </a>
          </nav>
          <Link
            href="/demo"
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            דמו ללקוח
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="gradient-hero dot-grid relative border-b border-zinc-100">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 md:grid-cols-2 md:py-24 lg:gap-20">
          <div>
            <FadeIn>
              <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                פלטפורמת זימון לעסקים מודרניים
              </span>
            </FadeIn>
            <FadeIn delay={0.08}>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-zinc-900 sm:text-5xl lg:text-[3.25rem]">
                תזמון תורים
                <br />
                <span className="bg-gradient-to-l from-zinc-500 to-zinc-900 bg-clip-text text-transparent">
                  בלי כאב ראש.
                </span>
              </h1>
            </FadeIn>
            <FadeIn delay={0.16}>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-zinc-600">
                FlashTor מחברת בין יומן חכם לבעל העסק לבין חוויית הזמנה מהירה ללקוח — תזכורות
                WhatsApp, אישור הגעה, ביטולים ורשימת המתנה במקום אחד.
              </p>
            </FadeIn>
            <FadeIn delay={0.24}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-zinc-900/15 transition hover:bg-zinc-800"
                >
                  נסו הזמנת תור לדוגמה
                  <span aria-hidden>←</span>
                </Link>
                <a
                  href="#features"
                  className="rounded-full border border-zinc-300 bg-white px-6 py-3.5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
                >
                  גלו את היכולות
                </a>
              </div>
            </FadeIn>
          </div>
          <FadeIn delay={0.2} className="md:justify-self-end">
            <ScheduleHeroMock />
          </FadeIn>
        </div>
      </section>

      {/* Logo strip */}
      <section className="border-b border-zinc-100 bg-zinc-50/50 py-10">
        <FadeIn className="mx-auto max-w-6xl px-5 text-center">
          <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-zinc-400">
            מתאים לכל עסק שעובד בתורים
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-semibold text-zinc-500">
            {['קליניקות', 'מספרות', 'ייעוץ מקצועי', 'טיפולים', 'סטודיואים', 'קואוצ׳ינג'].map(
              (label) => (
                <span key={label}>{label}</span>
              )
            )}
          </div>
        </FadeIn>
      </section>

      {/* Stats */}
      <section className="py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 md:grid-cols-4">
          {[
            { value: '< 60 שנ׳', label: 'ממוצע להזמנת תור' },
            { value: '3', label: 'תזכורות אוטומטיות' },
            { value: '24/7', label: 'קביעה מהדפדפן' },
            { value: '0', label: 'אפליקציות ללקוח' },
          ].map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 0.06} className="text-center md:text-start">
              <p className="text-3xl font-extrabold tracking-tight text-zinc-900 md:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Bento */}
      <section id="bento" className="bg-zinc-50 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 md:text-4xl">
              הכל מה שצריך ליומן מלא
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              פריסת bento מודרנית — כל יכולת במקום הנכון, בלי עומס על הלקוח או על הצוות.
            </p>
          </FadeIn>

          <div className="grid auto-rows-[minmax(160px,auto)] grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2">
            <FadeIn className="md:col-span-2 md:row-span-2">
              <div className="flex h-full min-h-[320px] flex-col justify-between rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-emerald-600">אוטומציה</p>
                  <h3 className="mt-2 text-2xl font-bold text-zinc-900">תזכורות WhatsApp חכמות</h3>
                  <p className="mt-3 max-w-md text-zinc-600">
                    24 שעות, שעתיים ושעה לפני התור — עם קישורי אישור הגעה וביטול. פחות no-shows,
                    יותר שקט ביומן.
                  </p>
                </div>
                <div className="mt-8 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-700">
                  <p className="font-medium">FlashTor · תזכורת לתור מחר 10:00</p>
                  <p className="mt-2 text-zinc-500">אשר הגעה · בטל תור</p>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.08}>
              <div className="flex h-full flex-col rounded-3xl border border-zinc-200 bg-zinc-900 p-6 text-white">
                <h3 className="text-lg font-bold">יומן בזמן אמת</h3>
                <p className="mt-2 flex-1 text-sm text-zinc-400">
                  כל שינוי מהאפליקציה או מהלקוח משתקף מיד — בלי כפילויות.
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {['09', '12', '15'].map((h) => (
                    <div key={h} className="rounded-lg bg-white/10 py-2 text-center text-xs font-semibold">
                      {h}:00
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.12}>
              <div className="flex h-full flex-col rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-zinc-900">רשימת המתנה</h3>
                <p className="mt-2 text-sm text-zinc-600">
                  ביטול? המערכת מציעה את המקום לממתין הבא אוטומטית.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.1} className="md:col-span-3">
              <div className="grid gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:grid-cols-3 md:p-8">
                {[
                  { t: 'קישור אישי לעסק', d: 'שיתוף בוואטסאפ, אינסטגרם או QR.' },
                  { t: 'בחירת שירות ושעה', d: 'ממשק נקי שעובד מכל מכשיר.' },
                  { t: 'אפליקציה לבעלים', d: 'ניהול מלא מהנייד בלבד.' },
                ].map((item) => (
                  <div key={item.t} className="border-zinc-100 md:border-s md:ps-6 md:first:border-0 md:first:ps-0">
                    <h4 className="font-bold text-zinc-900">{item.t}</h4>
                    <p className="mt-1 text-sm text-zinc-600">{item.d}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <FadeIn className="mb-12 max-w-xl">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">איך זה עובד בפועל</h2>
            <p className="mt-4 text-lg text-zinc-600">שלושה צעדים — מהקישור ועד תזכורת ב-WhatsApp.</p>
          </FadeIn>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'העסק משתף קישור',
                body: 'בעל העסק מעתיק קישור הזמנה מהאפליקציה ושולח ללקוח.',
              },
              {
                step: '02',
                title: 'הלקוח קובע תור',
                body: 'בחירת שירות, תאריך ושעה — או הצטרפות להמתנה.',
              },
              {
                step: '03',
                title: 'המערכת מלווה',
                body: 'תזכורות, אישור הגעה וביטול — הכל אוטומטי.',
              },
            ].map((item, i) => (
              <FadeIn key={item.step} delay={i * 0.08}>
                <article className="rounded-2xl border border-zinc-200 p-6 transition hover:border-zinc-300 hover:shadow-md">
                  <span className="text-sm font-bold text-zinc-400">{item.step}</span>
                  <h3 className="mt-3 text-xl font-bold">{item.title}</h3>
                  <p className="mt-2 text-zinc-600">{item.body}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-zinc-100 bg-zinc-50 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <FadeIn className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight">מה אומרים בעלי עסקים</h2>
          </FadeIn>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                quote: 'סוף סוף פחות טלפונים. הלקוחות קובעים לבד ואני רואה הכל באפליקציה.',
                name: 'רונית מ.',
                role: 'קליניקת קוסמטיקה',
              },
              {
                quote: 'רשימת ההמתנה מילאה לי חור ביומן ביום שישי — בלי שאצטרך לרדוף אחרי אף אחד.',
                name: 'עומר ד.',
                role: 'סטודיו לייעוץ',
              },
              {
                quote: 'התזכורות ב-WhatsApp הורידו משמעותית את הביטולים ברגע האחרון.',
                name: 'נועה ש.',
                role: 'מספרה',
              },
            ].map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.1}>
                <blockquote className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <p className="flex-1 text-zinc-700 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  <footer className="mt-6 border-t border-zinc-100 pt-4">
                    <p className="font-semibold text-zinc-900">{t.name}</p>
                    <p className="text-sm text-zinc-500">{t.role}</p>
                  </footer>
                </blockquote>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Owner portal — public entry */}
      <section className="border-y border-zinc-100 bg-white py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <FadeIn className="flex flex-col items-center text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900">בעלי עסקים</h2>
            <p className="mt-4 max-w-xl text-lg text-zinc-600">
              נהלו תורים, רשימת המתנה וקישור ללקוחות — בפורטל ייעודי לעסק שלכם בכתובת{' '}
              <code className="rounded bg-zinc-100 px-2 py-0.5 text-sm" dir="ltr">
                /portal/ה-slug-שלכם
              </code>
            </p>
            <Link
              href="/portal"
              className="mt-8 inline-flex rounded-full bg-zinc-900 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-zinc-800"
            >
              כניסה לפורטל הניהול
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 md:grid-cols-2">
          <FadeIn>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">שאלות נפוצות</h2>
            <p className="mt-4 text-lg text-zinc-600">
              לא מצאתם תשובה? פנו לבעל העסק ששלח לכם את קישור ההזמנה.
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div>
              {faqItems.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-5 mb-20 max-w-6xl md:mx-auto">
        <FadeIn>
          <div className="rounded-3xl bg-zinc-900 px-8 py-14 text-center text-white md:px-16">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              מוכנים לראות את חוויית הלקוח?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-zinc-400">
              הדמו מדגים בדיוק איך לקוח קובע תור דרך הקישור — כמו בעסק אמיתי.
            </p>
            <Link
              href="/demo"
              className="mt-8 inline-flex rounded-full bg-white px-8 py-3.5 text-sm font-bold text-zinc-900 transition hover:bg-zinc-100"
            >
              פתחו דמו הזמנה
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-zinc-50 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-5 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-zinc-900 text-xs font-bold text-white">
              FT
            </span>
            <span className="font-bold">FlashTor</span>
          </div>
          <p className="text-sm text-zinc-500">© {new Date().getFullYear()} FlashTor · זימון תורים לעסקים</p>
        </div>
      </footer>
    </div>
  );
}
