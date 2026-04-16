'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  Users,
  Flame,
  AlertTriangle,
  Loader2,
  Shield,
  X,
  Archive as ArchiveIcon,
  Ban,
  Clock,
  RefreshCcw,
  Bug,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { initLiff, ensureLineLogin, getLineProfile } from '@/lib/liff';
import { upsertUserFromLineProfile } from '@/lib/actions';
import {
  checkIsAdmin,
  getAdminKpi,
  getAllCampaigns,
  getAllUsers,
  getAdminAlerts,
  adminArchiveCampaign,
  adminForceExpire,
  adminForceCancelRefund,
  adminToggleUserAdmin,
  getRecentErrors,
  getErrorSummary,
  markErrorResolved,
  bulkResolveBySource,
  type AdminKpi,
  type AdminCampaignRow,
  type AdminUserRow,
  type AdminAlert,
  type AdminErrorLog,
  type AdminErrorSummaryRow,
} from '@/lib/admin';

type Tab = 'overview' | 'campaigns' | 'users' | 'alerts' | 'errors';

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const [kpi, setKpi] = useState<AdminKpi | null>(null);
  const [campaigns, setCampaigns] = useState<AdminCampaignRow[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [errors, setErrors] = useState<AdminErrorLog[]>([]);
  const [errorSummary, setErrorSummary] = useState<AdminErrorSummaryRow[]>([]);

  const [actionModal, setActionModal] = useState<
    { kind: 'archive' | 'expire' | 'cancel_refund'; campaign: AdminCampaignRow } | null
  >(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const liff = await initLiff();
        if (!liff.isLoggedIn()) {
          setNeedsLogin(true);
          setLoading(false);
          return;
        }
        await bootstrap();
      } catch (err) {
        console.error('admin init error:', err);
        setNeedsLogin(true);
        setLoading(false);
      }
    })();
  }, []);

  const bootstrap = async () => {
    setLoading(true);
    try {
      const profile = await getLineProfile();
      if (!profile) {
        setNeedsLogin(true);
        setLoading(false);
        return;
      }
      const r = await upsertUserFromLineProfile({
        lineUserId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl ?? null,
      });
      if (!r.success) {
        setAuthError('ユーザー同期に失敗しました');
        setLoading(false);
        return;
      }
      setUserId(r.userId);
      const adminOk = await checkIsAdmin(r.userId);
      if (!adminOk) {
        setAuthError('このページは管理者専用です');
        setLoading(false);
        return;
      }
      await loadAll(r.userId);
    } catch (err) {
      console.error(err);
      setAuthError(err instanceof Error ? err.message : 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAll = async (uid: string) => {
    const [kpiR, cR, uR, aR, eR, esR] = await Promise.all([
      getAdminKpi(uid),
      getAllCampaigns(uid),
      getAllUsers(uid),
      getAdminAlerts(uid),
      getRecentErrors(uid, { limit: 100, onlyUnresolved: false }),
      getErrorSummary(uid),
    ]);
    if (kpiR.success && kpiR.kpi) setKpi(kpiR.kpi);
    if (cR.success && cR.campaigns) setCampaigns(cR.campaigns);
    if (uR.success && uR.users) setUsers(uR.users);
    if (aR.success && aR.alerts) setAlerts(aR.alerts);
    if (eR.success && eR.errors) setErrors(eR.errors);
    if (esR.success && esR.summary) setErrorSummary(esR.summary);
  };

  const handleLogin = async () => {
    setLoginLoading(true);
    try {
      await ensureLineLogin();
      await bootstrap();
      setNeedsLogin(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionModal || !userId) return;
    setActionLoading(true);
    setActionError(null);
    try {
      let r: { success: boolean; error?: string } = { success: false };
      if (actionModal.kind === 'archive') {
        r = await adminArchiveCampaign(userId, actionModal.campaign.id);
      } else if (actionModal.kind === 'expire') {
        r = await adminForceExpire(userId, actionModal.campaign.id);
      } else if (actionModal.kind === 'cancel_refund') {
        r = await adminForceCancelRefund(userId, actionModal.campaign.id, cancelReason);
      }
      if (!r.success) {
        setActionError(r.error || '実行に失敗しました');
        return;
      }
      setActionModal(null);
      setCancelReason('');
      await loadAll(userId);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAdmin = async (u: AdminUserRow) => {
    if (!userId) return;
    if (!confirm(`${u.display_name} を ${u.is_admin ? '管理者から外す' : '管理者にする'}？`)) return;
    const r = await adminToggleUserAdmin(userId, u.id, !u.is_admin);
    if (!r.success) {
      alert(r.error || 'failed');
      return;
    }
    await loadAll(userId);
  };

  const handleResolveError = async (errorId: string, resolved: boolean) => {
    if (!userId) return;
    const r = await markErrorResolved(userId, errorId, resolved);
    if (!r.success) {
      alert(r.error || 'failed');
      return;
    }
    await loadAll(userId);
  };

  const handleBulkResolve = async (source: string) => {
    if (!userId) return;
    if (!confirm(`source=${source} の未解決エラーをすべて解決済みにしますか？`)) return;
    const r = await bulkResolveBySource(userId, source);
    if (!r.success) {
      alert(r.error || 'failed');
      return;
    }
    alert(`${r.updatedCount ?? 0} 件を解決済みにしました`);
    await loadAll(userId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }
  if (needsLogin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <Shield className="w-12 h-12 text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">管理者ダッシュボード</h1>
        <p className="text-gray-600 mb-6">LINE でログインしてください</p>
        <button
          onClick={handleLogin}
          disabled={loginLoading}
          className="bg-[#06C755] text-white px-6 py-3 rounded-full font-semibold disabled:opacity-50"
        >
          {loginLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'LINEでログイン'}
        </button>
      </div>
    );
  }
  if (authError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">アクセスできません</h1>
        <p className="text-gray-600">{authError}</p>
      </div>
    );
  }

  const unresolvedErrorCount = kpi?.unresolvedErrors ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-rose-500 to-pink-600 text-white p-4 shadow">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            <h1 className="text-xl font-bold">管理者ダッシュボード</h1>
          </div>
          <button
            onClick={() => loadAll(userId)}
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full flex items-center gap-1"
          >
            <RefreshCcw className="w-4 h-4" />
            再読込
          </button>
        </div>
      </header>

      <nav className="bg-white shadow-sm sticky top-0 z-10 overflow-x-auto">
        <div className="max-w-6xl mx-auto flex min-w-max">
          {[
            { k: 'overview' as Tab,  label: '概要',        icon: BarChart3, badge: 0 },
            { k: 'campaigns' as Tab, label: 'キャンペーン', icon: Flame, badge: 0 },
            { k: 'users' as Tab,     label: 'ユーザー',     icon: Users, badge: 0 },
            { k: 'alerts' as Tab,    label: 'アラート',     icon: AlertTriangle, badge: alerts.length },
            { k: 'errors' as Tab,    label: 'エラー',       icon: Bug, badge: unresolvedErrorCount },
          ].map(({ k, label, icon: Icon, badge }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex-1 min-w-[100px] py-3 flex items-center justify-center gap-1.5 text-sm font-medium border-b-2 transition ${
                tab === k
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {badge > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-rose-500 text-white text-xs rounded-full">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 pb-20">
        {tab === 'overview' && kpi && <OverviewTab kpi={kpi} />}
        {tab === 'campaigns' && (
          <CampaignsTab
            campaigns={campaigns}
            onAction={(kind, c) => {
              setActionError(null);
              setCancelReason('');
              setActionModal({ kind, campaign: c });
            }}
          />
        )}
        {tab === 'users' && <UsersTab users={users} selfId={userId} onToggleAdmin={handleToggleAdmin} />}
        {tab === 'alerts' && <AlertsTab alerts={alerts} />}
        {tab === 'errors' && (
          <ErrorsTab
            errors={errors}
            summary={errorSummary}
            onResolve={handleResolveError}
            onBulkResolve={handleBulkResolve}
          />
        )}
      </main>

      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                {actionModal.kind === 'archive' && <ArchiveIcon className="w-5 h-5 text-gray-600" />}
                {actionModal.kind === 'expire' && <Clock className="w-5 h-5 text-amber-600" />}
                {actionModal.kind === 'cancel_refund' && <Ban className="w-5 h-5 text-rose-600" />}
                {actionModal.kind === 'archive' && '強制アーカイブ'}
                {actionModal.kind === 'expire' && '強制クローズ (expired)'}
                {actionModal.kind === 'cancel_refund' && '強制キャンセル + 全額返金'}
              </h2>
              <button onClick={() => setActionModal(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-sm text-gray-700 mb-4">
              <div className="font-semibold">{actionModal.campaign.recipient_name}</div>
              <div className="text-gray-500 text-xs mt-0.5">
                {actionModal.campaign.organizer_name} / {actionModal.campaign.slug}
              </div>
            </div>
            {actionModal.kind === 'cancel_refund' && (
              <div className="mb-4">
                <p className="text-sm text-rose-700 bg-rose-50 p-3 rounded mb-3">
                  ⚠ 全件に Stripe 返金を実行し、ステータスを cancelled にします。取り消せません。
                </p>
                <label className="block text-xs text-gray-600 mb-1">理由（記録用・任意）</label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="例: 規約違反 / 本人申請"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
            )}
            {actionError && <p className="text-rose-600 text-sm mb-3">{actionError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setActionModal(null)}
                className="flex-1 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-sm"
              >
                キャンセル
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading}
                className="flex-1 py-2 rounded-full bg-rose-500 text-white disabled:opacity-50 text-sm"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : '実行'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewTab({ kpi }: { kpi: AdminKpi }) {
  const cards = [
    { label: '総ユーザー数', value: kpi.totalUsers.toLocaleString() },
    { label: '総キャンペーン', value: kpi.totalCampaigns.toLocaleString() },
    { label: 'アクティブ', value: kpi.activeCampaigns.toLocaleString() },
    { label: '完了', value: kpi.completedCampaigns.toLocaleString() },
    { label: 'キャンセル', value: kpi.cancelledCampaigns.toLocaleString() },
    { label: '累計調達額', value: `¥${kpi.totalRaised.toLocaleString()}` },
    { label: 'プラットフォーム手数料 (5%)', value: `¥${kpi.totalPlatformFee.toLocaleString()}` },
    { label: '締切超過 active', value: kpi.pastDueCampaigns.toLocaleString(), alert: kpi.pastDueCampaigns > 0 },
    { label: '今月の返金件数', value: kpi.refundsThisMonth.toLocaleString() },
    { label: '未解決エラー', value: kpi.unresolvedErrors.toLocaleString(), alert: kpi.unresolvedErrors > 0 },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rounded-2xl p-4 shadow-sm ${
            c.alert ? 'bg-rose-50 border border-rose-200' : 'bg-white'
          }`}
        >
          <div className="text-xs text-gray-500 mb-1">{c.label}</div>
          <div className={`text-2xl font-bold ${c.alert ? 'text-rose-700' : 'text-gray-900'}`}>
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function statusBadge(s: string) {
  const map: Record<string, string> = {
    pending_approval: 'bg-amber-100 text-amber-700',
    active:           'bg-emerald-100 text-emerald-700',
    funded:           'bg-blue-100 text-blue-700',
    egift_sent:       'bg-purple-100 text-purple-700',
    expired:          'bg-gray-200 text-gray-700',
    cancelled:        'bg-rose-100 text-rose-700',
    archived:         'bg-gray-100 text-gray-500',
  };
  return map[s] || 'bg-gray-100 text-gray-600';
}

function CampaignsTab({
  campaigns,
  onAction,
}: {
  campaigns: AdminCampaignRow[];
  onAction: (kind: 'archive' | 'expire' | 'cancel_refund', c: AdminCampaignRow) => void;
}) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const filtered = campaigns.filter((c) => {
    const q = query.toLowerCase();
    const matchQ =
      !q ||
      c.recipient_name.toLowerCase().includes(q) ||
      c.organizer_name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q);
    const matchS = !statusFilter || c.status === statusFilter;
    return matchQ && matchS;
  });

  return (
    <div className="mt-4">
      <div className="flex gap-2 mb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="受取人 / 主催者 / slug で検索"
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm bg-white"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded px-2 py-2 text-sm bg-white"
        >
          <option value="">全状態</option>
          <option value="pending_approval">承認待ち</option>
          <option value="active">公開中</option>
          <option value="funded">達成</option>
          <option value="egift_sent">eギフト送付済</option>
          <option value="expired">締切</option>
          <option value="cancelled">キャンセル</option>
          <option value="archived">アーカイブ</option>
        </select>
      </div>
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center text-gray-500 py-8">該当なし</div>
        )}
        {filtered.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 truncate">{c.recipient_name}</div>
                <div className="text-xs text-gray-500 truncate">
                  {c.organizer_name} ({c.organizer_email})
                </div>
                <div className="text-xs text-gray-400 truncate">
                  /{c.slug} · {c.mode} · {c.category}
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${statusBadge(c.status)}`}>
                {c.status}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
              <div className="bg-gray-50 rounded p-2">
                <div className="text-gray-500">調達額</div>
                <div className="font-bold">¥{Number(c.raised_amount).toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-gray-500">支援者</div>
                <div className="font-bold">{c.contributor_count}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-gray-500">返金</div>
                <div className="font-bold">{c.refunded_count}</div>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap">
              <a
                href={`/campaign/${c.slug}`}
                target="_blank"
                rel="noopener"
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50"
              >
                開く
              </a>
              <button
                onClick={() => onAction('archive', c)}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center gap-1"
              >
                <ArchiveIcon className="w-3 h-3" /> アーカイブ
              </button>
              <button
                onClick={() => onAction('expire', c)}
                className="text-xs px-3 py-1.5 rounded-full border border-amber-200 text-amber-700 hover:bg-amber-50 flex items-center gap-1"
              >
                <Clock className="w-3 h-3" /> 強制クローズ
              </button>
              <button
                onClick={() => onAction('cancel_refund', c)}
                className="text-xs px-3 py-1.5 rounded-full border border-rose-200 text-rose-700 hover:bg-rose-50 flex items-center gap-1"
              >
                <Ban className="w-3 h-3" /> 強制返金
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersTab({
  users,
  selfId,
  onToggleAdmin,
}: {
  users: AdminUserRow[];
  selfId: string;
  onToggleAdmin: (u: AdminUserRow) => void;
}) {
  return (
    <div className="mt-4 space-y-2">
      {users.length === 0 && (
        <div className="text-center text-gray-500 py-8">ユーザーがいません</div>
      )}
      {users.map((u) => (
        <div key={u.id} className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="font-semibold truncate flex items-center gap-2">
                {u.display_name}
                {u.is_admin && (
                  <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                    admin
                  </span>
                )}
                {u.is_creator && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    creator
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 truncate">{u.email}</div>
              <div className="text-xs text-gray-400">
                via {u.provider} · {new Date(u.created_at).toLocaleDateString('ja-JP')}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs text-gray-500">企画</div>
              <div className="font-bold">{u.campaign_count}</div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-gray-500">
              調達累計: <span className="font-semibold text-gray-800">¥{Number(u.total_raised).toLocaleString()}</span>
            </div>
            <button
              onClick={() => onToggleAdmin(u)}
              disabled={u.id === selfId && u.is_admin}
              className="text-xs px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {u.is_admin ? 'admin解除' : 'admin付与'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AlertsTab({ alerts }: { alerts: AdminAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="mt-8 text-center text-gray-500">
        <div className="text-4xl mb-2">✓</div>
        現在アラートはありません
      </div>
    );
  }
  return (
    <div className="mt-4 space-y-2">
      {alerts.map((a) => (
        <div key={a.id} className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-rose-400">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-gray-900 truncate">{a.recipient_name}</div>
              <div className="text-xs text-gray-500 truncate">
                {a.organizer_name} · /{a.slug}
              </div>
              <div className="text-sm text-rose-700 mt-1">{a.detail}</div>
            </div>
            <a
              href={`/campaign/${a.slug}`}
              target="_blank"
              rel="noopener"
              className="text-xs px-2 py-1 rounded bg-gray-50 hover:bg-gray-100 flex-shrink-0"
            >
              開く
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorsTab({
  errors,
  summary,
  onResolve,
  onBulkResolve,
}: {
  errors: AdminErrorLog[];
  summary: AdminErrorSummaryRow[];
  onResolve: (errorId: string, resolved: boolean) => void;
  onBulkResolve: (source: string) => void;
}) {
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'error' | 'warn'>('unresolved');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const filtered = errors.filter((e) => {
    if (filter === 'unresolved') return !e.resolved;
    if (filter === 'error') return e.level === 'error';
    if (filter === 'warn') return e.level === 'warn';
    return true;
  });
  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const levelBadge = (l: string) => {
    if (l === 'error') return 'bg-rose-100 text-rose-700';
    if (l === 'warn') return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-700';
  };
  return (
    <div className="mt-4">
      {/* サマリー */}
      {summary.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">source 別サマリー</h2>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">Source</th>
                  <th className="px-2 py-2">Level</th>
                  <th className="px-2 py-2">24h</th>
                  <th className="px-2 py-2">7d</th>
                  <th className="px-2 py-2">未解決</th>
                  <th className="px-2 py-2">最新</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-mono text-xs">{s.source}</td>
                    <td className="px-2 py-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded-full ${levelBadge(s.level)}`}>{s.level}</span>
                    </td>
                    <td className="px-2 py-2 text-center font-semibold">{s.count_24h}</td>
                    <td className="px-2 py-2 text-center">{s.count_7d}</td>
                    <td className={`px-2 py-2 text-center font-semibold ${s.unresolved > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                      {s.unresolved}
                    </td>
                    <td className="px-2 py-2 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(s.last_seen).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {s.unresolved > 0 && (
                        <button
                          onClick={() => onBulkResolve(s.source)}
                          className="text-xs px-2 py-0.5 rounded border border-gray-200 hover:bg-gray-50"
                        >
                          一括解決
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* フィルタ */}
      <div className="flex gap-2 mb-3">
        {([
          { k: 'unresolved' as const, label: '未解決のみ' },
          { k: 'error' as const, label: 'error' },
          { k: 'warn' as const, label: 'warn' },
          { k: 'all' as const, label: 'すべて' },
        ]).map(({ k, label }) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              filter === k
                ? 'bg-rose-500 text-white border-rose-500'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* エラー一覧 */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">✓</div>
            該当するエラーはありません
          </div>
        )}
        {filtered.map((e) => {
          const isOpen = expanded.has(e.id);
          return (
            <div
              key={e.id}
              className={`bg-white rounded-2xl shadow-sm overflow-hidden border-l-4 ${
                e.resolved
                  ? 'border-emerald-300 opacity-60'
                  : e.level === 'error'
                  ? 'border-rose-400'
                  : e.level === 'warn'
                  ? 'border-amber-400'
                  : 'border-blue-300'
              }`}
            >
              <button
                onClick={() => toggle(e.id)}
                className="w-full p-3 flex items-start gap-2 text-left hover:bg-gray-50"
              >
                {isOpen ? <ChevronDown className="w-4 h-4 mt-1 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${levelBadge(e.level)}`}>
                      {e.level}
                    </span>
                    <span className="text-xs font-mono text-gray-600">{e.source}</span>
                    {e.resolved && (
                      <span className="text-xs text-emerald-600 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> 解決済
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-800 line-clamp-2">{e.message}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(e.created_at).toLocaleString('ja-JP')}
                  </div>
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-gray-100 p-3 bg-gray-50 text-xs space-y-2">
                  {e.context && (
                    <div>
                      <div className="font-semibold text-gray-600 mb-1">Context</div>
                      <pre className="bg-white p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap break-all">
                        {JSON.stringify(e.context, null, 2)}
                      </pre>
                    </div>
                  )}
                  {e.stack && (
                    <div>
                      <div className="font-semibold text-gray-600 mb-1">Stack</div>
                      <pre className="bg-white p-2 rounded text-xs overflow-x-auto whitespace-pre">
                        {e.stack}
                      </pre>
                    </div>
                  )}
                  {e.url && (
                    <div className="text-gray-500">
                      URL: <span className="font-mono break-all">{e.url}</span>
                    </div>
                  )}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => onResolve(e.id, !e.resolved)}
                      className={`text-xs px-3 py-1.5 rounded-full border ${
                        e.resolved
                          ? 'border-gray-300 text-gray-600 hover:bg-white'
                          : 'border-emerald-400 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {e.resolved ? '未解決に戻す' : '解決済にする'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
