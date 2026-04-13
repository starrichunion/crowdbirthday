/**
 * eGift Service Abstraction
 * Handles purchasing and sending digital gifts
 * Supports multiple providers: Amazon, Giftee, Starbucks, QUOCard Pay
 */

import { createClient as createServerClient } from '@/lib/supabase/server';
import { sendEGiftNotification } from '@/lib/email';
import { EGiftType } from '@/lib/supabase/types';

// ============================================================================
// TYPES
// ============================================================================

export interface EGiftProvider {
  name: string;
  purchaseGift(
    amount: number,
    recipientEmail: string,
    campaignId?: string
  ): Promise<{
    orderId: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
}

export interface EGiftPurchaseResult {
  orderId: string;
  externalOrderId?: string;
  status: 'pending' | 'purchased' | 'failed';
  error?: string;
}

// ============================================================================
// PROVIDER IMPLEMENTATIONS
// ============================================================================

/**
 * Amazon Gift Card Provider
 * Placeholder implementation - logs purchase and returns mock order
 */
class AmazonGiftProvider implements EGiftProvider {
  name = 'amazon_gift_card';

  async purchaseGift(
    amount: number,
    recipientEmail: string,
    campaignId?: string
  ): Promise<{
    orderId: string;
    status: 'success' | 'failed';
    error?: string;
  }> {
    try {
      console.log('[Amazon Gift] Purchasing gift card', {
        amount,
        recipientEmail,
        campaignId,
      });

      // In production, call Amazon Gift Card API
      // For now, return mock order ID
      const orderId = `AMZN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // TODO: Integrate with Amazon Gift Card API
      // const response = await fetch('https://amazon.gift-api.com/v1/purchase', {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${process.env.AMAZON_GIFT_API_KEY}` },
      //   body: JSON.stringify({
      //     amount,
      //     recipientEmail,
      //     campaignId,
      //   }),
      // });

      return {
        orderId,
        status: 'success',
      };
    } catch (error) {
      console.error('[Amazon Gift] Error:', error);
      return {
        orderId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to purchase gift',
      };
    }
  }
}

/**
 * Giftee Provider
 * Placeholder implementation
 */
class GifteeProvider implements EGiftProvider {
  name = 'giftee';

  async purchaseGift(
    amount: number,
    recipientEmail: string,
    campaignId?: string
  ): Promise<{
    orderId: string;
    status: 'success' | 'failed';
    error?: string;
  }> {
    try {
      console.log('[Giftee] Purchasing gift', {
        amount,
        recipientEmail,
        campaignId,
      });

      const orderId = `GIFTEE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // TODO: Integrate with Giftee API
      // const response = await fetch('https://api.giftee.com/v1/purchase', {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${process.env.GIFTEE_API_KEY}` },
      //   body: JSON.stringify({
      //     amount,
      //     recipientEmail,
      //     campaignId,
      //   }),
      // });

      return {
        orderId,
        status: 'success',
      };
    } catch (error) {
      console.error('[Giftee] Error:', error);
      return {
        orderId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to purchase gift',
      };
    }
  }
}

/**
 * Starbucks Provider
 * Placeholder implementation
 */
class StarbucksProvider implements EGiftProvider {
  name = 'starbucks';

  async purchaseGift(
    amount: number,
    recipientEmail: string,
    campaignId?: string
  ): Promise<{
    orderId: string;
    status: 'success' | 'failed';
    error?: string;
  }> {
    try {
      console.log('[Starbucks] Purchasing gift card', {
        amount,
        recipientEmail,
        campaignId,
      });

      const orderId = `SBUX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // TODO: Integrate with Starbucks Gift Card API
      // const response = await fetch('https://api.starbucks.jp/v1/purchase', {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${process.env.STARBUCKS_API_KEY}` },
      //   body: JSON.stringify({
      //     amount,
      //     recipientEmail,
      //     campaignId,
      //   }),
      // });

      return {
        orderId,
        status: 'success',
      };
    } catch (error) {
      console.error('[Starbucks] Error:', error);
      return {
        orderId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to purchase gift',
      };
    }
  }
}

/**
 * QUOCard Pay Provider
 * Placeholder implementation
 */
class QUOCardPayProvider implements EGiftProvider {
  name = 'quocard_pay';

  async purchaseGift(
    amount: number,
    recipientEmail: string,
    campaignId?: string
  ): Promise<{
    orderId: string;
    status: 'success' | 'failed';
    error?: string;
  }> {
    try {
      console.log('[QUOCard Pay] Purchasing gift', {
        amount,
        recipientEmail,
        campaignId,
      });

      const orderId = `QCP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // TODO: Integrate with QUOCard Pay API
      // const response = await fetch('https://api.quocard.com/v1/purchase', {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${process.env.QUOCARD_API_KEY}` },
      //   body: JSON.stringify({
      //     amount,
      //     recipientEmail,
      //     campaignId,
      //   }),
      // });

      return {
        orderId,
        status: 'success',
      };
    } catch (error) {
      console.error('[QUOCard Pay] Error:', error);
      return {
        orderId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to purchase gift',
      };
    }
  }
}

// ============================================================================
// PROVIDER REGISTRY
// ============================================================================

const providers: Record<EGiftType, EGiftProvider> = {
  amazon_gift_card: new AmazonGiftProvider(),
  giftee: new GifteeProvider(),
  starbucks: new StarbucksProvider(),
  quocard_pay: new QUOCardPayProvider(),
};

// ============================================================================
// MAIN SERVICE FUNCTIONS
// ============================================================================

/**
 * Send eGift for a campaign
 * - Fetches campaign and contribution data
 * - Calculates amount after platform fee
 * - Calls provider to purchase gift
 * - Updates egift_orders table
 * - Sends notification email to recipient
 */
export async function sendEGift(
  campaignId: string,
  giftType: EGiftType
): Promise<{
  success: boolean;
  orderId?: string;
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns' as any)
      .select('id, recipient_id, recipient_name, wish_price')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error('Campaign not found');
    }

    // Fetch recipient email
    const { data: recipient, error: recipientError } = await supabase
      .from('users' as any)
      .select('email')
      .eq('id', campaign.recipient_id)
      .single();

    if (recipientError || !recipient || !recipient.email) {
      throw new Error('Recipient email not found');
    }

    // Calculate total raised amount after deducting platform fee
    const { data: contributions, error: contribError } = await supabase
      .from('contributions' as any)
      .select('amount')
      .eq('campaign_id', campaignId)
      .eq('status', 'completed');

    if (contribError) {
      throw contribError;
    }

    const totalRaised = (contributions || []).reduce(
      (sum, c) => sum + (c.amount || 0),
      0
    );

    // Calculate amount after 10% platform fee
    const platformFee = Math.round(totalRaised * 0.1);
    const amountForGift = totalRaised - platformFee;

    if (amountForGift <= 0) {
      throw new Error('Insufficient funds for gift');
    }

    // Get the provider
    const provider = providers[giftType];
    if (!provider) {
      throw new Error(`Unknown gift type: ${giftType}`);
    }

    // Purchase gift from provider
    const purchaseResult = await provider.purchaseGift(
      amountForGift,
      recipient.email,
      campaignId
    );

    if (purchaseResult.status === 'failed') {
      throw new Error(purchaseResult.error || 'Failed to purchase gift');
    }

    // Create egift_orders record
    const { data: order, error: orderError } = await supabase
      .from('egift_orders' as any)
      .insert([
        {
          campaign_id: campaignId,
          gift_type: giftType,
          amount: amountForGift,
          recipient_email: recipient.email,
          status: 'purchased',
          external_order_id: purchaseResult.orderId,
          sent_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    // Fetch contributor messages for notification
    const { data: contribMessages } = await supabase
      .from('contributions' as any)
      .select('contributor_name, message')
      .eq('campaign_id', campaignId)
      .eq('status', 'completed')
      .not('message', 'is', null)
      .limit(5);

    // Send notification email to recipient
    await sendEGiftNotification(
      recipient.email,
      campaign.recipient_name,
      campaign.wish_price
        ? `¥${campaign.wish_price.toLocaleString('ja-JP')}のお祝い`
        : 'お祝いギフト',
      getGiftTypeName(giftType),
      amountForGift,
      (contribMessages || []).map((m) => ({
        name: m.contributor_name || '匿名',
        message: m.message || '',
      }))
    );

    // Update campaign status to egift_sent
    await supabase
      .from('campaigns' as any)
      .update({ status: 'egift_sent' })
      .eq('id', campaignId);

    return {
      success: true,
      orderId: order.id,
    };
  } catch (error) {
    console.error('Error sending eGift:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send eGift',
    };
  }
}

/**
 * Get readable name for gift type
 */
function getGiftTypeName(giftType: EGiftType): string {
  const names: Record<EGiftType, string> = {
    amazon_gift_card: 'Amazonギフトカード',
    giftee: 'Giftee',
    starbucks: 'Starbucksギフト',
    quocard_pay: 'QUOCard Pay',
  };
  return names[giftType] || giftType;
}

/**
 * Get all available gift types
 */
export function getAvailableGiftTypes(): Array<{
  type: EGiftType;
  name: string;
}> {
  return Object.entries(providers).map(([type, provider]) => ({
    type: type as EGiftType,
    name: getGiftTypeName(type as EGiftType),
  }));
}
