'use client';

import Link from 'next/link';
import { Gift, HelpCircle } from 'lucide-react';

interface NavbarProps {
  showOnLandingOnly?: boolean;
}

export default function Navbar({ showOnLandingOnly }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900 hover:text-pink-500 transition-colors">
            <Gift className="w-5 h-5 text-pink-500" />
            <span>CrowdBirthday</span>
          </Link>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <Link
              href="/about"
              title="クラウドバースデーとは？"
              className="hidden sm:inline-flex items-center gap-1 text-sm text-gray-600 hover:text-pink-500 font-medium transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              サービスについて
            </Link>
            <Link
              href="/about"
              title="クラウドバースデーとは？"
              className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-full text-gray-500 hover:text-pink-500 hover:bg-pink-50 transition-colors"
              aria-label="サービスについて"
            >
              <HelpCircle className="w-5 h-5" />
            </Link>
            <Link href="/auth/login" className="text-sm text-gray-700 hover:text-pink-500 font-medium transition-colors">
              ログイン
            </Link>
            <Link
              href="/campaign/new"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-400 text-white text-sm font-bold hover:shadow-lg transition-all"
            >
              ページをつくる
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
