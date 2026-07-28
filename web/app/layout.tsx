import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FlashTor',
  description: 'FlashTor booking and waitlist',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ margin: 0, background: '#f3f4f6' }}>{children}</body>
    </html>
  );
}
