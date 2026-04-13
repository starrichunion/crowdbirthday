/**
 * Cron Endpoint: Check Campaign Deadlines
 * Runs daily to check for expired campaigns
 * For eGift model: expired campaigns (past deadline, not funded) → status='expired' → notify organizer
 *
 * Trigger: Scheduled daily at midnight (configurable)
 * Method: GET (Vercel Cron) or POST (manual trigger)
 */

import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

export const maxDuration = 60; // Vercel Cron max duration

interface ProcessingResult {
  campaignId: string;
  recipientName: string;
  status: 'success' | 'failed';
  action: 'expired' | 'funded' | 'skipped';
  totalRaised?: number;
  error?: string;
}

/**
 * GET endpoint for Vercel Cron
 * Vercel sends authenticated GET requests with x-vercel-cron header
 */
export async function GET(request: Request) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const vercelCronHeader = request.headers.get('x-vercel-cron');

  if (!cronSecret || vercelCronHeader !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return handleCheckDeadlines();
}

/**
 * POST endpoint for manual trigger
 */
export async function POST(request: Request) {
  // Verify authorization header
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (!authHeader || authHeader !== expectedAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return handleCheckDeadlines();
}

/**
 * Main deadline checking logic
 */
async function handleCheckDeadlines() {
  const results: ProcessingResult[] = [];

  try {
    const supabase = await createServerClient();

    // Get campaigns that are active and past their deadline
    const { data: campaigns, error: fetchError } = await supabase
      .from('campaigns' as any)
      .select('id, organizer_id, recipient_name, deadline, wish_price, status')
      .eq('status', 'active')
      .lt('deadline', new Date().toISOString())
      .order('deadline', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    console.log(
      `[Deadline Check] Found ${campaigns?.length || 0} campaigns past deadline`
    );

    // Process each expired campaign
    for (const campaign of campaigns || []) {
      const result: ProcessingResult = {
        campaignId: campaign.id,
        recipientName: campaign.recipient_name,
        status: 'success',
        action: 'skipped',
      };

      try {
        // Get total raised amount for this campaign
        const { data: contributions, error: contribError } = await supabase
          .from('contributions' as any)
          .select('amount')
          .eq('campaign_id', campaign.id)
          .eq('status', 'completed');

        if (contribError) {
          throw contribError;
        }

        const totalRaised = (contributions || []).reduce(
          (sum, c) => sum + (c.amount || 0),
          0
        );

        result.totalRaised = totalRaised;

        // Check if campaign reached funding goal
        const isFunded =
          campaign.wish_price && totalRaised >= campaign.wish_price;

        if (isFunded) {
          // Campaign is funded - status already 'funded', no action needed
          result.action = 'funded';
          console.log(
            `[Deadline Check] Campaign ${campaign.id} is funded: ¥${totalRaised} >= ¥${campaign.wish_price}`
          );
        } else {
          // Campaign expired without reaching goal
          result.action = 'expired';

          // Update campaign status to 'expired'
          const { error: updateError } = await supabase
            .from('campaigns' as any)
            .update({ status: 'expired' })
            .eq('id', campaign.id);

          if (updateError) {
            throw updateError;
          }

          // Send notification to organizer
          await notifyOrganizerOfExpired(
            supabase,
            campaign.organizer_id,
            campaign.recipient_name,
            totalRaised,
            campaign.wish_price || 0
          );

          console.log(
            `[Deadline Check] Campaign ${campaign.id} expired: ¥${totalRaised} < ¥${campaign.wish_price || 0}`
          );
        }
      } catch (error) {
        result.status = 'failed';
        result.error = String(error);
        console.error(
          `[Deadline Check] Error processing campaign ${campaign.id}:`,
          error
        );
      }

      results.push(result);
    }

    // Log summary
    const summary = {
      totalProcessed: results.length,
      successful: results.filter((r) => r.status === 'success').length,
      failed: results.filter((r) => r.status === 'failed').length,
      funded: results.filter((r) => r.action === 'funded').length,
      expired: results.filter((r) => r.action === 'expired').length,
      skipped: results.filter((r) => r.action === 'skipped').length,
    };

    console.log('[Deadline Check] Summary:', summary);

    return NextResponse.json({
      success: true,
      summary,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Deadline Check] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        results,
      },
      { status: 500 }
    );
  }
}

/**
 * Send expiration notification to organizer
 */
async function notifyOrganizerOfExpired(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  organizerId: string,
  recipientName: string,
  totalRaised: number,
  goalAmount: number
): Promise<void> {
  try {
    // Fetch organizer email
    const { data: organizer } = await supabase
      .from('users' as any)
      .select('email, display_name')
      .eq('id', organizerId)
      .single();

    if (!organizer?.email) {
      return;
    }

    // Send email via Resend API
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 40px 20px; text-align: center; }
          .content { padding: 40px 20px; }
          .info-box { background-color: #fed7aa; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f97316; }
          .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ キャンペーンの期限が切れました</h1>
          </div>
          <div class="content">
            <p>${recipientName}さんへのお祝いキャンペーンの期限が切れました。</p>
            <div class="info-box">
              <p><strong>集まった金額：</strong> ¥${totalRaised.toLocaleString('ja-JP')}</p>
              <p><strong>目標金額：</strong> ¥${goalAmount.toLocaleString('ja-JP')}</p>
            </div>
            <p>目標金額に到達しなかったため、キャンペーンが期限切れになりました。ご理解ください。</p>
          </div>
          <div class="footer">
            <p>このメールはCrowdBirthdayから自動送信されています。</p>
            <p>&copy; 2026 CrowdBirthday. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CrowdBirthday <noreply@crowdbirthday.com>',
        to: organizer.email,
        subject: '⏰ キャンペーンの期限が切れました',
        html,
      }),
    });
  } catch (error) {
    console.error('[Deadline Check] Error sending expiration email:', error);
  }
}
