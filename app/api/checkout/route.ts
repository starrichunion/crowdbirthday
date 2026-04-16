/**
 * Checkout Session Creation API
 *
 * Called by the contribute button in the campaign page.
 * Creates a Stripe Checkout Session and returns the hosted payment URL
 * for the client to redirect into.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPaymentSession } from '@/lib/stripe';

export const runtime = 'nodejs';

interface CheckoutRequestBody {
  campaignId?: string;
  amount?: number;
  contributorName?: string;
  message?: string;
  isAnonymous?: boolean;
}

export async function POST(request: NextRequest) {
  let body: CheckoutRequestBody;
  try {
    body = (await request.json()) as CheckoutRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { campaignId, amount, contributorName, message, isAnonymous } = body;

  if (!campaignId || typeof campaignId !== 'string') {
    return NextResponse.json(
      { error: 'campaignId is required' },
      { status: 400 }
    );
  }

  if (!amount || typeof amount !== 'number' || amount < 500) {
    return NextResponse.json(
      { error: 'amount must be a number >= 500' },
      { status: 400 }
    );
  }

  try {
    const session = await createPaymentSession({
      campaignId,
      amount,
      contributorName: contributorName || '匿名',
      message: message || null,
      isAnonymous: Boolean(isAnonymous),
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Stripe did not return a checkout URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('[/api/checkout] createPaymentSession failed:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create checkout session',
      },
      { status: 500 }
    );
  }
}
