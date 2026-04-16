'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-sm text-gray-500">
            © 2026 CrowdBirthday. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm flex-wrap justify-center">
            <Link href="/about" className="text-gray-600 hover:text-pink-500 transition-colors">
              サービスについて
            </Link>
            <Link href="/legal/terms" className="text-gray-600 hover:text-pink-500 transition-colors">
              利用規約
            </Link>
            <Link href="/legal/privacy" className="text-gray-600 hover:text-pink-500 transition-colors">
              プライバシーポリシー
            </Link>
            <Link href="/legal/tokushoho" className="text-gray-600 hover:text-pink-500 transition-colors">
              特定商取引法表記
            </Link>
            <Link href="mailto:hello@crowdbirthday.com" className="text-gray-600 hover:text-pink-500 transition-colors">
              お問い合わせ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
