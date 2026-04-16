'use client';

import { useState, useEffect } from 'react';
import { Gift, Share2, Eye, Plus, Loader2, MessageCircle, Trash2, Ban, Archive as ArchiveIcon, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { initLiff, ensureLineLogin, getLineProfile } from '@/lib/liff';
import { upsertUserFromLineProfile, getUserCampaigns, deleteCampaign, cancelCampaign, archiveCampaign } from '@/lib/actions';

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

  // 企画ライフサイクル操作用 (削除 / 中止 / アーカイブ)
  const [userId, setUserId] = useState<string>('');
  const [actionModal, setActionModal] = useState<
    { kind: 'delete' | 'cancel' | 'archive'; campaign: DashboardCampaign } | null
  >(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const liff = await initLiff();

        if (!liff.isLoggedIn()) {
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
      if (!profile) {
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

      if (!userRes.success) {
        setError('ユーザー情報の取得に失敗しました');
        setLoading(false);
        return;
      }

      setUserId((userRes as any).userId || '');

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
    if (!params.has('code')) return;

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
      case 'cancelled': return { text: '中止', bg: 'bg-rose-100 text-rose-700' };
      case 'archived': return { text: 'アーカイブ', bg: 'bg-slate-100 text-slate-600' };
      default: return { text: status, bg: 'bg-gray-100 text-gray-600' };
    }
  };

  // アーカイブされた企画は既定では非表示
  const visibleCampaigns = showArchived
    ? campaigns
    : campaigns.filter((c) => c.status !== 'archived');
  const hasArchived = campaigns.some((c) => c.status === 'archived');

  const openAction = (
    kind: 'delete' | 'cancel' | 'archive',
    campaign: DashboardCampaign
  ) => {
    setActionError(null);
    setCancelReason('');
    setActionModal({ kind, campaign });
  };

  const closeAction = () => {
    if (actionLoading) return;
    setActionModal(null);
    setActionError(null);
  };

  const executeAction = async () => {
    if (!actionModal || !userId) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const { kind, campaign } = actionModal;
      let res: { success: boolean; error?: string; refundedCount?: number; failedCount?: number };
      if (kind === 'delete') {
        res = await deleteCampaign(userId, campaign.id);
      } else if (kind === 'cancel') {
        res = await cancelCampaign(
          userId,
          campaign.id,
          cancelReason.trim() || undefined
        );
      } else {
        res = await archiveCampaign(userId, campaign.id);
      }
      if (!res.success) {
        setActionError(res.error || '処理に失敗しました');
        return;
      }
      if (kind === 'delete') {
        setCampaigns((prev) => prev.filter((c) => c.id !== campaign.id));
      } else if (kind === 'cancel') {
        setCampaigns((prev) =>
          prev.map((c) =>
            c.id === campaign.id ? { ...c, status: 'cancelled' } : c
          )
        );
      } else {
        setCampaigns((prev) =>
          prev.map((c) =>
            c.id === campaign.id ? { ...c, status: 'archived' } : c
          )
        );
      }
      setActionModal(null);
    } catch (err: any) {
      setActionError(err?.message || '処理に失敗しました');
    } finally {
      setActionLoading(false);
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

        {visibleCampaigns.length === 0 && !error ? (
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
            {visibleCampaigns.map((campaign) => {
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

                  {/* 企画ライフサイクル操作 (状態に応じて出し分け) */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(campaign.status === 'pending_approval' ||
                      campaign.status === 'active') && (
                      <button
                        onClick={() => openAction('delete', campaign)}
                        className="flex-1 min-w-[40%] flex items-center justify-center gap-1 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> 削除
                      </button>
                    )}
                    {(campaign.status === 'active' ||
                      campaign.status === 'funded') && (
                      <button
                        onClick={() => openAction('cancel', campaign)}
                        className="flex-1 min-w-[40%] flex items-center justify-center gap-1 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold transition-all"
                      >
                        <Ban className="w-3.5 h-3.5" /> 中止・返金
                      </button>
                    )}
                    {(campaign.status === 'funded' ||
                      campaign.status === 'egift_sent' ||
                      campaign.status === 'expired' ||
                      campaign.status === 'cancelled') && (
                      <button
                        onClick={() => openAction('archive', campaign)}
                        className="flex-1 min-w-[40%] flex items-center justify-center gap-1 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all"
                      >
                        <ArchiveIcon className="w-3.5 h-3.5" /> アーカイブ
                      </button>
                    )}
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

        {/* アーカイブ済みの企画を表示する切替 (該当があるときのみ表示) */}
        {hasArchived && (
          <div className="mt-6 flex items-center justify-center">
            <label className="inline-flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded border-gray-300"
              />
              アーカイブ済みも表示
            </label>
          </div>
        )}
      </div>

      {/* 確認モーダル (削除 / 中止 / アーカイブ) */}
      {actionModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
          onClick={closeAction}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {actionModal.kind === 'delete' && '企画を削除しますか？'}
                  {actionModal.kind === 'cancel' && '企画を中止しますか？'}
                  {actionModal.kind === 'archive' && '企画をアーカイブしますか？'}
                </h2>
                <button
                  onClick={closeAction}
                  disabled={actionLoading}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center disabled:opacity-50"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                {actionModal.kind === 'delete' && (
                  <>
                    「{actionModal.campaign.recipient_name}へのお祝い」を
                    完全に削除します。応援が1件でも入っている場合は削除できません。
                    この操作は取り消せません。
                  </>
                )}
                {actionModal.kind === 'cancel' && (
                  <>
                    「{actionModal.campaign.recipient_name}へのお祝い」を中止し、
                    これまでに集まった応援を全額返金します。
                    返金処理は Stripe 経由で即時開始されます。
                  </>
                )}
                {actionModal.kind === 'archive' && (
                  <>
                    「{actionModal.campaign.recipient_name}へのお祝い」を
                    マイページから非表示にします。データは削除されません。
                    「アーカイブ済みも表示」からいつでも戻せます。
                  </>
                )}
              </p>

              {actionModal.kind === 'cancel' && (
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1">
                    中止理由 (任意 — 応援してくれた方には表示されません)
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={2}
                    placeholder="例: 受取人の都合により中止"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </div>
              )}

              {actionError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3">
                  <p className="text-xs text-red-700">{actionError}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={closeAction}
                  disabled={actionLoading}
                  className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={executeAction}
                  disabled={actionLoading}
                  className={`flex-1 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2 ${
                    actionModal.kind === 'delete'
                      ? 'bg-red-500 hover:bg-red-600'
                      : actionModal.kind === 'cancel'
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-slate-600 hover:bg-slate-700'
                  }`}
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {actionModal.kind === 'delete' && '削除する'}
                  {actionModal.kind === 'cancel' && '中止して返金する'}
                  {actionModal.kind === 'archive' && 'アーカイブする'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
