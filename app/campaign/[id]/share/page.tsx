'use client';

import { useState } from 'react';
import { Copy, Check, MessageCircle, Share2, ChevronRight, Link2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SharePageProps {
  params: {
    id: string;
  };
}

export default function SharePage({ params }: SharePageProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  // Mock campaign data
  const campaignData = {
    id: params.id,
    title: 'ゆきのちゃんの20歳のお祝い',
    shareLink: 'crowdbirthday.com/g/yukino-20th',
    mode: 'friend', // or 'fan'
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(campaignData.shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex flex-col items-center justify-center px-6">
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">ページ完成！</h1>
      <p className="text-gray-500 text-center mb-8 max-w-xs">
        リンクをLINEで送って、みんなにお祝いを呼びかけよう
      </p>

      {/* Link Display */}
      <div className="bg-white rounded-2xl shadow-lg p-5 w-full max-w-sm mb-6">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
          <Link2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-700 truncate flex-1">{campaignData.shareLink}</span>
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
          <button className="flex items-center justify-center gap-2 bg-green-500 text-white rounded-xl py-3 font-bold text-sm hover:bg-green-600 transition-all">
            <MessageCircle className="w-4 h-4" /> LINEで送る
          </button>
          <button className="flex items-center justify-center gap-2 bg-gray-900 text-white rounded-xl py-3 font-bold text-sm hover:bg-gray-800 transition-all">
            <Share2 className="w-4 h-4" /> X でシェア
          </button>
        </div>
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
