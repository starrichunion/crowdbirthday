'use client';

import { useState, useEffect } from 'react';
import {
  Gift,
  Heart,
  Clock,
  Users,
  Shield,
  ChevronDown,
  ChevronUp,
  X,
  HelpCircle,
  ExternalLink,
  Link as LinkIcon,
} from 'lucide-react';
import Link from 'next/link';
import VerifiedBadge from '@/components/VerifiedBadge';
import ProgressBar from '@/components/ProgressBar';
import MessageCard from '@/components/MessageCard';
import QuickAmount from '@/components/QuickAmount';

// Types
interface CampaignData {
  id: string;
  mode: 'friend' | 'fan';
  recipient_name: string;
  wish_item: string | null;
  wish_item_url: string | null;
  wish_price: number | null;
  sns_links: Array<{ label?: string; url: string }>;
  description: string | null;
  category: string;
  status: string;
  deadline: string | null;
  slug: string;
  total_raised: number;
  contributor_count: number;
}

interface OrganizerData {
  display_name: string;
  avatar_url: string | null;
}

interface ContributionData {
  id: string;
  contributor_name: string;
  amount: number;
  message: string | null;
  is_anonymous: boolean;
  created_at: string;
}

const formatAmount = (n: number) =>
  n >= 10000
    ? `${(n / 10000).toFixed(n % 10000 ? 1 : 0)}万`
    : n.toLocaleString();

const daysRemaining = (deadline: string | null) => {
  if (!deadline) return null;
  const d = new Date(deadline);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

export default function CampaignGiftPage({
  params,
}: {
  params: { id: string };
}) {
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [organizer, setOrganizer] = useState<OrganizerData | null>(null);
  const [contributions, setContributions] = useState<ContributionData[]>([]);
  const [ogPreview, setOgPreview] = useState<{
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
    url: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAllMessages, setShowAllMessages] = useState(false);

  // Contribute modal state
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [contributorName, setContributorName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const finalAmount =
    selectedAmount || (customAmount ? parseInt(customAmount) : 0);

  useEffect(() => {
    loadCampaign();
  }, [params.id]);

  // 欲しい物URL が設定されていれば OGP プレビューを取得
  useEffect(() => {
    const url = campaign?.wish_item_url;
    if (!url) {
      setOgPreview(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(
          `/api/og-preview?url=${encodeURIComponent(url)}`
        );
        if (!r.ok) return;
        const data = await r.json();
        if (!cancelled) setOgPreview({ ...data, url });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campaign?.wish_item_url]);

  async function loadCampaign() {
    try {
      setLoading(true);
      const res = await fetch(`/api/campaign/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data.campaign);
        setOrganizer(data.organizer || null);
        setContributions(data.contributions || []);
      }
    } catch (error) {
      console.error('Failed to load campaign:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleContribute() {
    if (!campaign || finalAmount < 500) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/webhook/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_checkout',
          campaignId: campaign.id,
          amount: finalAmount,
          contributorName: anonymous ? '匿名' : contributorName,
          message,
          isAnonymous: anonymous,
        }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('エラーが発生しました。もう一度お試しください。');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-600 mb-2">
            キャンペーンが見つかりません
          </h1>
          <p className="text-gray-400">リンクが正しいか確認してください</p>
        </div>
      </div>
    );
  }

  const isFriend = campaign.mode === 'friend';
  const remaining = daysRemaining(campaign.deadline);
  const isFunded =
    campaign.wish_price != null && campaign.total_raised >= campaign.wish_price;
  const visibleMessages = showAllMessages
    ? contributions
    : contributions.slice(0, 3);

  // Theme
  const gradientFrom = isFriend ? 'from-pink-500' : 'from-violet-500';
  const gradientTo = isFriend ? 'to-rose-400' : 'to-purple-400';
  const bgLight = isFriend ? 'bg-pink-50' : 'bg-violet-50';
  const textAccent = isFriend ? 'text-pink-600' : 'text-violet-600';

  const amounts = isFriend
    ? [1000, 3000, 5000, 10000, 30000]
    : [500, 1000, 3000, 5000, 10000];

  return (
    <div className={`min-h-screen ${bgLight}`}>
      {/* Hero Header */}
      <div
        className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white px-6 pt-12 pb-8`}
      >
        <div className="max-w-lg mx-auto">
          <div className="mb-4">
            <VerifiedBadge />
          </div>

          <h1 className="text-3xl font-bold mb-2">
            {campaign.recipient_name}
            <span className="text-white/80 text-xl ml-1">へのお祝い</span>
          </h1>

          {/* 企画者プロフィール (アバター + 表示名) */}
          {organizer && (
            <div className="flex items-center gap-2 mb-3 text-sm text-white/90">
              {organizer.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={organizer.avatar_url}
                  alt=""
                  className="w-7 h-7 rounded-full border-2 border-white/40 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold">
                  {organizer.display_name.slice(0, 1)}
                </div>
              )}
              <span>
                {isFriend ? '企画' : '本人'}: {organizer.display_name}
              </span>
            </div>
          )}

          {/* 企画者のSNSリンク（複数） */}
          {Array.isArray(campaign.sns_links) && campaign.sns_links.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {campaign.sns_links.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur text-xs font-semibold transition-all"
                >
                  <LinkIcon className="w-3 h-3" />
                  {s.label || new URL(s.url).hostname.replace(/^www\./, '')}
                </a>
              ))}
            </div>
          )}

          {campaign.wish_item && (
            <div className="flex items-center gap-2 mt-3 bg-white/20 rounded-xl px-4 py-2.5">
              <Gift className="w-5 h-5 flex-shrink-0" />
              <span className="font-semibold">{campaign.wish_item}</span>
              {campaign.wish_price && (
                <span className="ml-auto text-sm opacity-90">
                  ¥{campaign.wish_price.toLocaleString()}
                </span>
              )}
            </div>
          )}

          {/* 商品URL の OGP プレビュー */}
          {campaign.wish_item_url && (
            <a
              href={campaign.wish_item_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-3 bg-white text-gray-900 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex">
                {ogPreview?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ogPreview.image}
                    alt=""
                    className="w-24 h-24 object-cover flex-shrink-0 bg-gray-100"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        'none';
                    }}
                  />
                ) : (
                  <div className="w-24 h-24 flex items-center justify-center bg-gray-100 flex-shrink-0">
                    <Gift className="w-8 h-8 text-gray-300" />
                  </div>
                )}
                <div className="flex-1 p-3 min-w-0">
                  <div className="text-[10px] text-gray-400 mb-0.5 flex items-center gap-1 truncate">
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">
                      {ogPreview?.siteName ||
                        new URL(campaign.wish_item_url).hostname.replace(
                          /^www\./,
                          ''
                        )}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                    {ogPreview?.title || campaign.wish_item || '商品ページを見る'}
                  </div>
                  {ogPreview?.description && (
                    <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {ogPreview.description}
                    </div>
                  )}
                </div>
              </div>
            </a>
          )}

          {campaign.description && (
            <p className="mt-3 text-sm text-white/85 leading-relaxed">
              {campaign.description}
            </p>
          )}
        </div>
      </div>

      {/* Stats + Progress */}
      <div className="max-w-lg mx-auto px-6 -mt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-baseline gap-2 mb-2">
            <span className={`text-3xl font-bold ${textAccent}`}>
              ¥{formatAmount(campaign.total_raised)}
            </span>
            {campaign.wish_price && (
              <span className="text-sm text-gray-400">
                / ¥{formatAmount(campaign.wish_price)}
              </span>
            )}
          </div>

          {campaign.wish_price && (
            <div className="mb-3">
              <ProgressBar
                raised={campaign.total_raised}
                goal={campaign.wish_price}
                size="md"
              />
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>
                <strong className="text-gray-700">
                  {campaign.contributor_count}
                </strong>
                人が参加
              </span>
            </div>
            {remaining !== null && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>
                  残り<strong className="text-gray-700">{remaining}</strong>日
                </span>
              </div>
            )}
          </div>

          {isFunded && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <span className="text-green-700 font-bold text-sm">
                目標金額を達成しました！
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CTA Button */}
      <div className="max-w-lg mx-auto px-6 mt-4">
        <button
          onClick={() => setShowModal(true)}
          className={`w-full py-4 rounded-2xl bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2`}
        >
          <Heart className="w-5 h-5" />
          {isFriend ? '気持ちを送る' : '応援する'}
        </button>
      </div>

      {/* Messages */}
      <div className="max-w-lg mx-auto px-6 mt-6 pb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          みんなの応援 ({campaign.contributor_count})
        </h2>

        {contributions.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
            <Heart className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              まだ応援はありません。最初の応援者になろう！
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleMessages.map((c) => (
              <MessageCard
                key={c.id}
                name={c.contributor_name}
                amount={c.amount}
                message={c.message || undefined}
                anonymous={c.is_anonymous}
                createdAt={new Date(c.created_at)}
              />
            ))}

            {contributions.length > 3 && (
              <button
                onClick={() => setShowAllMessages(!showAllMessages)}
                className="w-full py-3 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1"
              >
                {showAllMessages ? (
                  <>
                    閉じる <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    すべて見る ({contributions.length}件){' '}
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-1">
              安全なお祝いプラットフォーム
            </p>
            <p className="text-xs text-blue-600 leading-relaxed">
              本人承認済みのキャンペーンです。決済はStripeにより安全に処理されます。
              eギフトは受取人のメールに直接送信されます。
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-blue-700 hover:text-blue-900"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              クラウドバースデーとは？
            </Link>
          </div>
        </div>
      </div>

      {/* Contribute Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {isFriend ? '気持ちを送る' : '応援する'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Name */}
              {!anonymous && (
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-2">あなたの名前</div>
                  <input
                    type="text"
                    value={contributorName}
                    onChange={(e) => setContributorName(e.target.value)}
                    placeholder="名前を入力"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>
              )}

              {/* Quick Amounts */}
              <div className="mb-5">
                <div className="text-sm text-gray-500 mb-2">金額を選ぶ</div>
                <div className="flex flex-wrap gap-2">
                  {amounts.map((amt) => (
                    <QuickAmount
                      key={amt}
                      amount={amt}
                      selected={selectedAmount === amt}
                      onClick={() => {
                        setSelectedAmount(amt);
                        setCustomAmount('');
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="mb-5">
                <div className="text-sm text-gray-500 mb-2">
                  または自由に入力
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                    ¥
                  </span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount(null);
                    }}
                    placeholder="0"
                    className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-gray-200 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>
              </div>

              {/* Message */}
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-2">
                  メッセージ（任意）
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder={isFriend ? 'おめでとう！' : '応援してます！'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none text-sm"
                />
              </div>

              {/* Anonymous */}
              <label className="flex items-center gap-3 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded accent-pink-500"
                />
                <span className="text-sm text-gray-700">
                  匿名で{isFriend ? '参加' : '応援'}
                </span>
              </label>

              {/* Security */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-6 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    Stripeによる安全な決済です
                  </p>
                </div>
                <Link
                  href="/about"
                  target="_blank"
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900 whitespace-nowrap"
                >
                  サービスとは？
                </Link>
              </div>

              {/* Submit */}
              <button
                onClick={handleContribute}
                disabled={
                  finalAmount < 500 ||
                  (!anonymous && !contributorName.trim()) ||
                  submitting
                }
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                  finalAmount >= 500 &&
                  (anonymous || contributorName.trim()) &&
                  !submitting
                    ? `bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white hover:shadow-lg`
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {submitting
                  ? '処理中...'
                  : finalAmount >= 500
                    ? `¥${finalAmount.toLocaleString()}を${isFriend ? '送る' : '応援する'}`
                    : '金額を選んでね'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
