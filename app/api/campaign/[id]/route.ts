/**
 * Campaign detail endpoint used by `/campaign/[id]` page.
 * GET: return campaign info + completed contributions (for the public "みんなの応援" list)
 *
 * NOTE: contributions have an RLS policy that only exposes rows to the campaign
 * organizer. But the public campaign page is designed to show these
 * contributions to any viewer, so we use the service role client to bypass
 * RLS and manually filter to status='completed'. We intentionally strip
 * sensitive fields (stripe_*) before returning.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign id is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns' as any)
      .select(
        'id, mode, recipient_name, wish_item, wish_item_url, wish_price, sns_links, description, category, status, deadline, slug, organizer_id'
      )
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Archived キャンペーンは公開ページから非表示にする。
    if ((campaign as any).status === 'archived') {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Fetch organizer's public profile (display_name + avatar) for the page header
    const { data: organizer } = await supabase
      .from('users' as any)
      .select('display_name, avatar_url')
      .eq('id', campaign.organizer_id)
      .maybeSingle();

    // Fetch completed contributions (public-facing list)
    const { data: rawContribs, error: contribError } = await supabase
      .from('contributions' as any)
      .select(
        'id, contributor_name, amount, message, is_anonymous, created_at, status'
      )
      .eq('campaign_id', campaignId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (contribError) {
      console.error('[campaign.GET] contribError:', contribError);
    }

    const contributions = (rawContribs || []).map((c: any) => ({
      id: c.id,
      contributor_name: c.is_anonymous ? '匿名' : c.contributor_name,
      amount: c.amount,
      message: c.message,
      is_anonymous: c.is_anonymous,
      created_at: c.created_at,
    }));

    const total_raised = contributions.reduce(
      (sum: number, c: any) => sum + (c.amount || 0),
      0
    );
    const contributor_count = contributions.length;

    return NextResponse.json({
      organizer: organizer
        ? {
            display_name: organizer.display_name,
            avatar_url: organizer.avatar_url ?? null,
          }
        : null,
      campaign: {
        id: campaign.id,
        mode: campaign.mode,
        recipient_name: campaign.recipient_name,
        wish_item: campaign.wish_item,
        wish_item_url: campaign.wish_item_url ?? null,
        wish_price: campaign.wish_price,
        sns_links: Array.isArray(campaign.sns_links) ? campaign.sns_links : [],
        description: campaign.description,
        category: campaign.category,
        status: campaign.status,
        deadline: campaign.deadline,
        slug: campaign.slug,
        total_raised,
        contributor_count,
      },
      contributions,
    });
  } catch (error: any) {
    console.error('Error fetching campaign:', error);
    const message =
      error instanceof Error
        ? error.message
        : error?.message ||
          error?.details ||
          (typeof error === 'string' ? error : JSON.stringify(error));
    return NextResponse.json(
      { error: message || 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}
