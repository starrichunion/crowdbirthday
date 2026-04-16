'use server';

import { createClient as createServerClient } from '@/lib/supabase/server';
import {
  Campaign,
  CampaignCategory,
  CampaignStatus,
  CampaignMode,
  Approval,
  Contribution,
  EGiftOrder,
  EGiftType,
  CampaignStats,
} from '@/lib/supabase/types';
import { createPaymentSession, handlePaymentComplete } from '@/lib/stripe';
import { redirect } from 'next/navigation';

// ============================================================================
// USER (LINE PROFILE)
// ============================================================================

/**
 * LINEプロファイルから users レコードを upsert し、Supabase の user UUID を返す。
 *
 * 設計意図:
 *   - LIFF だけでログインしているユーザーは Supabase Auth に存在しないため、
 *     `users` テーブルに line_user_id をキーとして直接レコードを作成・更新する。
 *   - キャンペーン作成時に必須の `organizer_id` を払い出すために使う。
 *
 * email が無い場合は line_user_id をベースに合成のダミーアドレスを生成
 * （unique 制約を満たすため）。後で本人がメール登録すれば上書きされる想定。
 */
export async function upsertUserFromLineProfile(profile: {
  lineUserId: string;
  displayName: string;
  pictureUrl?: string | null;
  email?: string | null;
}): Promise<{ userId: string; success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    // 既存ユーザーを line_user_id で検索
    const { data: existing, error: findError } = await supabase
      .from('users' as any)
      .select('id, display_name, avatar_url')
      .eq('line_user_id', profile.lineUserId)
      .maybeSingle();

    if (findError) throw findError;

    if (existing) {
      // 表示名/アバターを更新
      const { error: updateError } = await supabase
        .from('users' as any)
        .update({
          display_name: profile.displayName,
          avatar_url: profile.pictureUrl ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;

      return { userId: existing.id, success: true };
    }

    // 新規作成。email が無ければ line_user_id ベースのダミーを使う
    const email =
      profile.email && profile.email.length > 0
        ? profile.email
        : `line_${profile.lineUserId}@line.local`;

    const { data: created, error: insertError } = await supabase
      .from('users' as any)
      .insert([
        {
          line_user_id: profile.lineUserId,
          display_name: profile.displayName,
          avatar_url: profile.pictureUrl ?? null,
          email,
          provider: 'line',
          is_creator: true,
        },
      ])
      .select('id')
      .single();

    if (insertError) throw insertError;

    return { userId: created.id, success: true };
  } catch (error) {
    console.error('Error upserting user from LINE profile:', error);
    return {
      userId: '',
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to upsert user from LINE profile',
    };
  }
}

// ============================================================================
// CAMPAIGN CREATION
// ============================================================================

export async function createFriendCampaign(formData: {
  organizerId: string;
  /**
   * 受取人の LINE userId。新フローでは作成時点では未確定なので任意。
   * `/approve/[token]` で本人が LINE 認証した時に approvals レコードに反映される。
   */
  recipientLineUserId?: string;
  recipientName: string;
  category: CampaignCategory;
  wishItem?: string;
  wishItemUrl?: string;
  wishPrice?: number;
  snsLinks?: Array<{ label?: string; url: string }>;
  description: string;
  deadline?: string;
}): Promise<{ id: string; approvalToken: string; success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    // Generate slug
    const slug = generateSlug();

    // Create campaign in pending_approval status
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert([
        {
          organizer_id: formData.organizerId,
          recipient_name: formData.recipientName,
          mode: 'friend' as CampaignMode,
          category: formData.category,
          wish_item: formData.wishItem || null,
          wish_item_url: formData.wishItemUrl || null,
          wish_price: formData.wishPrice || null,
          sns_links: formData.snsLinks || [],
          description: formData.description,
          status: 'pending_approval' as CampaignStatus,
          deadline: formData.deadline || null,
          is_public: false,
          slug,
        },
      ])
      .select()
      .single();

    if (campaignError) throw campaignError;

    // Create approval record with token
    // recipient_line_user_id は NOT NULL なので、未確定時は空文字でプレースホルダ。
    // 本人が /approve/[token] で LINE 認証した時に上書きする。
    const { data: approval, error: approvalError } = await supabase
      .from('approvals')
      .insert([
        {
          campaign_id: campaign.id,
          recipient_line_user_id: formData.recipientLineUserId || '',
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (approvalError) throw approvalError;

    return {
      id: campaign.id,
      approvalToken: approval.token,
      success: true,
    };
  } catch (error) {
    console.error('Error creating friend campaign:', error);
    return {
      id: '',
      approvalToken: '',
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create campaign',
    };
  }
}

export async function createFanCampaign(formData: {
  organizerId: string;
  category: CampaignCategory;
  wishItem?: string;
  wishItemUrl?: string;
  wishPrice?: number;
  snsLinks?: Array<{ label?: string; url: string }>;
  description: string;
  deadline?: string;
}): Promise<{ id: string; slug: string; success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    // Get organizer's display name
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', formData.organizerId)
      .single();

    if (userError) throw userError;

    // Generate slug
    const slug = generateSlug();

    // Create campaign in active status (creator is both organizer and recipient)
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert([
        {
          organizer_id: formData.organizerId,
          recipient_id: formData.organizerId,
          recipient_name: user.display_name,
          mode: 'fan' as CampaignMode,
          category: formData.category,
          wish_item: formData.wishItem || null,
          wish_item_url: formData.wishItemUrl || null,
          wish_price: formData.wishPrice || null,
          sns_links: formData.snsLinks || [],
          description: formData.description,
          status: 'active' as CampaignStatus,
          deadline: formData.deadline || null,
          is_public: true,
          slug,
        },
      ])
      .select()
      .single();

    if (campaignError) throw campaignError;

    return {
      id: campaign.id,
      slug: campaign.slug,
      success: true,
    };
  } catch (error) {
    console.error('Error creating fan campaign:', error);
    return {
      id: '',
      slug: '',
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create campaign',
    };
  }
}

// ============================================================================
// APPROVAL HANDLING
// ============================================================================

export async function approveRecipient(token: string): Promise<{
  campaignId?: string;
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    // Find approval by token
    const { data: approval, error: findError } = await supabase
      .from('approvals')
      .select('campaign_id, status')
      .eq('token', token)
      .single();

    if (findError || !approval) throw new Error('Invalid or expired approval token');

    if (approval.status !== 'pending') {
      return {
        success: false,
        error: 'This approval has already been processed',
      };
    }

    // Update approval status
    const { error: updateApprovalError } = await supabase
      .from('approvals')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('token', token);

    if (updateApprovalError) throw updateApprovalError;

    // Update campaign status to active
    const { error: updateCampaignError } = await supabase
      .from('campaigns')
      .update({ status: 'active' as CampaignStatus })
      .eq('id', approval.campaign_id);

    if (updateCampaignError) throw updateCampaignError;

    return {
      campaignId: approval.campaign_id,
      success: true,
    };
  } catch (error) {
    console.error('Error approving recipient:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to approve campaign',
    };
  }
}

// ============================================================================
// CONTRIBUTIONS
// ============================================================================

export async function createContribution(formData: {
  campaignId: string;
  amount: number;
  contributorName: string;
  message?: string;
  isAnonymous: boolean;
}): Promise<{ checkoutUrl?: string; error?: string }> {
  try {
    // Create payment session
    const session = await createPaymentSession({
      campaignId: formData.campaignId,
      amount: formData.amount,
      contributorName: formData.contributorName,
      message: formData.message || null,
      isAnonymous: formData.isAnonymous,
    });

    return {
      checkoutUrl: session.url || undefined,
    };
  } catch (error) {
    console.error('Error creating contribution:', error);
    return {
      error:
        error instanceof Error ? error.message : 'Failed to create contribution',
    };
  }
}

export async function getCampaignContributions(
  campaignId: string
): Promise<{
  contributions: Array<{
    id: string;
    contributor_name: string;
    amount: number;
    message: string | null;
    is_anonymous: boolean;
    created_at: string;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .rpc('get_campaign_contributions', {
        campaign_uuid: campaignId,
      });

    if (error) throw error;

    return {
      contributions: data || [],
    };
  } catch (error) {
    console.error('Error fetching contributions:', error);
    return {
      contributions: [],
      error:
        error instanceof Error ? error.message : 'Failed to fetch contributions',
    };
  }
}

// ============================================================================
// CAMPAIGN RETRIEVAL
// ============================================================================

export async function getCampaignBySlug(slug: string): Promise<{
  campaign: CampaignStats | null;
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .rpc('get_campaign_by_slug', {
        slug_param: slug,
      });

    if (error) throw error;

    const campaign = data && data.length > 0 ? data[0] : null;

    return {
      campaign,
    };
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return {
      campaign: null,
      error: error instanceof Error ? error.message : 'Failed to fetch campaign',
    };
  }
}

export async function getDashboardData(userId: string): Promise<{
  campaigns: Array<
    CampaignStats & {
      total_raised: number;
      contributor_count: number;
    }
  >;
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .rpc('get_dashboard_data', {
        user_uuid: userId,
      });

    if (error) throw error;

    return {
      campaigns: data || [],
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      campaigns: [],
      error:
        error instanceof Error ? error.message : 'Failed to fetch dashboard',
    };
  }
}

// ============================================================================
// EGIFT HANDLING
// ============================================================================

export async function sendEGift(formData: {
  campaignId: string;
  giftType: EGiftType;
  amount: number;
  recipientEmail: string;
}): Promise<{
  orderId?: string;
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    // Create egift_order record
    const { data: order, error: orderError } = await supabase
      .from('egift_orders')
      .insert([
        {
          campaign_id: formData.campaignId,
          gift_type: formData.giftType,
          amount: formData.amount,
          recipient_email: formData.recipientEmail,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    // TODO: Call actual eGift provider API
    // For now, just return the order ID
    // In production, this would call the eGift provider's API
    // based on gift_type and return external_order_id

    return {
      orderId: order.id,
      success: true,
    };
  } catch (error) {
    console.error('Error sending egift:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send eGift',
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateSlug(): string {
  // Generate a short, unique slug for campaign URLs
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 8; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

export async function updateCampaignStatus(
  campaignId: string,
  status: CampaignStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('campaigns')
      .update({ status })
      .eq('id', campaignId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error updating campaign status:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update campaign',
    };
  }
}

export async function getUserCampaigns(userId: string): Promise<{
  campaigns: Campaign[];
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('campaigns')
      .select()
      .eq('organizer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      campaigns: data || [],
    };
  } catch (error) {
    console.error('Error fetching user campaigns:', error);
    return {
      campaigns: [],
      error: error instanceof Error ? error.message : 'Failed to fetch campaigns',
    };
  }
}
