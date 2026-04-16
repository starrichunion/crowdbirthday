'use client';

import { useState, useEffect } from 'react';
import { Gift, Share2, Eye, Plus, Loader2, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { initLiff, ensureLineLogin, getLineProfile } from '@/lib/liff';
import { upsertUserFromLineProfile, getUserCampaigns } from '@/lib/actions';

interface DashboardCampaign {
  id: string;
  recipient_name: string;
  mode: 'friend' | 'fan';
  wish_item: string | null;
  wish_price: number | null;
  status: string;
  slug: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<DashboardCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userAvatar, setUserAvatar] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const liff = await initLiff();

        if (\!liff.isLoggedIn()) {
          // LIFF未ログイン → ログインボタンを表示（リダイレクトしない）
          setNeedsLogin(true);
          setLoading(false);
          return;
        }

        await loadDashboardData();
      } catch (err: any) {
        console.error('Dashboard init error:', err);
        setNeedsLogin(true);
        setLoading(false);
      }
    })();
  }, []);

  const loadDashboardData = async () => {
    try {
      const profile = await getLineProfile();
      if (\!profile) {
        setNeedsLogin(true);
        setLoading(false);
        return;
      }

      setUserName(profile.displayName);
      setUserAvatar(profile.pictureUrl || '');

      const userRes = await upsertUserFromLineProfile({
        lineUserId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
      });

      if (\!userRes.success) {
        setError('ユーザー情報の取得に失敗しました');
        setLoading(false);
        return;
      }

      const result = await getUserCampaigns(userRes.userId);
      if (result.error) {
        setError(result.error);
      } else {
        setCampaigns(result.campaigns as unknown as DashboardCampaign[]);
      }
    } catch (err: any) {
      console.error('Dashboard load error:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleLineLogin = async () => {
    setLoginLoading(true);
    try {
      // LINE OAuth → 完了後に /dashboard に戻ってくる
      await ensureLineLogin(window.location.href);
    } catch (err: any) {
      console.error('LINE login error:', err);
      setLoginLoading(false);
    }
  };

  // OAuth リダイレクト後の復帰処理
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (\!params.has('code')) return;

    (async () => {
      try {
        await initLiff();
        // URL からクエリ除去
        window.history.replaceState({}, '', '/dashboard');
        setNeedsLogin(false);
        setLoading(true);
        await loadDashboardData();
      } catch (err: any) {
        console.error('LIFF restore error:', err);
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  // ===== ログインが必要な場合 =====
  if (needsLogin) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center">
          <button onClick={() => router.push('/')} className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-pink-500" />
            <span className="font-bold text-gray-900 text-sm">CrowdBirthday</span>
          </button>
        </nav>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-6xl mb-6">🎁</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">マイページ</h1>
          <p className="text-sm text-gray-500 mb-8 text-center">
            LINEでログインして、<br />あなたのキャンペーンを確認しましょう
          </p>
          <button
            onClick={handleLineLogin}
            disabled={loginLoading}
            className="flex items-center justify-center gap-3 px-8 py-3.5 bg-[#06C755] text-white rounded-2xl font-bold hover:bg-[#05b34d] transition-all disabled:opacity-60"
          >
            {loginLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> ログイン中...</>
            ) : (
              <><MessageCircle className="w-5 h-5" /> LINEでログイン</>
            )}
          </button>
          <button
            onClick={() => router.push('/campaign/new')}
            className="mt-4 text-sm text-pink-600 font-semibold hover:underline"
          >
            新しくお祝いページを作る →
          </button>
        </div>
      </div>
    );
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'active': return { text: '募集中', bg: 'bg-green-100 text-green-700' };
      case 'funded': return { text: '目標達成', bg: 'bg-amber-100 text-amber-700' };
      case 'completed': return { text: '完了', bg: 'bg-blue-100 text-blue-700' };
      case 'pending_approval': return { text: '承認待ち', bg: 'bg-yellow-100 text-yellow-700' };
      case 'expired': return { text: '期限切れ', bg: 'bg-gray-100 text-gray-600' };
      default: return { text: status, bg: 'bg-gray-100 text-gray-600' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.push('/')} className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-pink-500" />
          <span className="font-bold text-gray-900 text-sm">CrowdBirthday</span>
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
          {userAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userAvatar} alt="" className="w-full h-full object-cover" />
          ) : (
            userName.charAt(0) || 'U'
          )}
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">マイページ</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {campaigns.length === 0 && \!error ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              まだキャンペーンがありません
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              最初のお祝いページを作ってみましょう
            </p>
            <button
              onClick={() => router.push('/campaign/new')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-2xl font-bold hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" /> お祝いページを作る
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => {
              const sl = statusLabel(campaign.status);
              return (
                <div key={campaign.id} className="bg-white rounded-2xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sl.bg}`}>
                      {sl.text}
                    </span>
                    <span className="text-xs text-gray-400">
                      {campaign.mode === 'fan' ? '🎤 ファン' : '👫 友達'}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 mb-2">
                    {campaign.recipient_name}へのお祝い
                  </h3>

                  {campaign.wish_item && (
                    <p className="text-sm text-gray-500 mb-2">🎁 {campaign.wish_item}</p>
                  )}

                  {campaign.wish_price && (
                    <p className="text-sm text-gray-600 mb-3">
                      目安: {campaign.wish_price.toLocaleString()}円
                    </p>
                  )}

                  {campaign.status === 'funded' && (
                    <button
                      onClick={() => router.push(`/campaign/${campaign.id}/egift`)}
                      className="w-full mt-2 py-3 rounded-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-400 text-white hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Gift className="w-4 h-4" /> eギフトを送信する
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button
                      onClick={() => router.push(`/campaign/${campaign.id}/share`)}
                      className="flex items-center justify-center gap-1 p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-all"
                    >
                      <Share2 className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-semibold text-green-700">シェア</span>
                    </button>
                    <button
                      onClick={() => router.push(`/campaign/${campaign.id}`)}
                      className="flex items-center justify-center gap-1 p-3 rounded-xl bg-pink-50 hover:bg-pink-100 transition-all"
                    >
                      <Eye className="w-4 h-4 text-pink-600" />
                      <span className="text-xs font-semibold text-pink-700">プレビュー</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {campaigns.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => router.push('/campaign/new')}
              className="w-full py-4 rounded-2xl font-bold border-2 border-dashed border-pink-300 text-pink-600 hover:bg-pink-50 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> 新しいお祝いページを作る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
