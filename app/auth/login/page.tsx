'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gift, MessageCircle, Loader2 } from 'lucide-react';
import { initLiff, ensureLineLogin } from '@/lib/liff';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // 既にログイン済みなら /dashboard に直行
  useEffect(() => {
    (async () => {
      try {
        const liff = await initLiff();
        if (liff.isLoggedIn()) {
          window.location.href = '/dashboard';
          return;
        }
      } catch {
        // LIFF初期化失敗
      }
      setCheckingAuth(false);
    })();
  }, []);

  // OAuth リダイレクト後
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (\!params.has('code')) return;
    (async () => {
      try {
        await initLiff();
        window.location.href = '/dashboard';
      } catch {
        setCheckingAuth(false);
      }
    })();
  }, []);

  const handleLineLogin = async () => {
    setIsLoading(true);
    try {
      await ensureLineLogin(window.location.href);
    } catch {
      setIsLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gift className="w-8 h-8 text-pink-500" />
            <h1 className="text-3xl font-bold text-gray-900">CrowdBirthday</h1>
          </div>
          <p className="text-gray-600">みんなでお祝いを届けよう</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">ログイン</h2>

          <button
            onClick={handleLineLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-[#06C755] text-white rounded-xl hover:bg-[#05b34d] transition-colors font-bold disabled:opacity-60"
          >
            {isLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> ログイン中...</>
            ) : (
              <><MessageCircle className="w-5 h-5" /> LINEでログイン</>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            ログイン後、マイページに移動します
          </p>

          <div className="pt-6 border-t border-gray-200 text-center text-xs text-gray-600 space-y-2 mt-6">
            <p>ログインすることで、以下に同意します：</p>
            <div className="flex justify-center gap-2 flex-wrap">
              <Link href="/legal/terms" className="text-pink-600 hover:underline">利用規約</Link>
              <span>・</span>
              <Link href="/legal/privacy" className="text-pink-600 hover:underline">プライバシーポリシー</Link>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm">
            まだアカウントをお持ちでない方は、<br />ログイン時に自動的に作成されます
          </p>
        </div>
      </div>
    </div>
  );
}
