/**
 * POST /api/checkout/complete
 *
 * Stripe Checkout 成功後にクライアントから呼ばれ、
 * session_id を使って Stripe から支払い情報を取得し、
 * contributions テーブルにレコードを作成する。
 *
 * Webhook が届かない場合のフォールバックとしても機能する。
 * 既に contribution が存在する場合は重複作成しない。
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    const stripe = getStripeServer();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid' || !session.metadata) {
      return NextResponse.json(
        { error: 'Payment not completed or missing metadata' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const meta = session.metadata;
    const amountJPY = session.amount_total || 0;

    // Check for duplicate: if contribution with this session already exists, skip
    const { data: existing } = await supabase
      .from('contributions' as any)
      .select('id')
      .eq('stripe_payment_intent_id', session.payment_intent as string)
      .maybeSingle();

    if (existing) {
      // Already processed (by webhook or previous call)
      return NextResponse.json({ success: true, alreadyProcessed: true });
    }

    // Create contribution record
    const { data: contribution, error: contribError } = await supabase
      .from('contributions' as any)
      .insert([
        {
          campaign_id: meta.campaignId,
          contributor_name: meta.contributorName,
          amount: amountJPY,
          message: meta.message || null,
          is_anonymous: meta.isAnonymous === 'true',
          stripe_payment_intent_id: session.payment_intent as string,
          status: 'completed',
        },
      ])
      .select()
      .single();

    if (contribError) {
      console.error('[checkout/complete] contribution insert error:', contribError);
      return NextResponse.json(
        { error: 'Failed to create contribution' },
        { status: 500 }
      );
    }

    // Check if campaign is now funded
    const { data: campaign } = await supabase
      .from('campaigns' as any)
      .select('id, organizer_id, wish_price, recipient_name, status')
      .eq('id', meta.campaignId)
      .single();

    if (campaign && campaign.wish_price) {
      const { data: stats } = await supabase
        .from('contributions' as any)
        .select('amount')
        .eq('campaign_id', meta.campaignId)
        .eq('status', 'completed');

      const totalRaised = (stats || []).reduce(
        (sum: number, c: any) => sum + (c.amount || 0),
        0
      );

      if (totalRaised >= campaign.wish_price && campaign.status === 'active') {
        await supabase
          .from('campaigns' as any)
          .update({ status: 'funded' })
          .eq('id', meta.campaignId);
      }
    }

    return NextResponse.json({
      success: true,
      contributionId: contribution.id,
      amount: amountJPY,
    });
  } catch (error: any) {
    console.error('[checkout/complete] error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process payment completion' },
      { status: 500 }
    );
  }
}
