/**
 * Approval Endpoint for Friend Mode Campaigns
 * GET: Return approval info (campaign title, organizer name, approval status)
 * POST: Process approval (update status, set recipient, activate campaign, set email)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createClient as createServerClient,
  createServiceClient,
} from '@/lib/supabase/server';
import { sendApprovalRequestEmail } from '@/lib/email';

interface ApprovalRequestBody {
  recipientEmail?: string;
  /** LIFF で取得した受取人本人の LINE userId（後から確定するため任意） */
  recipientLineUserId?: string;
  /** LINE 表示名（users レコード新規作成時に使用） */
  recipientDisplayName?: string;
  /** LINE プロフィール画像 URL */
  recipientPictureUrl?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    const supabase = await createServerClient();

    // Find approval by token
    const { data: approval, error: approvalError } = await supabase
      .from('approvals' as any)
      .select('campaign_id, status, recipient_line_user_id')
      .eq('token', token)
      .single();

    if (approvalError || !approval) {
      return NextResponse.json(
        { error: 'Invalid or expired approval token' },
        { status: 404 }
      );
    }

    // Fetch campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns' as any)
      .select('id, recipient_name, organizer_id, status, wish_item, wish_price')
      .eq('id', approval.campaign_id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Fetch organizer name
    const { data: organizer, error: organizerError } = await supabase
      .from('users' as any)
      .select('display_name')
      .eq('id', campaign.organizer_id)
      .single();

    if (organizerError || !organizer) {
      return NextResponse.json(
        { error: 'Organizer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      approval: {
        token,
        status: approval.status,
        campaign: {
          id: campaign.id,
          recipientName: campaign.recipient_name,
          wishItem: campaign.wish_item,
          wishPrice: campaign.wish_price,
          status: campaign.status,
        },
        organizer: {
          displayName: organizer.display_name,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching approval info:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch approval',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    const body: ApprovalRequestBody = await request.json();
    const recipientEmail = body.recipientEmail;
    const recipientLineUserId = body.recipientLineUserId;
    const recipientDisplayName = body.recipientDisplayName;
    const recipientPictureUrl = body.recipientPictureUrl;

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'recipientEmail is required' },
        { status: 400 }
      );
    }

    // サービスロールで動かす: 承認トークン自体が認可クレデンシャルなので
    // RLS をバイパスして anon ロールの RLS ポリシーに依存せずに書き込む。
    const supabase = createServiceClient();

    // Find approval by token
    const { data: approval, error: findError } = await supabase
      .from('approvals' as any)
      .select('campaign_id, status, recipient_line_user_id')
      .eq('token', token)
      .single();

    if (findError || !approval) {
      console.error('[approval.POST] findError:', findError);
      return NextResponse.json(
        { error: 'Invalid or expired approval token' },
        { status: 404 }
      );
    }

    // Idempotent re-submit: if already approved, just update user's egift_email and return success
    // so the user doesn't see an error when re-clicking the approve link.
    const isAlreadyApproved = approval.status === 'approved';

    if (approval.status === 'rejected') {
      return NextResponse.json(
        { error: 'This approval has been rejected' },
        { status: 400 }
      );
    }

    // Update approval status (LIFFで取得した受取人のLINE userIdをここで反映)
    if (!isAlreadyApproved) {
      const approvalUpdate: Record<string, any> = {
        status: 'approved',
        approved_at: new Date().toISOString(),
      };
      if (recipientLineUserId) {
        approvalUpdate.recipient_line_user_id = recipientLineUserId;
      }
      const { error: updateApprovalError } = await supabase
        .from('approvals' as any)
        .update(approvalUpdate)
        .eq('token', token);

      if (updateApprovalError) {
        console.error('[approval.POST] updateApprovalError:', updateApprovalError);
        throw new Error(
          `approvals update failed: ${updateApprovalError.message || JSON.stringify(updateApprovalError)}`
        );
      }
    } else if (recipientLineUserId) {
      // Already approved but we now have a LINE userId → backfill
      await supabase
        .from('approvals' as any)
        .update({ recipient_line_user_id: recipientLineUserId })
        .eq('token', token);
    }

    // Fetch campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns' as any)
      .select('id, organizer_id, recipient_name')
      .eq('id', approval.campaign_id)
      .single();

    if (campaignError || !campaign) {
      console.error('[approval.POST] campaignError:', campaignError);
      throw new Error(
        `campaign fetch failed: ${campaignError?.message || 'not found'}`
      );
    }

    // Create or update recipient user record with email
    // 優先度: POSTで渡された recipientLineUserId > approval に保存済みのもの
    const lineUserIdForLookup =
      recipientLineUserId || approval.recipient_line_user_id;

    let resolvedUserId: string | null = null;
    if (lineUserIdForLookup) {
      const { data: existingUser, error: existingUserError } = await supabase
        .from('users' as any)
        .select('id')
        .eq('line_user_id', lineUserIdForLookup)
        .maybeSingle();

      if (existingUserError) {
        console.error('[approval.POST] existingUserError:', existingUserError);
      }

      if (existingUser) {
        const { error: updateUserError } = await supabase
          .from('users' as any)
          .update({
            egift_email: recipientEmail,
            ...(recipientDisplayName ? { display_name: recipientDisplayName } : {}),
            ...(recipientPictureUrl ? { avatar_url: recipientPictureUrl } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingUser.id);
        if (updateUserError) {
          console.error('[approval.POST] updateUserError:', updateUserError);
          throw new Error(
            `users update failed: ${updateUserError.message || JSON.stringify(updateUserError)}`
          );
        }
        resolvedUserId = existingUser.id;
      } else {
        // 新規作成（受取人本人がまだ users に居ない場合）
        const fallbackEmail = `line_${lineUserIdForLookup}@line.local`;
        const { data: created, error: insertUserError } = await supabase
          .from('users' as any)
          .insert([
            {
              line_user_id: lineUserIdForLookup,
              display_name: recipientDisplayName || campaign.recipient_name,
              avatar_url: recipientPictureUrl || null,
              email: fallbackEmail,
              egift_email: recipientEmail,
              provider: 'line',
              is_creator: false,
            },
          ])
          .select('id')
          .single();
        if (insertUserError) {
          console.error('[approval.POST] insertUserError:', insertUserError);
          throw new Error(
            `users insert failed: ${insertUserError.message || JSON.stringify(insertUserError)}`
          );
        }
        resolvedUserId = created?.id || null;
      }
    }

    // Update campaign: set recipient_id and status to active
    const campaignUpdate: Record<string, any> = { status: 'active' };
    if (resolvedUserId) {
      campaignUpdate.recipient_id = resolvedUserId;
    }
    const { error: updateCampaignError } = await supabase
      .from('campaigns' as any)
      .update(campaignUpdate)
      .eq('id', approval.campaign_id);

    if (updateCampaignError) {
      console.error('[approval.POST] updateCampaignError:', updateCampaignError);
      throw new Error(
        `campaigns update failed: ${updateCampaignError.message || JSON.stringify(updateCampaignError)}`
      );
    }

    // Fetch organizer info to send confirmation email
    const { data: organizer, error: organizerError } = await supabase
      .from('users' as any)
      .select('email, display_name')
      .eq('id', campaign.organizer_id)
      .single();

    if (!organizerError && organizer) {
      await sendApprovalApprovedNotification(
        organizer.email,
        campaign.recipient_name,
        recipientEmail
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign approved and activated',
      campaignId: approval.campaign_id,
    });
  } catch (error: any) {
    console.error('Error processing approval:', error);
    // Supabase/Postgrest errors are plain objects, not Error instances.
    // Extract message from either Error or plain object with message/details.
    const message =
      error instanceof Error
        ? error.message
        : error?.message ||
          error?.details ||
          error?.hint ||
          (typeof error === 'string' ? error : JSON.stringify(error));
    return NextResponse.json(
      { error: message || 'Failed to process approval' },
      { status: 500 }
    );
  }
}

/**
 * Send notification to organizer that campaign has been approved
 */
async function sendApprovalApprovedNotification(
  to: string,
  recipientName: string,
  recipientEmail: string
): Promise<void> {
  try {
    // Using inline HTML since this is a helper function
    const html = `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f9fafb;
            color: #1f2937;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          .content {
            padding: 40px 20px;
          }
          .info-box {
            background-color: #d1fae5;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #10b981;
          }
          .info-label {
            font-size: 14px;
            color: #059669;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 8px;
          }
          .info-value {
            font-size: 18px;
            color: #065f46;
            font-weight: bold;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
            color: white;
            padding: 12px 30px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            background-color: #f3f4f6;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ お祝いページが承認されました！</h1>
          </div>
          <div class="content">
            <p>お疲れ様です！</p>
            <p>${recipientName}さんがお祝いページの承認をしました。</p>

            <div class="info-box">
              <div class="info-label">承認対象者</div>
              <div class="info-value">${recipientName}</div>
            </div>

            <div class="info-box">
              <div class="info-label">eギフト受取メールアドレス</div>
              <div class="info-value">${recipientEmail}</div>
            </div>

            <p>これでキャンペーンはアクティブになりました。友人にシェアしてお祝いを集めましょう！</p>
          </div>
          <div class="footer">
            <p>このメールはCrowdBirthdayから自動送信されています。</p>
            <p>&copy; 2026 CrowdBirthday. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send via Resend API
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'CrowdBirthday <noreply@crowdbirthday.com>',
          to,
          subject: '✅ お祝いページが承認されました！',
          html,
        }),
      });
    }
  } catch (error) {
    console.error('Error sending approval notification:', error);
  }
}
