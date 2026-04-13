'use client';

import { useState } from 'react';
import { Check, Gift, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ApprovalPageProps {
  params: {
    token: string;
  };
}

export default function ApprovalPage({ params }: ApprovalPageProps) {
  const router = useRouter();
  const [step, setStep] = useState<'waiting' | 'approve' | 'egiftEmail' | 'success'>('waiting');
  const [egiftEmail, setEgiftEmail] = useState('');

  // Mock campaign data - in real app, this would be fetched from server
  const campaignData = {
    title: 'ゆきのちゃんの20歳のお祝い',
    organizer: '鈴木あかり',
    recipient: '田中ゆきの',
    occasion: '誕生日',
    theme: 'birthday',
  };

  const handleApprove = () => {
    setStep('egiftEmail');
  };

  const handleReject = () => {
    router.push('/');
  };

  const handleSubmitEmail = () => {
    if (egiftEmail) {
      setStep('success');
    }
  };

  if (step === 'waiting') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">📩</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">承認リクエストを受け取りました</h1>
        <p className="text-gray-500 mb-8 max-w-xs text-sm">
          {campaignData.organizer}さんが、あなた宛のお祝いページを作成しました。<br />
          下記の内容をご確認ください。
        </p>

        <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm mb-6">
          <div className="space-y-4">
            <div>
              <div className="text-xs text-gray-400 mb-1">企画者</div>
              <div className="text-sm font-semibold text-gray-900">{campaignData.organizer}</div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <div className="text-xs text-gray-400 mb-1">お祝いの内容</div>
              <div className="text-sm font-semibold text-gray-900">{campaignData.title}</div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <div className="text-xs text-gray-400 mb-1">🎁 企画タイプ</div>
              <div className="text-sm font-semibold text-gray-900">👫 友達モード</div>
              <div className="text-xs text-gray-500 mt-1">
                みんなからのお祝い金がeギフトで届きます。あなたのメールアドレスに直接送信されます。
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 w-full max-w-sm">
          <div className="text-xs text-green-700 leading-relaxed">
            <span className="font-semibold">✓ 本人確認について</span>
            <br />
            承認後、eギフトの届け先メールアドレスを設定していただきます。これにより、本人以外が勝手にページを作成することを防げます。
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
            className="flex-1 bg-green-500 text-white rounded-2xl py-3 font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" /> 承認する
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

        <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm mb-6">
          <label className="block text-xs font-semibold text-gray-600 mb-3">
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

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
            <div className="text-xs text-blue-700">
              🔒 このメールアドレスは安全に保護されます。企画者には共有されません。
            </div>
          </div>

          <button
            onClick={handleSubmitEmail}
            disabled={!egiftEmail}
            className="w-full bg-green-500 text-white rounded-2xl py-3 font-bold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" /> 承認して設定
          </button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
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
              <div className="text-sm font-semibold text-gray-900">{campaignData.recipient}</div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <div className="text-xs text-gray-400 mb-1">eギフト受取先</div>
              <div className="text-sm font-semibold text-gray-900 break-all">{egiftEmail}</div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <div className="text-xs text-gray-400 mb-1">ページ</div>
              <div className="text-sm font-semibold text-gray-900">{campaignData.title}</div>
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
