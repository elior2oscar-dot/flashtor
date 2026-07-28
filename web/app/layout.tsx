import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FlashTor | קביעת תורים והמתנה',
  description: 'קבעו תור או הצטרפו לרשימת המתנה דרך הקישור האישי מהעסק. תזכורות WhatsApp ואישור הגעה.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ margin: 0, background: '#f3f4f6' }}>{children}</body>
    </html>
  );
}
