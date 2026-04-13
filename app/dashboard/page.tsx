'use client';

import { useState } from 'react';
import { Gift, Share2, Edit3, Eye, ChevronRight, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CampaignActivity {
  name: string;
  avatar: string;
  amount: number;
  timestamp: string;
  anonymous: boolean;
}

interface Campaign {
  id: string;
  title: string;
  mode: 'friend' | 'fan';
  totalReceived: number;
  targetAmount: number;
  status: 'active' | 'funded' | 'completed';
  contributions: CampaignActivity[];
  verifiedBadge: boolean;
}

// Mock data
const MOCK_CAMPAIGN: Campaign = {
  id: 'campaign-123',
  title: 'ゆきのちゃんの20歳のお祝い',
  mode: 'friend',
  totalReceived: 196000,
  targetAmount: 280000,
  status: 'funded',
  verifiedBadge: true,
  contributions: [
    {
      name: 'けんた',
      avatar: '😊',
      amount: 10000,
      timestamp: '2時間前',
      anonymous: false,
    },
    {
      name: '匿名',
      avatar: '🎁',
      amount: 50000,
      timestamp: '4時間前',
      anonymous: true,
    },
    {
      name: 'みさき',
      avatar: '💕',
      amount: 30000,
      timestamp: '6時間前',
      anonymous: false,
    },
    {
      name: 'たろう',
      avatar: '🌟',
      amount: 20000,
      timestamp: '8時間前',
      anonymous: false,
    },
  ],
};

export default function DashboardPage() {
  const router = useRouter();
  const [campaigns] = useState<Campaign[]>([MOCK_CAMPAIGN]);

  const campaign = campaigns[0];
  const percent = Math.round((campaign.totalReceived / campaign.targetAmount) * 100);
  const isFunded = campaign.totalReceived >= campaign.targetAmount;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2"
        >
          <Gift className="w-5 h-5 text-pink-500" />
          <span className="font-bold text-gray-900 text-sm">CrowdBirthday</span>
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-white text-xs font-bold">
          あ
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">マイページ</h1>

        {/* Funded Banner */}
        {isFunded && (
          <div
            onClick={() => router.push(`/campaign/${campaign.id}/egift`)}
            className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl flex-shrink-0">
              🎊
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-amber-900 text-sm">目安金額に到達！</div>
              <div className="text-xs text-amber-700">eギフトの送信に進みましょう</div>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-400 flex-shrink-0" />
          </div>
        )}

        {/* Campaign Card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          {/* Status Badge & Verified */}
          <div className="flex items-center justify-between mb-3">
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              募集中
            </span>
            {campaign.verifiedBadge && (
              <span className="text-xs text-pink-600 font-semibold flex items-center gap-1">
                ✓ 本人承認済み
              </span>
            )}
          </div>

          {/* Campaign Title */}
          <h3 className="font-bold text-gray-900 mb-3">{campaign.title}</h3>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all"
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>

          {/* Amount Info */}
          <div className="flex items-center justify-between text-sm mb-4">
            <span className="text-gray-900 font-bold">{campaign.totalReceived.toLocaleString()}円</span>
            <span className="text-gray-400">目安 {campaign.targetAmount.toLocaleString()}円</span>
          </div>

          {/* Primary CTA */}
          {isFunded && (
            <button
              onClick={() => router.push(`/campaign/${campaign.id}/egift`)}
              className="w-full mt-4 py-3.5 rounded-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-400 text-white hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Gift className="w-4 h-4" /> eギフトを送信する
            </button>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <button
              onClick={() => router.push(`/campaign/${campaign.id}/share`)}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-all"
            >
              <Share2 className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-green-700">シェア</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-all">
              <Edit3 className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-blue-700">編集</span>
            </button>
            <button
              onClick={() => router.push(`/campaign/${campaign.id}`)}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-pink-50 hover:bg-pink-100 transition-all"
            >
              <Eye className="w-4 h-4 text-pink-600" />
              <span className="text-xs font-semibold text-pink-700">プレビュー</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-4">最近のアクティビティ</h3>
          <div className="space-y-3">
            {campaign.contributions.slice(0, 4).map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm flex-shrink-0">
                  {c.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900">
                    {c.anonymous ? '匿名の方' : c.name}が{' '}
                    <span className="font-semibold text-pink-600">
                      {c.amount.toLocaleString()}円
                    </span>{' '}
                    を送りました
                  </div>
                  <div className="text-xs text-gray-400">{c.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create New Campaign Button */}
        <div className="mt-6">
          <button
            onClick={() => router.push('/campaign/new')}
            className="w-full py-4 rounded-2xl font-bold border-2 border-dashed border-pink-300 text-pink-600 hover:bg-pink-50 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> 新しいお祝いページを作る
          </button>
        </div>
      </div>
    </div>
  );
}
