/**
 * Stripe Webhook Handler for CrowdBirthday eGift Model
 * Handles:
 * - checkout.session.completed: Create contribution, check if campaign funded
 * - charge.refunded: Mark contribution as refunded
 *
 * Idempotency:
 *   Stripe may redeliver the same event on failure/delay. We INSERT the event.id
 *   into webhook_events first — a unique-violation means we already processed it,
 *   so we return 200 early without re-creating contributions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import {
  getStripeServer,
  handleWebhookEvent,
  verifyWebhookSignature,
} from '@/lib/stripe';
import {
  sendCampaignFundedNotification,
  sendNewContributionNotification,
} from '@/lib/email';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const isValid = verifyWebhookSignature(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 401 }
    );
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // ==========================================================================
  // Idempotency: try INSERT event.id into webhook_events.
  // Success -> first time, continue. Unique violation (23505) -> already processed.
  // ==========================================================================
  const supabase = await createServerClient();
  const { error: idempotencyError } = await supabase
    .from('webhook_events')
    .insert([
      {
        id: event.id,
        event_type: event.type,
        payload: event,
      },
    ]);

  if (idempotencyError) {
    if (idempotencyError.code === '23505') {
      console.log('[webhook] duplicate event', event.id, 'skipping');
      return NextResponse.json({
        success: true,
        action: 'already_processed',
        event_id: event.id,
      });
    }
    console.error('[webhook] idempotency insert failed:', idempotencyError);
    return NextResponse.json(
      { error: 'Failed to record webhook event' },
      { status: 500 }
    );
  }

  try {
    const result = (await handleWebhookEvent(event)) as any;

    if (result.action === 'contribution_created') {
      const { metadata } = result;

      const amountJPY = Math.round((metadata.amount || 0) / 100);

      const { data: contribution, error: contributionError } = await supabase
        .from('contributions')
        .insert([
          {
            campaign_id: metadata.campaignId,
            contributor_name: metadata.contributorName,
            amount: amountJPY,
            message: metadata.message || null,
            is_anonymous: metadata.isAnonymous,
            stripe_payment_intent_id: metadata.stripeSessionId,
            status: 'completed',
          },
        ])
        .select()
        .single();

      if (contributionError) {
        console.error('Error creating contribution:', contributionError);
        await markWebhookFailed(supabase, event.id, contributionError.message);
        return NextResponse.json(
          { error: 'Failed to create contribution record' },
          { status: 500 }
        );
      }

      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, organizer_id, wish_price, recipient_name')
        .eq('id', metadata.campaignId)
        .single();

      if (campaignError) {
        console.error('Error fetching campaign:', campaignError);
        return NextResponse.json(
          { error: 'Failed to fetch campaign' },
          { status: 500 }
        );
      }

      const { data: stats, error: statsError } = await supabase
        .from('contributions')
        .select('amount')
        .eq('campaign_id', metadata.campaignId)
        .eq('status', 'completed');

      if (statsError) {
        console.error('Error calculating total raised:', statsError);
        return NextResponse.json(
          { error: 'Failed to calculate campaign total' },
          { status: 500 }
        );
      }

      const totalRaised = (stats || []).reduce(
        (sum, contrib) => sum + (contrib.amount || 0),
        0
      );

      let isFunded = false;
      if (campaign.wish_price && totalRaised >= campaign.wish_price) {
        isFunded = true;
        const { error: statusError } = await supabase
          .from('campaigns')
          .update({ status: 'funded' })
          .eq('id', metadata.campaignId);
        if (statusError) {
          console.error('Error updating campaign status:', statusError);
        }
      }

      const { data: organizer, error: organizerError } = await supabase
        .from('users')
        .select('email, display_name')
        .eq('id', campaign.organizer_id)
        .single();

      if (!organizerError && organizer) {
        await sendNewContributionNotification(
          organizer.email,
          campaign.recipient_name,
          amountJPY,
          metadata.contributorName,
          isFunded
        );
        if (isFunded) {
          await sendCampaignFundedNotification(
            organizer.email,
            campaign.recipient_name,
            totalRaised,
            campaign.wish_price!
          );
        }
      }

      return NextResponse.json({
        success: true,
        action: 'contribution_created',
        isFunded,
      });
    }

    if (result.action === 'contribution_refunded') {
      const { metadata } = result;

      const { error } = await supabase
        .from('contributions')
        .update({ status: 'refunded' })
        .eq('stripe_payment_intent_id', metadata.chargeId);

      if (error) {
        console.error('Error updating contribution status:', error);
        await markWebhookFailed(supabase, event.id, error.message);
        return NextResponse.json(
          { error: 'Failed to update contribution' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        action: 'contribution_refunded',
      });
    }

    return NextResponse.json({ success: true, action: result.action });
  } catch (error) {
    console.error('Webhook processing error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to process webhook';
    await markWebhookFailed(supabase, event.id, errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Mark a webhook_events row as failed so that Stripe redelivery can retry.
 * Without this, a failed processing attempt would be treated as "processed"
 * and the retry would be rejected as a duplicate.
 */
async function markWebhookFailed(
  supabase: any,
  eventId: string,
  errorMessage: string
) {
  try {
    await supabase
      .from('webhook_events')
      .update({ status: 'failed', error_message: errorMessage })
      .eq('id', eventId);
  } catch (e) {
    console.error('[webhook] failed to mark event as failed:', e);
  }
}
