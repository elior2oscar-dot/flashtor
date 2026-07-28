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

function ClaimWaitlistOfferInner() {
  const searchParams = useSearchParams();
  const offerId = searchParams.get('offerId') ?? searchParams.get('offer');
  const functionsBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!offerId) {
    return (
      <div style={cardStyle}>
        <FlashTorLogo subtitle="תור שהתפנה עבורך דרך FlashTor" />
        <p style={{ textAlign: 'center', color: '#b91c1c' }}>קישור לא תקין או חסר.</p>
      </div>
    );
  }

  async function handleClaimOffer() {
    setSubmitting(true);
    setMessage('');

    const response = await fetch(`${functionsBaseUrl}/claim-waitlist-offer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''}`,
      },
      body: JSON.stringify({ offerId }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? 'לא ניתן היה לאשר את ההצעה כרגע.');
      setSubmitting(false);
      return;
    }

    if (payload.success) {
      setMessage('התור נשמר עבורך בהצלחה. נשלחה הודעת אישור.');
    } else {
      setMessage('לא ניתן היה לאשר את ההצעה כרגע.');
    }

    setSubmitting(false);
  }

  return (
    <div style={cardStyle}>
      <FlashTorLogo subtitle="תור שהתפנה עבורך דרך FlashTor" />
      <p style={{ color: '#4b5563', lineHeight: 1.6 }}>
        מישהו ביטל תור, והמערכת מציעה לך לתפוס את המקום. האישור הוא על בסיס כל הקודם זוכה.
      </p>

      <button
        type="button"
        onClick={handleClaimOffer}
        disabled={submitting}
        style={{
          width: '100%',
          marginTop: 12,
          padding: 14,
          background: '#16a34a',
          color: '#ffffff',
          border: 'none',
          borderRadius: 10,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {submitting ? 'מאשר...' : 'כן, שמרו לי את התור'}
      </button>

      {message ? <p style={{ marginTop: 16, textAlign: 'center', color: '#111827' }}>{message}</p> : null}
    </div>
  );
}

export default function ClaimWaitlistOfferPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', padding: '24px 16px' }}>
      <Suspense fallback={<p style={{ textAlign: 'center', padding: 48 }}>טוען...</p>}>
        <ClaimWaitlistOfferInner />
      </Suspense>
    </div>
  );
}
