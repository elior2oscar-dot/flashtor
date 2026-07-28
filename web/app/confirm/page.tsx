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

function ConfirmArrivalInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const functionsBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (!token) {
    return (
      <div style={cardStyle}>
        <FlashTorLogo subtitle="אישור הגעה לתור" />
        <p style={{ textAlign: 'center', color: '#b91c1c' }}>קישור לא תקין או חסר.</p>
      </div>
    );
  }

  async function handleConfirmArrival() {
    setSubmitting(true);
    setMessage('');

    const response = await fetch(`${functionsBaseUrl}/confirm-arrival`, {
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
      setMessage(payload.error ?? 'לא ניתן לאשר ההגעה כרגע.');
      setSubmitting(false);
      return;
    }

    setConfirmed(true);
    setMessage('ההגעה אושרה בהצלחה. נשלחה הודעת אישור ב-WhatsApp.');
    setSubmitting(false);
  }

  return (
    <div style={cardStyle}>
      <FlashTorLogo subtitle="אישור הגעה לתור" />

      <p style={{ color: '#4b5563', lineHeight: 1.6, textAlign: 'center' }}>
        לחצו על הכפתור כדי לאשר שאתם מגיעים לתור. זה עוזר לעסק לתכנן את היום ומפחית ביטולים מיותרים.
      </p>

      <button
        type="button"
        onClick={handleConfirmArrival}
        disabled={submitting || confirmed}
        style={{
          width: '100%',
          marginTop: 12,
          padding: 14,
          background: confirmed ? '#9ca3af' : '#16a34a',
          color: '#ffffff',
          border: 'none',
          borderRadius: 10,
          fontWeight: 700,
          cursor: confirmed ? 'default' : 'pointer',
        }}
      >
        {submitting ? 'מאשר...' : confirmed ? 'ההגעה כבר אושרה' : '✅ אני מאשר/ת הגעה'}
      </button>

      {message ? <p style={{ marginTop: 16, textAlign: 'center', color: '#111827' }}>{message}</p> : null}
    </div>
  );
}

export default function ConfirmArrivalPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', padding: '24px 16px' }}>
      <Suspense fallback={<p style={{ textAlign: 'center', padding: 48 }}>טוען...</p>}>
        <ConfirmArrivalInner />
      </Suspense>
    </div>
  );
}
