'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gift, User } from 'lucide-react';
import { initLiff } from '@/lib/liff';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const liff = await initLiff();
        if (liff.isLoggedIn()) {
          setIsLoggedIn(true);
          try {
            const profile = await liff.getProfile();
            if (profile.pictureUrl) setAvatarUrl(profile.pictureUrl);
          } catch {
            // プロフィール取得失敗しても問題なし
          }
        }
      } catch {
        // LIFF初期化失敗 → 未ログイン扱い
      }
    })();
  }, []);

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900 hover:text-pink-500 transition-colors">
            <Gift className="w-5 h-5 text-pink-500" />
            <span>CrowdBirthday</span>
          </Link>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard" className="flex items-center gap-2 text-sm text-gray-700 hover:text-pink-500 font-medium transition-colors">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
                マイページ
              </Link>
            ) : (
              <Link href="/dashboard" className="text-sm text-gray-700 hover:text-pink-500 font-medium transition-colors">
                ログイン
              </Link>
            )}
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
