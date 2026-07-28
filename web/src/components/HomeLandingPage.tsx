'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

// --- Icons (Clean, geometric SVGs instead of emojis) ---
const CalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const MessageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const SparklesIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const featureCards = [
  {
    title: 'קביעת תור חלקה',
    body: 'לקוחות בוחרים שירות ותאריך מכל מכשיר — בלי אפליקציה, בלי סיסמאות. חוויה נקייה שמעלה את אחוז ההמרות.',
    icon: <CalendarIcon />,
  },
  {
    title: 'אוטומציה ב-WhatsApp',
    body: 'המערכת שולחת תזכורות אוטומטיות עם כפתורי אישור וביטול. פחות הברזות, יומן תמיד מעודכן.',
    icon: <MessageIcon />,
  },
  {
    title: 'רשימת המתנה חכמה',
    body: 'לקוח ביטל ברגע האחרון? המערכת מציעה את התור לממתינים וממלאת את החלל באופן אוטומטי.',
    icon: <SparklesIcon />,
  },
];

// --- Scroll Reveal Hook ---
function useScrollReveal() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// --- Reveal Component ---
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export function HomeLandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: '"Inter", system-ui, -apple-system, sans-serif', color: '#09090b', direction: 'rtl', overflowX: 'hidden' }}>
      
      {/* Navbar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#09090b', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14 }}>
              FT
            </div>
            <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.3px' }}>FlashTor</span>
          </div>
          <a href="#features" style={{ fontSize: 14, fontWeight: 500, color: '#52525b', textDecoration: 'none', transition: 'color 0.2s' }}>היתרונות שלנו</a>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 100px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 80 }}>
          
          {/* Text Content */}
          <div style={{ flex: '1 1 480px' }}>
            <Reveal>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: '#f4f4f5', color: '#3f3f46', borderRadius: 999, fontSize: 13, fontWeight: 500, marginBottom: 24, border: '1px solid #e4e4e7' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span>
                מערכת זימון תורים לעסקים
              </div>
            </Reveal>
            
            <Reveal delay={100}>
              <h1 style={{ fontSize: 'clamp(44px, 6vw, 68px)', fontWeight: 800, lineHeight: 1.05, margin: '0 0 24px', letterSpacing: '-1.5px', color: '#09090b' }}>
                ניהול יומן מתקדם.<br/>
                <span style={{ color: '#2563eb' }}>חוויית לקוח מושלמת.</span>
              </h1>
            </Reveal>
            
            <Reveal delay={200}>
              <p style={{ fontSize: 19, lineHeight: 1.6, color: '#52525b', margin: '0 0 40px', maxWidth: 520, fontWeight: 400 }}>
                מתאים לקליניקות, מספרות, יועצים ומטפלים. המערכת עושה את העבודה בשבילכם — מקביעת התור, דרך התזכורת ב-WhatsApp ועד לרשימת המתנה חכמה שממלאת חורים ביומן.
              </p>
            </Reveal>
            
            <Reveal delay={300}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <Link href="/book/e2e-demo" style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '16px 32px', background: '#2563eb', color: '#fff', borderRadius: 12, fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 20px -8px rgba(37, 99, 235, 0.5)', transition: 'transform 0.2s, background 0.2s', cursor: 'pointer' }}>
                    צפו בדמו הלקוח
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(180deg)' }}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </div>
                </Link>
                <div style={{ padding: '16px 24px', color: '#52525b', fontWeight: 500, fontSize: 15 }}>
                  ללא התקנת אפליקציה ללקוח
                </div>
              </div>
            </Reveal>
          </div>

          {/* Visual / Modern iPhone Mockup */}
          <Reveal delay={400}>
            <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center', perspective: 1200 }}>
              <div style={{ 
                width: 340, height: 680, background: '#ffffff', borderRadius: 52, border: '12px solid #18181b', 
                boxShadow: '0 30px 60px -12px rgba(0,0,0,0.15), 0 0 0 1px #3f3f46 inset', overflow: 'hidden', position: 'relative', 
                display: 'flex', flexDirection: 'column', transform: 'rotateY(-8deg) rotateX(4deg) scale(0.95)',
                transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                
                {/* Dynamic Island */}
                <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 100, height: 28, background: '#000', borderRadius: 14, zIndex: 10 }}></div>
                
                {/* Phone Content Header */}
                <div style={{ padding: '54px 24px 20px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, background: '#2563eb', borderRadius: 14, margin: '0 auto 12px', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700 }}>
                    CL
                  </div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>קליניקת המומחים</h3>
                  <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>הזמנת תור חדש</p>
                </div>

                {/* Phone Body */}
                <div style={{ padding: 20, flex: 1, background: '#ffffff' }}>
                  <div style={{ border: '1px solid #e2e8f0', padding: 16, borderRadius: 16, marginBottom: 16 }}>
                    <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 14, color: '#334155' }}>1. בחירת שירות</p>
                    <div style={{ padding: 14, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: '#1e3a8a', fontSize: 14 }}>פגישת ייעוץ אישית</span>
                      <span style={{ color: '#2563eb', fontSize: 13, fontWeight: 600 }}>45 דק'</span>
                    </div>
                  </div>

                  <div style={{ border: '1px solid #e2e8f0', padding: 16, borderRadius: 16 }}>
                    <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 14, color: '#334155' }}>2. תורים פנויים למחר</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {['09:00', '10:30', '11:15', '13:00'].map((time, i) => (
                        <div key={time} style={{ 
                          padding: '12px 0', textAlign: 'center', 
                          background: i === 1 ? '#2563eb' : '#f8fafc', 
                          color: i === 1 ? '#fff' : '#475569', 
                          border: i === 1 ? 'none' : '1px solid #e2e8f0',
                          borderRadius: 10, fontSize: 14, fontWeight: i === 1 ? 600 : 500 
                        }}>
                          {time}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Phone Footer */}
                <div style={{ padding: '16px 20px 30px', background: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ background: '#2563eb', color: '#fff', padding: 16, borderRadius: 14, textAlign: 'center', fontWeight: 600, fontSize: 15, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }}>
                    אישור וקביעת תור
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Features Section */}
        <section id="features" style={{ background: '#f8fafc', padding: '100px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Reveal>
              <div style={{ textAlign: 'center', marginBottom: 64 }}>
                <h2 style={{ fontSize: 'clamp(32px, 4vw, 40px)', fontWeight: 800, margin: '0 0 16px', color: '#0f172a', letterSpacing: '-0.5px' }}>
                  נבנה עבור עסקים שמכבדים את הזמן שלהם
                </h2>
                <p style={{ fontSize: 18, color: '#64748b', maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
                  הפלטפורמה שלנו מטפלת בכל התהליך — מהרגע שהלקוח מחפש תור פנוי, ועד לרגע שהוא מגיע לדלת.
                </p>
              </div>
            </Reveal>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
              {featureCards.map((card, idx) => (
                <Reveal key={card.title} delay={idx * 150}>
                  <div style={{ padding: 40, background: '#ffffff', borderRadius: 24, border: '1px solid #e2e8f0', height: '100%', boxSizing: 'border-box', transition: 'box-shadow 0.3s', cursor: 'default' }}>
                    <div style={{ width: 56, height: 56, marginBottom: 24, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16 }}>
                      {card.icon}
                    </div>
                    <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 12px', color: '#0f172a' }}>{card.title}</h3>
                    <p style={{ fontSize: 16, lineHeight: 1.6, color: '#475569', margin: 0 }}>{card.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Integration / Summary Section */}
        <section style={{ padding: '120px 24px', background: '#ffffff', textAlign: 'center' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Reveal>
              <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, margin: '0 0 24px', letterSpacing: '-1px', color: '#0f172a' }}>
                כל מה שצריך כדי לנהל תורים.
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p style={{ fontSize: 19, color: '#64748b', margin: '0 0 48px', lineHeight: 1.6 }}>
                אפליקציית ניהול מתקדמת לבעל העסק, וקישור אינטרנטי מהיר ונגיש ללקוחות.
                המערכת זמינה ופועלת בצורה מושלמת על כל מכשיר.
              </p>
            </Reveal>
            
            <Reveal delay={200}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap', color: '#334155', fontWeight: 500 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CheckIcon /> יומן בזמן אמת</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CheckIcon /> התראות חכמות</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CheckIcon /> ממשק מובייל לעסק</div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ background: '#f8fafc', color: '#64748b', padding: '48px 24px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
             <div style={{ width: 28, height: 28, borderRadius: 8, background: '#0f172a', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 11 }}>
              FT
            </div>
            <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 16 }}>FlashTor</span>
          </div>
          <div style={{ fontSize: 14 }}>
            © {new Date().getFullYear()} FlashTor. כל הזכויות שמורות.
          </div>
        </div>
      </footer>
    </div>
  );
}
