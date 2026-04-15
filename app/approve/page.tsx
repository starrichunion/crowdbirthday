'use client';

/**
 * /approve  —  LIFF エンドポイント
 *
 * 役割:
 *   1. LIFF (LINE Front-end Framework) を初期化
 *   2. LINE ログイン強制（未ログインなら LINE ログイン画面へリダイレクト）
 *   3. ?token=xxx を受け取り、LINE userId と共に既存の /approval/[token] へ転送
 *
 * このページは LIFF ウィンドウで開かれる前提。直接開かれた場合は
 * エラー表示になる。
 */

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { ensureLineLogin, getLineProfile, initLiff } from '@/lib/liff';

function ApproveInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const liff = await initLiff();

        if (!liff.isLoggedIn()) {
          // ログインURLにリダイレクトされ、戻ってきたら再度このuseEffectが走る
          await ensureLineLogin(window.location.href);
          return;
        }

        const profile = await getLineProfile();
        if (!profile) {
          setStatus('error');
          setErrorMsg('LINEプロファイルを取得できませんでした');
          return;
        }

        if (!token) {
          setStatus('error');
          setErrorMsg('承認トークンが指定されていません');
          return;
        }

        // LINE プロファイル情報を sessionStorage に一時保存し、
        // /approval/[token] で参照して承認処理に利用する
        sessionStorage.setItem(
          'line_approver_profile',
          JSON.stringify({
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
          })
        );

        router.replace(`/approval/${token}`);
      } catch (err: any) {
        console.error('LIFF approve error:', err);
        setStatus('error');
        setErrorMsg(err?.message || 'エラーが発生しました');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">承認ページを開けませんでした</h1>
        <p className="text-sm text-gray-500 max-w-xs">{errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
      <Loader2 className="w-10 h-10 text-green-500 animate-spin mb-4" />
      <h1 className="text-lg font-semibold text-gray-900 mb-1">LINE認証中…</h1>
      <p className="text-xs text-gray-500">しばらくお待ちください</p>
    </div>
  );
}

export default function ApprovePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
        </div>
      }
    >
      <ApproveInner />
    </Suspense>
  );
}
