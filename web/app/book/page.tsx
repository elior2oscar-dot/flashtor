'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CustomerBookingPage } from '../../src/components/CustomerBookingPage';

function BookByQuery() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get('businessId') ?? searchParams.get('business');

  if (!businessId) {
    return (
      <main style={{ maxWidth: 520, margin: '48px auto', padding: 24, textAlign: 'center', direction: 'rtl' }}>
        <p style={{ color: '#4b5563' }}>
          חסר מזהה עסק בקישור. השתמשו ב־<code>/book/your-slug</code> או ב־<code>/book?businessId=...</code>
        </p>
      </main>
    );
  }

  return <CustomerBookingPage businessIdentifier={businessId} />;
}

export default function BookQueryPage() {
  return (
    <Suspense fallback={<p style={{ textAlign: 'center', padding: 48 }}>טוען...</p>}>
      <BookByQuery />
    </Suspense>
  );
}
