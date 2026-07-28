import React from 'react';
import Link from 'next/link';

const featureCards = [
  {
    title: 'קביעת תור בשניות',
    body: 'לקוחות בוחרים שירות, ספר ושעה מכל מכשיר — בלי להוריד אפליקציה ובלי להסתבך.',
    icon: '✂️',
  },
  {
    title: 'תזכורות WhatsApp',
    body: 'שולחים תזכורת אוטומטית לפני התור. הלקוח מאשר או מבטל, והיומן שלכם תמיד מעודכן.',
    icon: '📱',
  },
  {
    title: 'רשימת המתנה חכמה',
    body: 'מישהו ביטל? אל תפסידו כסף. המערכת מציעה את התור אוטומטית ללקוחות שממתינים.',
    icon: '⏳',
  },
];

export function HomeLandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#09090b', direction: 'rtl', overflowX: 'hidden' }}>
      
      {/* Navbar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e4e4e7' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#09090b', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 16 }}>
              FT
            </div>
            <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px' }}>FlashTor</span>
          </div>
          <a href="#features" style={{ fontSize: 15, fontWeight: 600, color: '#52525b', textDecoration: 'none' }}>איך זה עובד?</a>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px 60px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 60 }}>
          
          {/* Text Content */}
          <div style={{ flex: '1 1 400px' }}>
            <div style={{ display: 'inline-block', padding: '6px 14px', background: '#fef3c7', color: '#b45309', borderRadius: 999, fontSize: 13, fontWeight: 700, marginBottom: 24 }}>
              🌟 המערכת המובילה למספרות וברבריות
            </div>
            <h1 style={{ fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 800, lineHeight: 1.1, margin: '0 0 24px', letterSpacing: '-1px', color: '#09090b' }}>
              תספורת פרימיום<br/>
              <span style={{ color: '#d97706' }}>מתחילה בקליק.</span>
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: '#52525b', margin: '0 0 32px', maxWidth: 480 }}>
              תנו ללקוחות שלכם חוויית הזמנה חלקה. בלי טלפונים, בלי הודעות בשעות מוזרות. יומן חכם, תזכורות ב-WhatsApp, ורשימת המתנה שממלאת לכם ביטולים אוטומטית.
            </p>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <Link href="/book/e2e-demo" style={{ textDecoration: 'none' }}>
                <div style={{ padding: '16px 32px', background: '#09090b', color: '#fff', borderRadius: 12, fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.2)', transition: 'transform 0.2s' }}>
                  דמו: איך הלקוח קובע תור
                </div>
              </Link>
            </div>
          </div>

          {/* Visual / CSS Phone Mockup */}
          <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center', perspective: 1000 }}>
            <div style={{ 
              width: 320, background: '#fff', borderRadius: 40, border: '12px solid #09090b', 
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', overflow: 'hidden', position: 'relative', 
              height: 600, display: 'flex', flexDirection: 'column', transform: 'rotateY(-5deg) rotateX(5deg)',
            }}>
              
              {/* Phone Notch */}
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 120, height: 24, background: '#09090b', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, zIndex: 10 }}></div>
              
              {/* Mockup Header */}
              <div style={{ padding: '48px 20px 20px', background: '#09090b', color: '#fff', textAlign: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Barbershop VIP</h3>
                <p style={{ margin: '4px 0 0', color: '#a1a1aa', fontSize: 13 }}>קביעת תור מהירה</p>
              </div>

              {/* Mockup Body */}
              <div style={{ padding: 20, flex: 1, background: '#f4f4f5' }}>
                <div style={{ background: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 14, color: '#3f3f46' }}>1. בחר שירות</p>
                  <div style={{ padding: 12, background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#92400e', fontSize: 14 }}>תספורת גברים + זקן</span>
                    <span style={{ color: '#b45309', fontSize: 13, fontWeight: 700 }}>45 דק'</span>
                  </div>
                </div>

                <div style={{ background: '#fff', padding: 16, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 14, color: '#3f3f46' }}>2. בחר שעה למחר</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {['09:00', '09:45', '10:30', '11:15', '13:00', '14:30'].map((time, i) => (
                      <div key={time} style={{ padding: '10px 0', textAlign: 'center', background: i === 2 ? '#09090b' : '#f4f4f5', color: i === 2 ? '#fff' : '#52525b', borderRadius: 8, fontSize: 13, fontWeight: i === 2 ? 700 : 500 }}>
                        {time}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Mockup Footer */}
              <div style={{ padding: 20, background: '#fff', borderTop: '1px solid #e4e4e7' }}>
                <div style={{ background: '#09090b', color: '#fff', padding: 16, borderRadius: 12, textAlign: 'center', fontWeight: 600, fontSize: 15 }}>
                  המשך לקביעת תור
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" style={{ background: '#fff', padding: '80px 24px', borderTop: '1px solid #e4e4e7' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, margin: '0 0 16px', color: '#09090b' }}>הכלים שאתם צריכים כדי לצמוח</h2>
              <p style={{ fontSize: 18, color: '#52525b', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
                מערכת שמבינה את הקצב של מספרה מודרנית ומורידה מכם את כאב הראש של ניהול יומן ותזכורות.
              </p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {featureCards.map((card) => (
                <div key={card.title} style={{ padding: 32, background: '#fafafa', borderRadius: 24, border: '1px solid #e4e4e7' }}>
                  <div style={{ fontSize: 32, marginBottom: 20, background: '#fff', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    {card.icon}
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px', color: '#09090b' }}>{card.title}</h3>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: '#52525b', margin: 0 }}>{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Owner CTA Section */}
        <section style={{ padding: '100px 24px', background: '#09090b', color: '#fff', textAlign: 'center' }}>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <div style={{ fontSize: 48, marginBottom: 24 }}>💈</div>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 800, margin: '0 0 20px', letterSpacing: '-0.5px' }}>
              מוכנים לשדרג את המספרה?
            </h2>
            <p style={{ fontSize: 18, color: '#a1a1aa', margin: '0 0 40px', lineHeight: 1.6 }}>
              בעלי מספרות מנהלים את העסק בקלות דרך אפליקציית מובייל ייעודית. הלקוחות מקבלים קישור נקי דרך הדפדפן, בלי צורך להירשם ובלי להוריד אפליקציה נוספת.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ background: '#000', color: '#52525b', padding: '40px 24px', textAlign: 'center', borderTop: '1px solid #27272a' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
             <div style={{ width: 24, height: 24, borderRadius: 6, background: '#fff', color: '#000', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 10 }}>
              FT
            </div>
            <span style={{ fontWeight: 600, color: '#fff' }}>FlashTor</span>
          </div>
          <div style={{ fontSize: 14 }}>
            © {new Date().getFullYear()} כל הזכויות שמורות. מערכת זימון תורים פרימיום.
          </div>
        </div>
      </footer>
    </div>
  );
}
