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
import { getLineProfile, initLiff } from '@/lib/liff';

const PENDING_TOKEN_KEY = 'line_approver_pending_token';

function ApproveInner() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenFromQuery = params.get('token');
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const liff = await initLiff();

        // 1) クエリに token があれば sessionStorage に保存（LIFFログイン復帰後も保持できるように）
        if (tokenFromQuery) {
          sessionStorage.setItem(PENDING_TOKEN_KEY, tokenFromQuery);
        }

        // 2) 未ログイン時の分岐
        //    - LINE 内蔵ブラウザ（LIFF でない LINE in-app browser）から来た場合は
        //      liff.login() を呼ぶと access.line.me の OAuth が 400 Bad Request を
        //      返すケースがあるため、LIFF URL にリダイレクトして LINE アプリに
        //      LIFF ブラウザで開き直させる。
        //    - 外部ブラウザ（Chrome 等）からの場合は通常の liff.login() フロー。
        if (!liff.isLoggedIn()) {
          const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
          const isLineInAppBrowser = /Line\//i.test(ua);
          const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
          const tokenToPersist =
            tokenFromQuery || sessionStorage.getItem(PENDING_TOKEN_KEY);
          // 無限ループ防止: 既に LIFF リトライ済みなら fallback に落ちる
          const alreadyRetried = params.get('liff_retry') === '1';

          if (isLineInAppBrowser && liffId && tokenToPersist && !alreadyRetried) {
            window.location.replace(
              `https://liff.line.me/${liffId}?token=${encodeURIComponent(tokenToPersist)}&liff_retry=1`
            );
            return;
          }
          liff.login();
          return;
        }

        // 3) ログイン済み: プロファイル取得
        const profile = await getLineProfile();
        if (!profile) {
          setStatus('error');
          setErrorMsg('LINEプロファイルを取得できませんでした');
          return;
        }

        // 4) token を復元（クエリ優先、無ければ sessionStorage）
        const token =
          tokenFromQuery || sessionStorage.getItem(PENDING_TOKEN_KEY);
        if (!token) {
          setStatus('error');
          setErrorMsg('承認トークンが指定されていません');
          return;
        }

        // 5) LINE プロファイル情報を sessionStorage に一時保存し、
        //    /approval/[token] で参照して承認処理に利用する
        sessionStorage.setItem(
          'line_approver_profile',
          JSON.stringify({
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
          })
        );
        sessionStorage.removeItem(PENDING_TOKEN_KEY);

        router.replace(`/approval/${token}`);
      } catch (err: any) {
        console.error('LIFF approve error:', err);
        setStatus('error');
        setErrorMsg(err?.message || 'エラーが発生しました');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromQuery]);

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
