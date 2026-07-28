import type { Metadata } from 'next';
import { Rubik } from 'next/font/google';
import './globals.css';

const rubik = Rubik({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-rubik',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FlashTor | פלטפורמת זימון תורים',
  description:
    'זימון תורים, תזכורות WhatsApp ורשימת המתנה חכמה — לעסקים וללקוחות, בלי אפליקציה ללקוח.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={rubik.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
