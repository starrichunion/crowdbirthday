import Stripe from 'stripe';
import { createClient as createServerClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  appInfo: {
    name: 'CrowdBirthday',
  },
});

export function getStripeServer() {
  return stripe;
}

// ============================================================================
// PAYMENT SESSION CREATION
// ============================================================================

export interface CreatePaymentSessionParams {
  campaignId: string;
  amount: number; // Amount in JPY
  contributorName: string;
  message: string | null;
  isAnonymous: boolean;
}

export async function createPaymentSession({
  campaignId,
  amount,
  contributorName,
  message,
  isAnonymous,
}: CreatePaymentSessionParams) {
  // Get campaign details for display
  const supabase = await createServerClient();
  const { data: campaign } = await supabase
    .from('campaigns' as any)
    .select('recipient_name, wish_item')
    .eq('id', campaignId)
    .single();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'jpy',
          product_data: {
            name: `Gift for ${campaign?.recipient_name || 'Someone'}`,
            description: message || 'eGift contribution',
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/campaigns/${campaignId}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/campaigns/${campaignId}`,
    metadata: {
      campaignId,
      contributorName,
      message: message || '',
      isAnonymous: isAnonymous.toString(),
    },
  });

  return session;
}

// ============================================================================
// PAYMENT COMPLETION HANDLING
// ============================================================================

export async function handlePaymentComplete(sessionId: string): Promise<{
  success: boolean;
  contributionId?: string;
  error?: string;
}> {
  try {
    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid' || !session.metadata) {
      return {
        success: false,
        error: 'Payment not completed',
      };
    }

    const supabase = await createServerClient();

    // Create contribution record
    const { data: contribution, error: contributionError } = await supabase
      .from('contributions' as any)
      .insert([
        {
          campaign_id: session.metadata.campaignId,
          contributor_name: session.metadata.contributorName,
          amount: (session.amount_total || 0) / 100, // Convert from cents to JPY
          message: session.metadata.message || null,
          is_anonymous: session.metadata.isAnonymous === 'true',
          stripe_payment_intent_id: session.payment_intent as string,
          status: 'completed',
        },
      ])
      .select()
      .single();

    if (contributionError) throw contributionError;

    // Handle campaign funding check
    const { data: campaign } = await supabase
      .from('campaigns' as any)
      .select('wish_price, status')
      .eq('id', session.metadata.campaignId)
      .single();

    if (campaign && campaign.status === 'active' && campaign.wish_price) {
      // Check total raised via campaign_stats view
      const { data: stats } = await supabase
        .from('campaign_stats' as any)
        .select('total_raised')
        .eq('id', session.metadata.campaignId)
        .single();

      const totalRaised = (stats?.total_raised || 0) + (session.amount_total || 0);

      // If total raised meets target, update status to funded
      if (totalRaised >= campaign.wish_price) {
        await supabase
          .from('campaigns' as any)
          .update({ status: 'funded' })
          .eq('id', session.metadata.campaignId);
      }
    }

    return {
      success: true,
      contributionId: contribution.id,
    };
  } catch (error) {
    console.error('Error handling payment completion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process payment',
    };
  }
}

// ============================================================================
// WEBHOOK HANDLING
// ============================================================================

export interface WebhookEvent {
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

export async function handleWebhookEvent(event: WebhookEvent) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as unknown as Stripe.Checkout.Session;

      if (session.payment_status === 'paid' && session.metadata) {
        return {
          success: true,
          action: 'contribution_created',
          metadata: {
            campaignId: session.metadata.campaignId,
            amount: session.amount_total,
            currency: session.currency,
            message: session.metadata.message || null,
            contributorName: session.metadata.contributorName,
            isAnonymous: session.metadata.isAnonymous === 'true',
            stripeSessionId: session.id,
          },
        };
      }
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as unknown as Stripe.Charge;
      return {
        success: true,
        action: 'contribution_refunded',
        metadata: {
          chargeId: charge.id,
          refundAmount: charge.amount_refunded,
        },
      };
    }

    default:
      return {
        success: true,
        action: 'event_ignored',
      };
  }
}

// ============================================================================
// FEE CALCULATION
// ============================================================================

export function calculatePlatformFee(amount: number): number {
  return Math.round(amount * 0.1); // 10% platform fee
}

export function calculateProductCost(amount: number): number {
  return amount - calculatePlatformFee(amount);
}

// ============================================================================
// WEBHOOK SIGNATURE VERIFICATION
// ============================================================================

export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  try {
    stripe.webhooks.constructEvent(body, signature, secret);
    return true;
  } catch {
    return false;
  }
}
