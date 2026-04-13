'use client';

import { useState } from 'react';
import { Check, Send, Shield, ChevronLeft, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EGiftPageProps {
  params: {
    id: string;
  };
}

interface GiftOption {
  id: string;
  icon: string;
  name: string;
  tag: string;
  tagColor: string;
}

export default function EGiftPage({ params }: EGiftPageProps) {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [selectedGift, setSelectedGift] = useState('amazon');

  // Mock campaign data
  const campaignData = {
    id: params.id,
    recipient: '田中ゆきの',
    totalReceived: 196000,
    contributorCount: 6,
  };

  const budget = Math.floor(campaignData.totalReceived * 0.9);

  const giftOptions: GiftOption[] = [
    {
      id: 'amazon',
      icon: '🎁',
      name: 'Amazonギフト券',
      tag: '人気No.1',
      tagColor: 'text-orange-600 bg-orange-50',
    },
    {
      id: 'starbucks',
      icon: '☕',
      name: 'スターバックス eGift',
      tag: 'カジュアル',
      tagColor: 'text-green-600 bg-green-50',
    },
    {
      id: 'giftee',
      icon: '🎀',
      name: 'giftee 選べるギフト',
      tag: '選べる',
      tagColor: 'text-pink-600 bg-pink-50',
    },
    {
      id: 'quocard',
      icon: '💳',
      name: 'QUOカードPay',
      tag: '便利',
      tagColor: 'text-blue-600 bg-blue-50',
    },
  ];

  const chosen = giftOptions.find((g) => g.id === selectedGift)!;

  // ===== Step 0: Gift Selection =====
  if (step === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center">
          <button onClick={() => router.back()} className="text-sm text-gray-500">
            ← 戻る
          </button>
          <span className="flex-1 text-center text-sm font-semibold text-gray-700">eギフトを送る</span>
          <div className="w-12" />
        </nav>
        <div className="max-w-md mx-auto px-6 py-6">
          <div className="bg-pink-50 rounded-xl p-3 mb-6 text-center">
            <span className="text-sm text-pink-600">ギフト金額: </span>
            <span className="text-lg font-bold text-pink-700">{budget.toLocaleString()}円</span>
            <span className="text-xs text-pink-400 ml-1">（手数料10%控除後）</span>
          </div>

          <div className="space-y-3 mb-6">
            {giftOptions.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGift(g.id)}
                className={`w-full bg-white rounded-2xl p-4 text-left border-2 transition-all ${
                  selectedGift === g.id
                    ? 'border-pink-400 shadow-md'
                    : 'border-transparent hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0">
                    {g.icon}
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-gray-900 text-sm">{g.name}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ml-2 ${g.tagColor}`}>
                      {g.tag}
                    </span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedGift === g.id ? 'border-pink-500 bg-pink-500' : 'border-gray-300'
                    }`}
                  >
                    {selectedGift === g.id && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep(1)}
            className="w-full py-3.5 rounded-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-400 text-white hover:shadow-lg transition-all"
          >
            確認する
          </button>
        </div>
      </div>
    );
  }

  // ===== Step 1: Confirmation =====
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center">
          <button onClick={() => setStep(0)} className="text-sm text-gray-500">
            ← 戻る
          </button>
          <span className="flex-1 text-center text-sm font-semibold text-gray-700">確認</span>
          <div className="w-12" />
        </nav>
        <div className="max-w-md mx-auto px-6 py-6">
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">受取人</span>
                <span className="text-sm font-semibold">{campaignData.recipient} ✓</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">ギフト</span>
                <span className="text-sm font-semibold">
                  {chosen.icon} {chosen.name}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">金額</span>
                <span className="text-sm font-bold text-pink-600">{budget.toLocaleString()}円</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-500">参加者</span>
                <span className="text-sm font-semibold">{campaignData.contributorCount}人</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-green-700 leading-relaxed">
                eギフトは受取人が承認時に設定したメールアドレスに直接送信されます。企画者を含む他のユーザーにギフトコードは共有されません。
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full py-3.5 rounded-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-400 text-white hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> eギフトを送信する
          </button>
        </div>
      </div>
    );
  }

  // ===== Step 2: Success =====
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-4">🎉✨</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">eギフトを送信しました！</h1>
      <p className="text-gray-500 mb-8 max-w-xs">
        {campaignData.recipient}さんのメールアドレスに
        <br />
        eギフトとメッセージが届きました
      </p>

      <div className="bg-white rounded-2xl shadow-lg p-5 w-full max-w-sm mb-6">
        {[
          { label: '集金完了', time: '自動', done: true },
          { label: 'eギフト購入', time: '自動', done: true },
          { label: 'メール送信', time: '自動', done: true },
          { label: '受取人が開封', time: 'まだ', done: false },
        ].map((s, i) => (
          <div key={i} className="flex items-start gap-3 mb-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  s.done ? 'bg-green-400' : 'bg-gray-200'
                }`}
              >
                {s.done && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              {i < 3 && <div className={`w-0.5 h-4 ${s.done ? 'bg-green-300' : 'bg-gray-200'}`} />}
            </div>
            <div>
              <div className={`text-sm font-semibold ${s.done ? 'text-gray-900' : 'text-gray-400'}`}>
                {s.label}
              </div>
              <div className="text-xs text-gray-400">{s.time}</div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => router.push('/dashboard')}
        className="text-sm text-pink-600 font-semibold bg-pink-50 px-5 py-2.5 rounded-full hover:bg-pink-100 transition-all"
      >
        ダッシュボードへ
      </button>
    </div>
  );
}
