import { FlashTorLogo } from './FlashTorLogo';

const featureCards = [
  {
    title: 'קביעת תור בדקה',
    body: 'בוחרים שירות, תאריך ושעה — בלי הרשמה ובלי סיסמה.',
    icon: '📅',
  },
  {
    title: 'תזכורות ב-WhatsApp',
    body: 'הודעות לפני התור עם אפשרות לאשר הגעה או לבטל בלחיצה.',
    icon: '💬',
  },
  {
    title: 'רשימת המתנה',
    body: 'אין מקום פנוי? נכנסים להמתנה ומקבלים הצעה כשמתפנה תור.',
    icon: '⏳',
  },
];

export function HomeLandingPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #eff6ff 0%, #f3f4f6 42%, #f3f4f6 100%)',
        fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
      }}
    >
      <header
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '20px 20px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: '#2563eb',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            FT
          </div>
          <span style={{ fontWeight: 700, color: '#111827', fontSize: 18 }}>FlashTor</span>
        </div>
        <span
          style={{
            fontSize: 13,
            color: '#2563eb',
            background: '#dbeafe',
            padding: '6px 12px',
            borderRadius: 999,
            fontWeight: 600,
          }}
        >
          ללקוחות · ללא התחברות
        </span>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px 56px' }}>
        <section
          style={{
            textAlign: 'center',
            padding: '40px 16px 48px',
            background: '#ffffff',
            borderRadius: 24,
            boxShadow: '0 12px 40px rgba(15, 23, 42, 0.06)',
            border: '1px solid #e5e7eb',
          }}
        >
          <FlashTorLogo subtitle="פלטפורמת תורים, המתנה ותזכורות לעסקים קטנים ובינוניים" />

          <p
            style={{
              maxWidth: 520,
              margin: '0 auto 28px',
              color: '#4b5563',
              fontSize: 17,
              lineHeight: 1.7,
            }}
          >
            קיבלתם קישור אישי מהעסק? פתחו אותו ישירות מההודעה — שם תקבעו תור או תצטרפו לרשימת ההמתנה.
          </p>

          <div
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              gap: 12,
              alignItems: 'stretch',
              width: '100%',
              maxWidth: 400,
              margin: '0 auto',
            }}
          >
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                color: '#64748b',
                fontSize: 14,
                textAlign: 'right',
                direction: 'ltr',
              }}
            >
              …/flashtor/book/<strong style={{ color: '#334155' }}>שם-העסק</strong>/
            </div>
            <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
              אין לכם קישור? פנו לבעל העסק — הוא שולח אותו מהאפליקציה.
            </p>
          </div>
        </section>

        <section style={{ marginTop: 40 }}>
          <h2 style={{ textAlign: 'center', fontSize: 22, color: '#111827', marginBottom: 20 }}>
            מה מקבלים עם FlashTor
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            {featureCards.map((card) => (
              <article
                key={card.title}
                style={{
                  background: '#ffffff',
                  borderRadius: 16,
                  padding: 22,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 12 }} aria-hidden>
                  {card.icon}
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: 17, color: '#111827' }}>{card.title}</h3>
                <p style={{ margin: 0, color: '#6b7280', lineHeight: 1.6, fontSize: 15 }}>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          style={{
            marginTop: 40,
            padding: 28,
            borderRadius: 20,
            background: '#1e3a8a',
            color: '#ffffff',
            textAlign: 'center',
          }}
        >
          <h2 style={{ margin: '0 0 10px', fontSize: 20 }}>בעלי עסקים</h2>
          <p style={{ margin: '0 auto', maxWidth: 480, lineHeight: 1.65, color: '#dbeafe', fontSize: 15 }}>
            ניהול יומן, המתנה ומדדים מתבצעים באפליקציית הבעלים לנייד. לקוחות תמיד מגיעים דרך קישור
            ההזמנה שאתם משתפים.
          </p>
        </section>
      </main>

      <footer
        style={{
          textAlign: 'center',
          padding: '24px 20px 32px',
          color: '#9ca3af',
          fontSize: 13,
          borderTop: '1px solid #e5e7eb',
          background: '#f9fafb',
        }}
      >
        <p style={{ margin: 0 }}>FlashTor · תורים חכמים לעסק שלך</p>
      </footer>
    </div>
  );
}
