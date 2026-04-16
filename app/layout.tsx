import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL &&
  process.env.NEXT_PUBLIC_APP_URL.startsWith('http')
    ? process.env.NEXT_PUBLIC_APP_URL
    : 'https://crowdbirthday.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'CrowdBirthday - お祝いの気持ちをカンタンに届けよう',
    template: '%s | CrowdBirthday',
  },
  description:
    'お祝いの気持ちをカンタンに届けよう。友達への投げ銭感覚のギフト、またはクリエイター向けのファンモード。eギフト型で世界中どこへでも。',
  keywords: [
    'ギフト',
    '誕生日',
    'お祝い',
    '投げ銭',
    'eギフト',
    'クリエイター',
    'クラウドファンディング',
  ],
  authors: [{ name: 'CrowdBirthday' }],
  openGraph: {
    title: 'CrowdBirthday - お祝いの気持ちをカンタンに届けよう',
    description:
      'お祝いの気持ちをカンタンに届けよう。友達や推しに、投げ銭感覚でeギフトを贈れます。',
    url: SITE_URL,
    siteName: 'CrowdBirthday',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'CrowdBirthday',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CrowdBirthday - お祝いの気持ちをカンタンに届けよう',
    description:
      'お祝いの気持ちをカンタンに届けよう。友達や推しに、投げ銭感覚でeギフトを贈れます。',
    images: ['/api/og'],
  },
  robots: {
    index: true,
    follow: true,
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
