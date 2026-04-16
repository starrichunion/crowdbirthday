'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Gift, MessageCircle, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [step, setStep] = useState<'method' | 'email'>('method');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLineLogin = () => {
    // LINE LIFF login redirect
    // Actual LIFF initialization happens in campaign creation flow
    window.location.href = '/campaign/new';
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    alert('ログインリンクをメール送信しました');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gift className="w-8 h-8 text-pink-500" />
            <h1 className="text-3xl font-bold text-gray-900">CrowdBirthday</h1>
          </div>
          <p className="text-gray-600">
            みんなでお祝いを届けよう
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          {step === 'method' ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">ログイン</h2>

              {/* LINE Login - Primary */}
              <button
                onClick={handleLineLogin}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#06C755] text-white rounded-lg hover:bg-[#05b34d] transition-colors font-medium"
              >
                <MessageCircle className="w-5 h-5" />
                LINEでログイン
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">または</span>
                </div>
              </div>

              {/* Email Login */}
              <button
                onClick={() => setStep('email')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-pink-50 border-2 border-pink-200 rounded-lg hover:bg-pink-100 transition-colors font-medium text-pink-600"
              >
                <Mail className="w-5 h-5" />
                メールで続ける
              </button>

              {/* Terms */}
              <div className="pt-6 border-t border-gray-200 text-center text-xs text-gray-600 space-y-2">
                <p>
                  ログインすることで、以下に同意します：
                </p>
                <div className="flex justify-center gap-2 flex-wrap">
                  <Link
                    href="/legal/terms"
                    className="text-pink-600 hover:underline"
                  >
                    利用規約
                  </Link>
                  <span>・</span>
                  <Link
                    href="/legal/privacy"
                    className="text-pink-600 hover:underline"
                  >
                    プライバシーポリシー
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            // Email Login
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <button
                type="button"
                onClick={() => setStep('method')}
                className="text-sm text-pink-600 hover:text-pink-700 mb-4"
              >
                ← 戻る
              </button>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                メールアドレスを入力
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || \!email}
                className="w-full px-4 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '処理中...' : 'ログインリンクを送信'}
              </button>

              <p className="text-xs text-gray-600 text-center">
                登録済みのメールアドレスをご入力ください。
                <br />
                ログインリンクをメール送信します。
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm">
            まだアカウントをお持ちでない方は、
            <br />
            ログイン時に自動的に作成されます
          </p>
        </div>
      </div>
    </div>
  );
}
