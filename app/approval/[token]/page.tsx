'use client';

import { useEffect, useState } from 'react';
import { Check, Mail, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getLineProfile, initLiff } from '@/lib/liff';

interface ApprovalPageProps {
  params: {
    token: string;
  };
}

interface ApprovalData {
  status: 'pending' | 'approved' | 'rejected';
  campaign: {
    id: string;
    recipientName: string;
    wishItem: string | null;
    wishPrice: number | null;
    status: string;
  };
  organizer: {
    displayName: string;
  };
}

const CB_APPROVAL_STATE_KEY = 'cb_approval_state';
const LINE_APPROVER_PROFILE_KEY = 'line_approver_profile';

export default function ApprovalPage({ params }: ApprovalPageProps) {
  const router = useRouter();
  const [step, setStep] = useState<
    'loading' | 'waiting' | 'egiftEmail' | 'success' | 'error' | 'alreadyDone'
  >('loading');
  const [data, setData] = useState<ApprovalData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [egiftEmail, setEgiftEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lineLoading, setLineLoading] = useState(false);
  const [lineProfile, setLineProfile] = useState<{
    userId: string;
    displayName: string;
    pictureUrl?: string;
  } | null>(null);

  // 1. 承認情報の取得 + /approve からの戻り状態復元
  useEffect(() => {
    (async () => {
      // /approve が LIFF 認証後に保存したプロファイルを先に取り出す
      let restoredProfile: {
        userId: string;
        displayName: string;
        pictureUrl?: string;
      } | null = null;
      try {
        const savedProfile = sessionStorage.getItem(LINE_APPROVER_PROFILE_KEY);
        if (savedProfile) {
          restoredProfile = JSON.parse(savedProfile);
          sessionStorage.removeItem(LINE_APPROVER_PROFILE_KEY);
        }
      } catch {
        /* ignore */
      }

      // 以前入力済みの egiftEmail を復元
      try {
        const savedState = sessionStorage.getItem(CB_APPROVAL_STATE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState) as { egiftEmail?: string };
          if (parsedState.egiftEmail) setEgiftEmail(parsedState.egiftEmail);
          sessionStorage.removeItem(CB_APPROVAL_STATE_KEY);
        }
      } catch {
        /* ignore */
      }

      if (restoredProfile) setLineProfile(restoredProfile);

      try {
        const res = await fetch(`/api/approval/${params.token}`, {
          cache: 'no-store',
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          setErrorMsg(json.error || '承認リンクが無効です');
          setStep('error');
          return;
        }
        setData(json.approval);
        if (json.approval.status === 'approved') {
          setStep('alreadyDone');
        } else if (json.approval.status === 'rejected') {
          setErrorMsg('この承認リクエストは既に拒否されています');
          setStep('error');
        } else if (restoredProfile) {
          // /approve から戻ってきた → LIFF 認証済み。メール入力ステップへ。
          setStep('egiftEmail');
        } else {
          setStep('waiting');
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err?.message || '承認情報の取得に失敗しました');
        setStep('error');
      }
    })();
  }, [params.token]);

  // ユーザーが「承認する」を押した時
  //
  // LINE 内蔵ブラウザから /approve → liff.login() と遷移すると
  // access.line.me の OAuth が 400 Bad Request を返すケースがある
  // （LINE 内蔵ブラウザは LIFF 認証 state を持たないため）。
  //
  // 対策: liffId があるなら必ず LIFF URL (https://liff.line.me/<id>?token=...)
  // に飛ばす。LINE アプリは LIFF URL を検知して LIFF ブラウザで開き直すので、
  // access.line.me を経由せず自動認証が完了する。
  const handleApprove = async () => {
    setLineLoading(true);
    try {
      const liff = await initLiff();
      if (liff.isLoggedIn()) {
        const profile = await getLineProfile();
        if (profile) setLineProfile(profile);
        setStep('egiftEmail');
        return;
      }

      // 未ログイン: 入力途中の状態を保存
      sessionStorage.setItem(
        CB_APPROVAL_STATE_KEY,
        JSON.stringify({ egiftEmail })
      );

      // LINE 内蔵ブラウザかどうかで分岐:
      //   LINE 内: LIFF URL にリダイレクト → LIFF ブラウザで開き直し → 自動認証
      //   外部ブラウザ: /approve?token=... 経由で liff.login() (access.line.me)
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const isLineInAppBrowser = /Line\//i.test(ua);
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

      if (isLineInAppBrowser && liffId) {
        window.location.href = `https://liff.line.me/${liffId}?token=${encodeURIComponent(params.token)}`;
      } else {
        window.location.href = `/approve?token=${encodeURIComponent(params.token)}`;
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'LINE 認証に失敗しました');
      setStep('error');
    } finally {
      setLineLoading(false);
    }
  };

  const handleReject = () => {
    router.push('/');
  };

  const handleSubmitEmail = async () => {
    if (!egiftEmail) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/approval/${params.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: egiftEmail,
          recipientLineUserId: lineProfile?.userId,
          recipientDisplayName: lineProfile?.displayName,
          recipientPictureUrl: lineProfile?.pictureUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || '承認処理に失敗しました');
      }
      setStep('success');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || '承認処理に失敗しました');
      setStep('error');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <p className="text-sm text-gray-500 mt-3">読み込み中...</p>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">エラー</h1>
        <p className="text-sm text-gray-500 max-w-xs">{errorMsg}</p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 text-sm text-pink-600 font-semibold bg-pink-50 px-6 py-3 rounded-full hover:bg-pink-100"
        >
          トップへ
        </button>
      </div>
    );
  }

  if (step === 'alreadyDone') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">承認済みです</h1>
        <p className="text-sm text-gray-500 max-w-xs">
          このお祝いページは既に承認されています。
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 text-sm text-pink-600 font-semibold bg-pink-50 px-6 py-3 rounded-full hover:bg-pink-100"
        >
          トップへ
        </button>
      </div>
    );
  }

  if (step === 'waiting' && data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">📩</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">承認リクエストを受け取りました</h1>
        <p className="text-gray-500 mb-8 max-w-xs text-sm">
          {data.organizer.displayName}さんが、あなた宛のお祝いページを作成しました。<br />
          下記の内容をご確認ください。
        </p>

        <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm mb-6">
          <div className="space-y-4 text-left">
            <div>
              <div className="text-xs text-gray-400 mb-1">企画者</div>
              <div className="text-sm font-semibold text-gray-900">{data.organizer.displayName}</div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <div className="text-xs text-gray-400 mb-1">お祝いの相手</div>
              <div className="text-sm font-semibold text-gray-900">{data.campaign.recipientName} さん</div>
            </div>
            {data.campaign.wishItem && (
              <div className="border-t border-gray-100 pt-4">
                <div className="text-xs text-gray-400 mb-1">🎁 ほしいもの</div>
                <div className="text-sm font-semibold text-gray-900">{data.campaign.wishItem}</div>
                {data.campaign.wishPrice && (
                  <div className="text-xs text-gray-500 mt-1">
                    目安 ¥{data.campaign.wishPrice.toLocaleString('ja-JP')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 w-full max-w-sm text-left">
          <div className="text-xs text-green-700 leading-relaxed">
            <span className="font-semibold">✓ 本人確認について</span>
            <br />
            承認時にLINE認証 → eギフト受取用のメールアドレスを設定します。本人以外が勝手にお祝いページを公開することを防げます。
          </div>
        </div>

        <div className="flex gap-3 w-full max-w-sm">
          <button
            onClick={handleReject}
            className="flex-1 bg-gray-200 text-gray-700 rounded-2xl py-3 font-bold hover:bg-gray-300 transition-all"
          >
            拒否
          </button>
          <button
            onClick={handleApprove}
            disabled={lineLoading}
            className="flex-1 bg-green-500 text-white rounded-2xl py-3 font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {lineLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> 認証中</>
            ) : (
              <><Check className="w-5 h-5" /> 承認する</>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'egiftEmail') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">📧</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">eギフト受取先を設定してください</h1>
        <p className="text-gray-500 mb-8 max-w-xs text-sm">
          このメールアドレスにeギフトが届きます。<br />
          企画者にはこのアドレスは共有されません。
        </p>

        {lineProfile && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 w-full max-w-sm mb-4 flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-full bg-green-200 overflow-hidden">
              {lineProfile.pictureUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={lineProfile.pictureUrl} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <div className="text-xs text-green-700">LINE認証済み</div>
              <div className="text-sm font-semibold text-gray-900">{lineProfile.displayName}</div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm mb-6">
          <label className="block text-xs font-semibold text-gray-600 mb-3 text-left">
            メールアドレス <span className="text-pink-500">*必須</span>
          </label>
          <div className="relative mb-4">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={egiftEmail}
              onChange={(e) => setEgiftEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 text-left">
            <div className="text-xs text-blue-700">
              🔒 このメールアドレスは安全に保護されます。企画者には共有されません。
            </div>
          </div>

          <button
            onClick={handleSubmitEmail}
            disabled={!egiftEmail || submitting}
            className="w-full bg-green-500 text-white rounded-2xl py-3 font-bold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> 送信中</>
            ) : (
              <><Check className="w-5 h-5" /> 承認して設定</>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'success' && data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">承認されました！</h1>
        <p className="text-gray-500 mb-8 max-w-xs text-sm">
          お祝いページを承認しました。<br />
          eギフトの届け先メールアドレスも設定済みです。
        </p>

        <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm mb-6">
          <div className="space-y-4 text-left">
            <div>
              <div className="text-xs text-gray-400 mb-1">承認者</div>
              <div className="text-sm font-semibold text-gray-900">{data.campaign.recipientName}</div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <div className="text-xs text-gray-400 mb-1">eギフト受取先</div>
              <div className="text-sm font-semibold text-gray-900 break-all">{egiftEmail}</div>
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push('/')}
          className="text-sm text-pink-600 font-semibold bg-pink-50 px-6 py-3 rounded-full hover:bg-pink-100 transition-all"
        >
          トップページへ
        </button>
      </div>
    );
  }

  return null;
}
