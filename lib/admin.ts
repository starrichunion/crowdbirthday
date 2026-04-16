'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { getStripeServer } from '@/lib/stripe';

async function isAdmin(actorId: string): Promise<boolean> {
  if (!actorId) return false;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('users' as any)
    .select('is_admin')
    .eq('id', actorId)
    .maybeSingle();
  if (error || !data) return false;
  return Boolean((data as any).is_admin);
}

export async function checkIsAdmin(actorId: string): Promise<boolean> {
  return isAdmin(actorId);
}

export type AdminKpi = {
  totalUsers: number;
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  cancelledCampaigns: number;
  totalRaised: number;
  totalPlatformFee: number;
  pastDueCampaigns: number;
  refundsThisMonth: number;
  unresolvedErrors: number;
};

export async function getAdminKpi(
  actorId: string
): Promise<{ success: boolean; kpi?: AdminKpi; error?: string }> {
  try {
    if (!(await isAdmin(actorId))) return { success: false, error: 'Not authorized' };
    const sb = createServiceClient();
    const [{ count: totalUsers }, { count: totalCampaigns }, { count: activeCampaigns },
           { count: completedCampaigns }, { count: cancelledCampaigns },
           contribRes, pastDueRes, refundMonthRes, errorRes] = await Promise.all([
      sb.from('users' as any).select('id', { count: 'exact', head: true }),
      sb.from('campaigns' as any).select('id', { count: 'exact', head: true }),
      sb.from('campaigns' as any).select('id', { count: 'exact', head: true }).eq('status', 'active'),
      sb.from('campaigns' as any).select('id', { count: 'exact', head: true }).in('status', ['funded', 'egift_sent']),
      sb.from('campaigns' as any).select('id', { count: 'exact', head: true }).eq('status', 'cancelled'),
      sb.from('contributions' as any).select('amount').eq('status', 'completed'),
      sb.from('campaigns' as any)
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .lt('deadline', new Date().toISOString()),
      sb.from('contributions' as any)
        .select('id', { count: 'exact', head: true })
        .eq('status', 'refunded')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      sb.from('error_logs' as any)
        .select('id', { count: 'exact', head: true })
        .eq('resolved', false)
        .in('level', ['error', 'warn']),
    ]);
    const totalRaised = ((contribRes.data as any[]) || []).reduce(
      (sum, r) => sum + Number(r.amount || 0),
      0
    );
    return {
      success: true,
      kpi: {
        totalUsers: totalUsers || 0,
        totalCampaigns: totalCampaigns || 0,
        activeCampaigns: activeCampaigns || 0,
        completedCampaigns: completedCampaigns || 0,
        cancelledCampaigns: cancelledCampaigns || 0,
        totalRaised,
        totalPlatformFee: Math.floor(totalRaised * 0.05),
        pastDueCampaigns: pastDueRes.count || 0,
        refundsThisMonth: refundMonthRes.count || 0,
        unresolvedErrors: errorRes.count || 0,
      },
    };
  } catch (error) {
    console.error('getAdminKpi error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}

export type AdminCampaignRow = {
  id: string;
  slug: string;
  recipient_name: string;
  mode: string;
  category: string;
  status: string;
  deadline: string | null;
  wish_price: number | null;
  created_at: string;
  organizer_id: string;
  organizer_name: string;
  organizer_email: string;
  raised_amount: number;
  contributor_count: number;
  refunded_count: number;
};

export async function getAllCampaigns(
  actorId: string
): Promise<{ success: boolean; campaigns?: AdminCampaignRow[]; error?: string }> {
  try {
    if (!(await isAdmin(actorId))) return { success: false, error: 'Not authorized' };
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('admin_campaign_summary' as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { success: true, campaigns: (data as any) || [] };
  } catch (error) {
    console.error('getAllCampaigns error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}

export type AdminUserRow = {
  id: string;
  display_name: string;
  email: string;
  provider: string;
  is_admin: boolean;
  is_creator: boolean;
  created_at: string;
  campaign_count: number;
  total_raised: number;
};

export async function getAllUsers(
  actorId: string
): Promise<{ success: boolean; users?: AdminUserRow[]; error?: string }> {
  try {
    if (!(await isAdmin(actorId))) return { success: false, error: 'Not authorized' };
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('admin_user_summary' as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { success: true, users: (data as any) || [] };
  } catch (error) {
    console.error('getAllUsers error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}

export type AdminAlert = {
  id: string;
  kind: 'past_due_active' | 'refund_failed' | 'stale_pending_approval';
  campaign_id: string;
  slug: string;
  recipient_name: string;
  organizer_name: string;
  detail: string;
  created_at: string;
};

export async function getAdminAlerts(
  actorId: string
): Promise<{ success: boolean; alerts?: AdminAlert[]; error?: string }> {
  try {
    if (!(await isAdmin(actorId))) return { success: false, error: 'Not authorized' };
    const sb = createServiceClient();
    const now = new Date().toISOString();
    const alerts: AdminAlert[] = [];
    const { data: pastDue } = await sb
      .from('admin_campaign_summary' as any)
      .select('id, slug, recipient_name, organizer_name, deadline, created_at')
      .eq('status', 'active')
      .lt('deadline', now)
      .limit(50);
    for (const c of (pastDue as any[]) || []) {
      alerts.push({
        id: `past_due_${c.id}`,
        kind: 'past_due_active',
        campaign_id: c.id,
        slug: c.slug,
        recipient_name: c.recipient_name,
        organizer_name: c.organizer_name,
        detail: `締切 ${c.deadline} を過ぎていますが active のままです`,
        created_at: c.created_at,
      });
    }
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const { data: stale } = await sb
      .from('admin_campaign_summary' as any)
      .select('id, slug, recipient_name, organizer_name, created_at')
      .eq('status', 'pending_approval')
      .lt('created_at', threeDaysAgo)
      .limit(50);
    for (const c of (stale as any[]) || []) {
      alerts.push({
        id: `stale_${c.id}`,
        kind: 'stale_pending_approval',
        campaign_id: c.id,
        slug: c.slug,
        recipient_name: c.recipient_name,
        organizer_name: c.organizer_name,
        detail: '3日以上「承認待ち」のままです',
        created_at: c.created_at,
      });
    }
    alerts.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { success: true, alerts };
  } catch (error) {
    console.error('getAdminAlerts error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}

export async function adminArchiveCampaign(
  actorId: string,
  campaignId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!(await isAdmin(actorId))) return { success: false, error: 'Not authorized' };
    const sb = createServiceClient();
    const { error } = await sb
      .from('campaigns' as any)
      .update({ status: 'archived' })
      .eq('id', campaignId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('adminArchiveCampaign error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}

export async function adminForceExpire(
  actorId: string,
  campaignId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!(await isAdmin(actorId))) return { success: false, error: 'Not authorized' };
    const sb = createServiceClient();
    const { error } = await sb
      .from('campaigns' as any)
      .update({ status: 'expired' })
      .eq('id', campaignId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('adminForceExpire error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}

export async function adminForceCancelRefund(
  actorId: string,
  campaignId: string,
  reason: string
): Promise<{ success: boolean; error?: string; refundedCount?: number; failedCount?: number }> {
  try {
    if (!(await isAdmin(actorId))) return { success: false, error: 'Not authorized' };
    const sb = createServiceClient();
    const stripe = getStripeServer();
    const { data: campaign, error: fetchError } = await sb
      .from('campaigns' as any)
      .select('id, status')
      .eq('id', campaignId)
      .single();
    if (fetchError || !campaign) return { success: false, error: 'Campaign not found' };
    const { data: contributions, error: cError } = await sb
      .from('contributions' as any)
      .select('id, stripe_payment_intent_id')
      .eq('campaign_id', campaignId)
      .eq('status', 'completed');
    if (cError) throw cError;
    let refundedCount = 0;
    let failedCount = 0;
    for (const c of ((contributions as any[]) || [])) {
      try {
        if (!c.stripe_payment_intent_id) throw new Error('stripe_payment_intent_id missing');
        let piId: string | null = null;
        if (c.stripe_payment_intent_id.startsWith('cs_')) {
          const s = await stripe.checkout.sessions.retrieve(c.stripe_payment_intent_id);
          piId = typeof s.payment_intent === 'string' ? s.payment_intent : (s.payment_intent as any)?.id ?? null;
        } else if (c.stripe_payment_intent_id.startsWith('pi_')) {
          piId = c.stripe_payment_intent_id;
        }
        if (!piId) throw new Error('No payment_intent found');
        await stripe.refunds.create({ payment_intent: piId });
        await sb.from('contributions' as any).update({ status: 'refunded' }).eq('id', c.id);
        refundedCount++;
      } catch (err) {
        console.error(`[adminForceCancelRefund] refund failed for contribution ${c.id}:`, err);
        // エラーログ記録 (失敗しても続行)
        try {
          await sb.from('error_logs' as any).insert([{
            source: 'admin_force_cancel_refund',
            level: 'error',
            message: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : null,
            context: { contributionId: c.id, campaignId, reason },
            user_id: actorId,
          }]);
        } catch (e) { /* swallow */ }
        failedCount++;
      }
    }
    const { error: updateError } = await sb
      .from('campaigns' as any)
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: `[ADMIN] ${reason || '管理者による強制キャンセル'}`,
      })
      .eq('id', campaignId);
    if (updateError) throw updateError;
    return { success: true, refundedCount, failedCount };
  } catch (error) {
    console.error('adminForceCancelRefund error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}

export async function adminToggleUserAdmin(
  actorId: string,
  targetUserId: string,
  makeAdmin: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!(await isAdmin(actorId))) return { success: false, error: 'Not authorized' };
    if (actorId === targetUserId && !makeAdmin) {
      return { success: false, error: '自分自身の admin 権限は解除できません' };
    }
    const sb = createServiceClient();
    const { error } = await sb
      .from('users' as any)
      .update({ is_admin: makeAdmin })
      .eq('id', targetUserId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('adminToggleUserAdmin error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}

// ==========================================================================
// エラーログ (Sentry 代替)
// ==========================================================================
export type AdminErrorLog = {
  id: string;
  source: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack: string | null;
  context: any;
  user_id: string | null;
  url: string | null;
  user_agent: string | null;
  resolved: boolean;
  created_at: string;
};

export type AdminErrorSummaryRow = {
  source: string;
  level: string;
  count_24h: number;
  count_7d: number;
  unresolved: number;
  last_seen: string;
};

export async function getRecentErrors(
  actorId: string,
  opts?: { limit?: number; onlyUnresolved?: boolean; level?: 'error' | 'warn' | 'info' }
): Promise<{ success: boolean; errors?: AdminErrorLog[]; error?: string }> {
  try {
    if (!(await isAdmin(actorId))) return { success: false, error: 'Not authorized' };
    const sb = createServiceClient();
    const limit = Math.min(Math.max(opts?.limit ?? 100, 1), 500);
    let q = sb
      .from('error_logs' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (opts?.onlyUnresolved) q = q.eq('resolved', false);
    if (opts?.level) q = q.eq('level', opts.level);
    const { data, error } = await q;
    if (error) throw error;
    return { success: true, errors: (data as any) || [] };
  } catch (error) {
    console.error('getRecentErrors error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}

export async function getErrorSummary(
  actorId: string
): Promise<{ success: boolean; summary?: AdminErrorSummaryRow[]; error?: string }> {
  try {
    if (!(await isAdmin(actorId))) return { success: false, error: 'Not authorized' };
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('admin_error_summary' as any)
      .select('*');
    if (error) throw error;
    return { success: true, summary: (data as any) || [] };
  } catch (error) {
    console.error('getErrorSummary error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}

export async function markErrorResolved(
  actorId: string,
  errorId: string,
  resolved: boolean = true
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!(await isAdmin(actorId))) return { success: false, error: 'Not authorized' };
    const sb = createServiceClient();
    const { error } = await sb
      .from('error_logs' as any)
      .update({ resolved })
      .eq('id', errorId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('markErrorResolved error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}

export async function bulkResolveBySource(
  actorId: string,
  source: string
): Promise<{ success: boolean; error?: string; updatedCount?: number }> {
  try {
    if (!(await isAdmin(actorId))) return { success: false, error: 'Not authorized' };
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('error_logs' as any)
      .update({ resolved: true })
      .eq('source', source)
      .eq('resolved', false)
      .select('id');
    if (error) throw error;
    return { success: true, updatedCount: ((data as any[]) || []).length };
  } catch (error) {
    console.error('bulkResolveBySource error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}
