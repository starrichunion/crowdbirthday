/**
 * Stripe Webhook Handler for CrowdBirthday eGift Model
 * Handles:
 * - checkout.session.completed: Create contribution, check if campaign funded
 * - charge.refunded: Mark contribution as refunded
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

  // Verify webhook signature
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

  try {
    const event = JSON.parse(body);
    const result = await handleWebhookEvent(event) as any;

    if (result.action === 'contribution_created') {
      const { metadata } = result;
      const supabase = await createServerClient();

      // Convert amount from cents to JPY (Stripe returns in cents)
      const amountJPY = Math.round((metadata.amount || 0) / 100);

      // Create contribution record
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
        return NextResponse.json(
          { error: 'Failed to create contribution record' },
          { status: 500 }
        );
      }

      // Fetch campaign to get organizer info and wish price
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

      // Get total raised amount for this campaign
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

      // Check if campaign is now funded (total >= wish_price)
      let isFunded = false;
      if (campaign.wish_price && totalRaised >= campaign.wish_price) {
        isFunded = true;

        // Update campaign status to 'funded'
        const { error: statusError } = await supabase
          .from('campaigns')
          .update({ status: 'funded' })
          .eq('id', metadata.campaignId);

        if (statusError) {
          console.error('Error updating campaign status:', statusError);
        }
      }

      // Fetch organizer email
      const { data: organizer, error: organizerError } = await supabase
        .from('users')
        .select('email, display_name')
        .eq('id', campaign.organizer_id)
        .single();

      if (!organizerError && organizer) {
        // Send notification to organizer about new contribution
        await sendNewContributionNotification(
          organizer.email,
          campaign.recipient_name,
          amountJPY,
          metadata.contributorName,
          isFunded
        );

        // If just funded, send additional notification
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
      const supabase = await createServerClient();

      // Update contribution status to refunded
      const { error } = await supabase
        .from('contributions')
        .update({ status: 'refunded' })
        .eq('stripe_payment_intent_id', metadata.chargeId);

      if (error) {
        console.error('Error updating contribution status:', error);
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

    // Handle other event types silently
    return NextResponse.json({
      success: true,
      action: result.action,
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to process webhook',
      },
      { status: 500 }
    );
  }
}
