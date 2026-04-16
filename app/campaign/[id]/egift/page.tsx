'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Gift, Users, ArrowLeft, Loader2 } from 'lucide-react';
import React from 'react';

interface CampaignData {
  id: string;
  recipient_name: string;
  wish_item: string | null;
  wish_price: number | null;
  status: string;
  total_raised: number;
  contributor_count: number;
}

type GiftStatus = 'active' | 'funded' | 'gift_purchased' | 'gift_sent';

const STATUS_LABELS: Record<GiftStatus, string> = {
  active: 'まだ目標金額に達していません',
  funded: '目標達成！eギフト手配中...',
  gift_purchased: 'eギフト購入済み・送信準備中',
  gift_sent: 'eギフト送信完了！🎉',
};

const STATUS_COLORS: Record<GiftStatus, { color: string; bg: string }> = {
  active:         { color: 'text-gray-600',  bg: 'bg-gray-50' },
  funded:         { color: 'text-amber-600', bg: 'bg-amber-50' },
  gift_purchased: { color: 'text-blue-600',  bg: 'bg-blue-50' },
  gift_sent:      { color: 'text-green-600', bg: 'bg-green-50' },
};

const STATUS_STEP: Record<GiftStatus, number> = {
  active: 0,
  funded: 1,
  gift_purchased: 2,
  gift_sent: 3,
};

const STEPS = [
  { key: 'funded',         label: '目標達成' },
  { key: 'gift_purchased', label: 'eギフト購入' },
  { key: 'gift_sent',      label: '送信完了' },
];

export default function EGiftPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = searchParams.get('admin') === 'true';

  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchCampaign = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaign/${params.id}`);
      if (!res.ok) throw new Error('キャンペーンが見つかりません');
      const data = await res.json();
      setCampaign(data.campaign);
    } catch (e: any) {
      setError(e.message || 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  const updateStatus = async (newStatus: 'gift_purchased' | 'gift_sent') => {
    if (!campaign) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/campaign/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'ステータス更新に失敗しました');
      }
      setCampaign((prev) => prev ? { ...prev, status: newStatus } : prev);
    } catch (e: any) {
      alert(e.message || 'エラーが発生しました');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-gray-500 mb-4">{error || 'キャンペーンが見つかりません'}</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-pink-600 font-semibold bg-pink-50 px-5 py-2.5 rounded-full hover:bg-pink-100 transition-all"
        >
          戻る
        </button>
      </div>
    );
  }

  const status: GiftStatus = (campaign.status in STATUS_STEP)
    ? (campaign.status as GiftStatus)
    : 'active';
  const currentStep = STATUS_STEP[status];
  const progress =
    campaign.wish_price && campaign.wish_price > 0
      ? Math.min(100, Math.round((campaign.total_raised / campaign.wish_price) * 100))
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          戻る
        </button>
        <span className="flex-1 text-center text-sm font-semibold text-gray-700">
          eギフト状況
        </span>
        <div className="w-12" />
      </nav>

      <div className="max-w-md mx-auto px-6 py-6 space-y-5">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-300 flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-400">受取人</p>
              <p className="text-lg font-bold text-gray-900">
                {campaign.recipient_name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">集まった金額</p>
              <p className="text-lg font-bold text-pink-600">
                ¥{campaign.total_raised.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">参加者</p>
              <p className="text-lg font-bold text-gray-900 flex items-center justify-center gap-1">
                <Users className="w-4 h-4 text-gray-400" />
                {campaign.contributor_count}人
              </p>
            </div>
          </div>
        </div>

        <div className={`${STATUS_COLORS[status].bg} rounded-2xl p-4 text-center`}>
          <p className={`text-sm font-bold ${STATUS_COLORS[status].color}`}>
            {STATUS_LABELS[status]}
          </p>
        </div>

        {status === 'active' && campaign.wish_price && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>進捗</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-400 to-rose-400 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-2">
              <span className="text-gray-400">
                ¥{campaign.total_raised.toLocaleString()}
              </span>
              <span className="text-gray-500 font-semibold">
                ¥{campaign.wish_price.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {currentStep >= 1 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <p className="text-xs text-gray-400 font-semibold mb-4">進行状況</p>
            <div className="space-y-0">
              {STEPS.map((s, i) => {
                const done = i + 1 <= currentStep;
                return (
                  <div key={s.key} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          done ? 'bg-green-400' : 'bg-gray-200'
                        }`}
                      >
                        {done ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : (
                          <span className="text-xs text-white font-bold">
                            {i + 1}
                          </span>
                        )}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div
                          className={`w-0.5 h-6 ${done ? 'bg-green-300' : 'bg-gray-200'}`}
                        />
                      )}
                    </div>
                    <div className="pt-1">
                      <p
                        className={`text-sm font-semibold ${
                          done ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {s.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="bg-white rounded-2xl shadow-sm p-5 border-2 border-dashed border-gray-200">
            <p className="text-xs text-gray-400 font-semibold mb-3">
              管理者アクション
            </p>

            {status === 'funded' && (
              <button
                onClick={() => updateStatus('gift_purchased')}
                disabled={updating}
                className="w-full py-3 rounded-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                購入済みにする
              </button>
            )}

            {status === 'gift_purchased' && (
              <button
                onClick={() => updateStatus('gift_sent')}
                disabled={updating}
                className="w-full py-3 rounded-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                送信済みにする
              </button>
            )}

            {status === 'gift_sent' && (
              <p className="text-sm text-green-600 text-center font-semibold">
                全ステップ完了
              </p>
            )}

            {status === 'active' && (
              <p className="text-sm text-gray-400 text-center">
                目標達成後にアクションが表示されます
              </p>
            )}
          </div>
        )}

        <div className="text-center pt-2 pb-8">
          <button
            onClick={() => router.push(`/campaign/${params.id}`)}
            className="text-sm text-pink-600 font-semibold bg-pink-50 px-5 py-2.5 rounded-full hover:bg-pink-100 transition-all"
          >
            キャンペーンページへ
          </button>
        </div>
      </div>
    </div>
  );
}
