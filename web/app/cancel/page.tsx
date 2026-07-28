'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FlashTorLogo } from '../../src/components/FlashTorLogo';

const cardStyle: React.CSSProperties = {
  maxWidth: 520,
  margin: '40px auto',
  padding: 24,
  background: '#ffffff',
  borderRadius: 20,
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
  direction: 'rtl',
  fontFamily: 'system-ui, sans-serif',
};

function CancelAppointmentInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const functionsBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  if (!token) {
    return (
      <div style={cardStyle}>
        <FlashTorLogo subtitle="ביטול תור" />
        <p style={{ textAlign: 'center', color: '#b91c1c' }}>קישור לא תקין או חסר.</p>
      </div>
    );
  }

  async function handleCancelAppointment() {
    setSubmitting(true);
    setMessage('');

    const response = await fetch(`${functionsBaseUrl}/cancel-appointment-by-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''}`,
      },
      body: JSON.stringify({ token }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? 'לא ניתן לבטל את התור כרגע.');
      setSubmitting(false);
      return;
    }

    setCancelled(true);
    setMessage(
      payload.alreadyCancelled
        ? 'התור כבר בוטל קודם לכן.'
        : 'התור בוטל בהצלחה. אם יש ממתינים, FlashTor ינסה למלא את המקום אוטומטית.'
    );
    setSubmitting(false);
  }

  return (
    <div style={cardStyle}>
      <FlashTorLogo subtitle="ביטול תור" />

      <p style={{ color: '#4b5563', lineHeight: 1.6, textAlign: 'center' }}>
        אם אינכם יכולים להגיע, אפשר לבטל כאן בלחיצה אחת כדי שהמקום יעבור לממתין הבא.
      </p>

      <button
        type="button"
        onClick={handleCancelAppointment}
        disabled={submitting || cancelled}
        style={{
          width: '100%',
          marginTop: 12,
          padding: 14,
          background: cancelled ? '#9ca3af' : '#dc2626',
          color: '#ffffff',
          border: 'none',
          borderRadius: 10,
          fontWeight: 700,
          cursor: cancelled ? 'default' : 'pointer',
        }}
      >
        {submitting ? 'מבטל...' : cancelled ? 'התור בוטל' : '❌ בטל/י את התור'}
      </button>

      {message ? <p style={{ marginTop: 16, textAlign: 'center', color: '#111827' }}>{message}</p> : null}
    </div>
  );
}

export default function CancelAppointmentPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', padding: '24px 16px' }}>
      <Suspense fallback={<p style={{ textAlign: 'center', padding: 48 }}>טוען...</p>}>
        <CancelAppointmentInner />
      </Suspense>
    </div>
  );
}
