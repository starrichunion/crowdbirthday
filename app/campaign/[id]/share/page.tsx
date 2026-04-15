'use client';

import { useEffect, useState } from 'react';
import {
  Copy,
  Check,
  MessageCircle,
  Share2,
  ChevronRight,
  Link2,
  Loader2,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { shareCampaignInvite, initLiff } from '@/lib/liff';

interface SharePageProps {
  params: {
    id: string;
  };
}

interface CampaignInfo {
  id: string;
  recipientName: string;
  slug: string;
  mode: 'friend' | 'fan';
}

export default function SharePage({ params }: SharePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token'); // 友達モード時のみ
  const modeFromQuery = (searchParams.get('mode') as 'friend' | 'fan') || null;
  const slugFromQuery = searchParams.get('slug'); // ファンモード時に new ページから渡される

  const [copied, setCopied] = useState(false);
  const [campaign, setCampaign] = useState<CampaignInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shareSending, setShareSending] = useState(false);
  const [shareResult, setShareResult] = useState<string | null>(null);

  // 共有先 URL: 友達モードは /approval/<token>、ファンモードは /g/<slug>
  const baseUrl =
    typeof window !== 'undefined' ? window.location.origin : '';

  const shareUrl = (() => {
    if (!campaign) return '';
    if (campaign.mode === 'friend' && token) {
      return `${baseUrl}/approval/${token}`;
    }
    return `${baseUrl}/g/${campaign.slug}`;
  })();

  // 1. キャンペーン情報を取得（id 経由で）
  useEffect(() => {
    (async () => {
      try {
        // share 直後は token 経由でしか campaign id を持たないため、
        // 友達モード時は /api/approval/<token> から取れる
        if (token) {
          const res = await fetch(`/api/approval/${token}`, {
            cache: 'no-store',
          });
          const json = await res.json();
          if (!res.ok || !json.success) {
            throw new Error(json.error || 'キャンペーン情報を取得できませんでした');
          }
          setCampaign({
            id: json.approval.campaign.id,
            recipientName: json.approval.campaign.recipientName,
            slug: '', // 友達モードは approval URL を共有するので slug は不要
            mode: 'friend',
          });
        } else {
          // ファンモード: new ページから ?slug=... が渡される想定
          setCampaign({
            id: params.id,
            recipientName: '', // 公開ページの方で表示されるので share 上は空でOK
            slug: slugFromQuery || params.id,
            mode: modeFromQuery || 'fan',
          });
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err?.message || 'キャンペーン情報を取得できませんでした');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, token]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * LINE shareTargetPicker で友達に招待を送る
   *
   * 友達モード: /approval/<token> リンクを送る → 受取人本人が承認
   * ファンモード: /g/<slug> リンクを送る → ファンが直接コントリビュート
   */
  const handleLineShare = async () => {
    if (!campaign) return;
    setShareResult(null);
    setShareSending(true);
    try {
      await initLiff();
      const title =
        campaign.mode === 'friend'
          ? `${campaign.recipientName}さんへのお祝い`
          : `${campaign.recipientName || '私'} のお祝いページ`;
      const ok = await shareCampaignInvite(
        campaign.recipientName || 'みんな',
        title,
        shareUrl
      );
      if (ok) {
        setShareResult('LINEで送信しました！');
      } else {
        // shareTargetPicker は LIFF 内専用なので、外部ブラウザ時は
        // LINE 公式の Share Plugin (lineit/share) にフォールバック。
        // これは LINE アプリを開いて友達を選ぶダイアログが出る。
        const lineShareUrl =
          `https://social-plugins.line.me/lineit/share?url=` +
          encodeURIComponent(shareUrl);
        window.open(lineShareUrl, '_blank', 'noopener,noreferrer');
        setShareResult('LINEのシェア画面を開きました。送る友達を選んでください。');
      }
    } catch (err: any) {
      console.error(err);
      setShareResult(err?.message || 'LINE 送信に失敗しました');
    } finally {
      setShareSending(false);
    }
  };

  const handleXShare = () => {
    const text = encodeURIComponent(
      `🎉 ${campaign?.recipientName || ''} のお祝いページができました！\n${shareUrl}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <p className="text-sm text-gray-500 mt-3">読み込み中...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-sm text-gray-500 max-w-xs">{errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex flex-col items-center justify-center px-6">
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">ページ完成！</h1>
      <p className="text-gray-500 text-center mb-8 max-w-xs">
        {campaign?.mode === 'friend'
          ? 'まずは本人にLINEで承認リンクを送りましょう'
          : 'リンクをLINEで送って、みんなにお祝いを呼びかけよう'}
      </p>

      {/* Link Display */}
      <div className="bg-white rounded-2xl shadow-lg p-5 w-full max-w-sm mb-6">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
          <Link2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-700 truncate flex-1">{shareUrl}</span>
          <button
            onClick={handleCopyLink}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              copied ? 'bg-green-100 text-green-700' : 'bg-pink-100 text-pink-600'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                済
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                コピー
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleLineShare}
            disabled={shareSending}
            className="flex items-center justify-center gap-2 bg-green-500 text-white rounded-xl py-3 font-bold text-sm hover:bg-green-600 transition-all disabled:opacity-60"
          >
            {shareSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MessageCircle className="w-4 h-4" />
            )}{' '}
            LINEで送る
          </button>
          <button
            onClick={handleXShare}
            className="flex items-center justify-center gap-2 bg-gray-900 text-white rounded-xl py-3 font-bold text-sm hover:bg-gray-800 transition-all"
          >
            <Share2 className="w-4 h-4" /> X でシェア
          </button>
        </div>

        {shareResult && (
          <div className="text-xs text-gray-600 mt-3 text-center">{shareResult}</div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex gap-4">
        <button
          onClick={() => router.push(`/campaign/${params.id}`)}
          className="text-sm text-pink-600 font-semibold flex items-center gap-1 hover:underline"
        >
          ギフトページ <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm text-gray-500 flex items-center gap-1 hover:underline"
        >
          ダッシュボード <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
