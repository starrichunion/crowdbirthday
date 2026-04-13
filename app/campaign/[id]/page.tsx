'use client';

import { useState } from 'react';
import { Share2, Heart, MapPin, Calendar } from 'lucide-react';
import ProgressBar from '@/components/ProgressBar';
import ContributeModal from '@/components/ContributeModal';
import MessageCard from '@/components/MessageCard';

// Mock campaign data
const mockCampaignData: Record<string, any> = {
  '1': {
    id: '1',
    title: '太郎の30歳誕生日、新しい冒険へ！',
    product: 'ロードバイク Specialized Tarmac Pro',
    category: '誕生日',
    categoryEmoji: '🎂',
    raised: 285000,
    goal: 350000,
    contributors: 24,
    daysLeft: 12,
    image: 'https://via.placeholder.com/600x400?text=ロードバイク',
    gradient: 'gradient-bg-pink',
    isSurpriseMode: false,
    description: `太郎が30歳の大きな節目を迎えます！

長年の趣味であるロードバイクをステップアップしたいという夢があり、今回のプロジェクトではその夢を実現するためのサポートをお願いしています。

Specialized Tarmac Proは、プロフェッショナルグレードのロードバイク。太郎はこれを使って週末のライドをより快適に、そして新しい地平へチャレンジしたいとのこと。

あなたのお祝いが、太郎の新しい冒険をサポートします。`,
    location: '東京都渋谷区',
    createdAt: new Date('2026-03-20'),
    deadline: new Date('2026-04-21'),
    messages: [
      {
        name: '田中花子',
        amount: 5000,
        message: '太郎へ。30年間お疲れ様。新しい相棒と一緒に楽しい冒険をしてね！',
        anonymous: false,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        name: '鈴木一郎',
        amount: 10000,
        message: '大学の友達からのお祝いです。一緒にツーリング行きましょう！',
        anonymous: false,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        name: '匿名',
        amount: 3000,
        message: '応援しています。素敵な誕生日になるといいですね！',
        anonymous: true,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      {
        name: '佐藤美咲',
        amount: 8000,
        message: '新しいバイクでの冒険、応援してます。安全運転で！',
        anonymous: false,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
    ],
  },
  '2': {
    id: '2',
    title: '花子と太郎、新婚生活応援プロジェクト',
    product: 'ウェディングギフトセット',
    category: '結婚',
    categoryEmoji: '💍',
    raised: 520000,
    goal: 500000,
    contributors: 38,
    daysLeft: 5,
    image: 'https://via.placeholder.com/600x400?text=ウェディング',
    gradient: 'gradient-bg-purple',
    isSurpriseMode: false,
    description: '新婚カップルの新生活をサポートするギフトセットです。',
    location: '東京都千代田区',
    createdAt: new Date('2026-03-15'),
    deadline: new Date('2026-04-14'),
    messages: [
      {
        name: '親族一同',
        amount: 50000,
        message: 'お祝いのご報告とともに、新婚生活を応援します。',
        anonymous: false,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ],
  },
};

interface PageProps {
  params: { id: string };
}

export default function CampaignDetailPage({ params }: PageProps) {
  const campaign = mockCampaignData[params.id] || mockCampaignData['1'];
  const [isModalOpen, setIsModalOpen] = useState(false);

  const percentage = Math.round((campaign.raised / campaign.goal) * 100);

  const handleShare = () => {
    const url = `${window.location.origin}/campaign/${campaign.id}`;
    const text = `${campaign.title} - CrowdBirthdayで応援中！`;

    if (navigator.share) {
      navigator.share({
        title: 'CrowdBirthday',
        text: text,
        url: url,
      });
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(`${text}\n${url}`);
      alert('URLをコピーしました！');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div
        className={`${campaign.gradient} relative h-64 md:h-96 flex items-center justify-center text-6xl md:text-8xl overflow-hidden`}
      >
        {campaign.categoryEmoji}
        {campaign.isSurpriseMode && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full font-bold text-pink-600 text-sm md:text-base">
            🎉 サプライズ企画
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title and Basic Info */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                {campaign.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  プロジェクト公開: {campaign.createdAt.toLocaleDateString('ja-JP')}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {campaign.location}
                </div>
              </div>
              <p className="inline-block badge badge-pink text-base">
                <span className="text-lg">{campaign.categoryEmoji}</span>
                {campaign.category}
              </p>
            </div>

            {/* Product Info */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">ギフト</h3>
              <p className="text-xl font-semibold text-pink-600 mb-2">
                {campaign.product}
              </p>
              <p className="text-gray-600">
                目標金額: ¥{campaign.goal.toLocaleString('ja-JP')}
              </p>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">プロジェクト紹介</h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {campaign.description}
              </p>
            </div>

            {/* Messages Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {campaign.messages.length}件のお祝いメッセージ
              </h3>
              <div className="space-y-4">
                {campaign.messages.map((msg, idx) => (
                  <MessageCard key={idx} {...msg} />
                ))}
              </div>
            </div>

            {/* Legal Notice */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-sm text-gray-700">
              <p className="font-semibold text-blue-900 mb-2">お約束</p>
              <ul className="list-disc list-inside space-y-1 text-blue-900">
                <li>All or Nothing方式: 目標金額に達しない場合、返金されます</li>
                <li>目標達成後、CrowdBirthdayが商品を購入し配送します</li>
                <li>配送料金は目標金額に含まれます</li>
                <li>詳しくは利用規約をご確認ください</li>
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Progress Card */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 sticky top-20">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-900">募集状況</span>
                    <span className="text-2xl font-bold text-pink-600">{percentage}%</span>
                  </div>
                  <ProgressBar raised={campaign.raised} goal={campaign.goal} size="lg" />
                </div>

                {/* Stats */}
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-gray-600">集まった金額</span>
                    <span className="font-bold text-gray-900">
                      ¥{campaign.raised.toLocaleString('ja-JP')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">目標金額</span>
                    <span className="font-bold text-gray-900">
                      ¥{campaign.goal.toLocaleString('ja-JP')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">参加者</span>
                    <span className="font-bold text-gray-900 flex items-center gap-1">
                      <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                      {campaign.contributors}人
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">残り日数</span>
                    <span className="font-bold text-gray-900">{campaign.daysLeft}日</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3 pt-4">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full btn btn-primary text-lg py-3"
                  >
                    お祝いに参加する
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-full btn btn-outline py-3 flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-5 h-5" />
                    シェア
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <ContributeModal
        item={{
          id: campaign.id,
          name: campaign.product,
          price: campaign.goal,
        }}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
