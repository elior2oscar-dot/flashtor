import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ maxWidth: 520, margin: '48px auto', padding: 24, textAlign: 'center' }}>
      <h1 style={{ marginBottom: 8 }}>FlashTor</h1>
      <p style={{ color: '#4b5563' }}>
        פתחו קישור הזמנה אישי לעסק, למשל <code>/book/YOUR_BUSINESS_UUID</code>
      </p>
      <p style={{ marginTop: 16 }}>
        <Link href="/book/YOUR_BUSINESS_UUID">דוגמה לדף הזמנה</Link>
      </p>
    </main>
  );
}
