import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CrowdBirthday - お祝いの気持ちをカンタンに届けよう',
  description:
    'お祝いの気持ちをカンタンに届けよう。友達への投げ銭感覚のギフト、またはクリエイター向けのファンモード。eギフト型で世界中どこへでも。',
  keywords:
    'ギフト,誕生日,お祝い,投げ銭,eギフト,クリエイター',
  openGraph: {
    title: 'CrowdBirthday',
    description: 'お祝いの気持ちをカンタンに届けよう',
    url: 'https://crowdbirthday.com',
    siteName: 'CrowdBirthday',
    images: [
      {
        url: 'https://crowdbirthday.com/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${inter.className} flex flex-col min-h-screen bg-white`}>
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
