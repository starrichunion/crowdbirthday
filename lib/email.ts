/**
 * Email Service using Resend API
 * Handles all email notifications for CrowdBirthday eGift model
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_API_URL = 'https://api.resend.com/emails';

interface EmailResponse {
  id?: string;
  error?: string;
}

/**
 * Generic send email function
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<EmailResponse> {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');
    return { error: 'Email service not configured' };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CrowdBirthday <noreply@crowdbirthday.com>',
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      return { error: 'Failed to send email' };
    }

    const data = (await response.json()) as EmailResponse;
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    return { error: 'Failed to send email' };
  }
}

// ============================================================================
// EMAIL TEMPLATE STYLES
// ============================================================================

const baseStyles = `
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
    padding: 15px;
    border-radius: 8px;
    margin: 15px 0;
    border-left: 4px solid;
  }
  .footer {
    background-color: #f3f4f6;
    padding: 20px;
    text-align: center;
    font-size: 14px;
    color: #6b7280;
    border-top: 1px solid #e5e7eb;
  }
  .button {
    display: inline-block;
    color: white;
    padding: 12px 30px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: bold;
    margin: 20px 0;
  }
`;

// ============================================================================
// APPROVAL REQUEST EMAIL
// ============================================================================

export async function sendApprovalRequestEmail(
  to: string,
  recipientName: string,
  campaignTitle: string,
  approvalLink: string
): Promise<EmailResponse> {
  const subject = 'お祝いページの承認リクエスト';

  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        ${baseStyles}
        .header {
          background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
        }
        .info-box {
          background-color: #fce7f3;
          border-color: #ec4899;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📧 お祝いページの承認をお願いします</h1>
        </div>
        <div class="content">
          <p>こんにちは、${recipientName} さん</p>
          <p>お友達があなたへのお祝いページを作成しました。</p>

          <div class="info-box">
            <p><strong>キャンペーン名：</strong><br>${campaignTitle}</p>
          </div>

          <p>下のボタンをクリックしてお祝いページを確認し、本人確認を完了してください。</p>

          <div style="text-align: center;">
            <a href="${approvalLink}" class="button" style="background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);">
              お祝いページを確認して承認する
            </a>
          </div>

          <p>このリンクは7日間有効です。有効期限切れの場合は、お友達に連絡してください。</p>
        </div>
        <div class="footer">
          <p>このメールはCrowdBirthdayから自動送信されています。</p>
          <p>&copy; 2026 CrowdBirthday. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(to, subject, html);
}

// ============================================================================
// CAMPAIGN APPROVED EMAIL (to organizer)
// ============================================================================

export async function sendApprovalApprovedNotification(
  to: string,
  recipientName: string,
  recipientEmail: string
): Promise<EmailResponse> {
  const subject = '承認されました！リンクをシェアしましょう';

  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        ${baseStyles}
        .header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        .info-box {
          background-color: #d1fae5;
          border-color: #10b981;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ お祝いページが承認されました！</h1>
        </div>
        <div class="content">
          <p>${recipientName} さんがお祝いページの承認をしました！</p>

          <div class="info-box">
            <p><strong>本人確認状態：</strong>✅ 承認済み</p>
            <p><strong>eギフト受取アドレス：</strong><br>${recipientEmail}</p>
          </div>

          <p>これでキャンペーンはアクティブになりました。友人にシェアしてお祝いを集めましょう！</p>

          <p style="margin-top: 30px; font-size: 14px; color: #666;">お祝いが集まると、自動的にeギフトが配信されます。</p>
        </div>
        <div class="footer">
          <p>このメールはCrowdBirthdayから自動送信されています。</p>
          <p>&copy; 2026 CrowdBirthday. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(to, subject, html);
}

// ============================================================================
// NEW CONTRIBUTION EMAIL (to organizer)
// ============================================================================

export async function sendNewContributionNotification(
  to: string,
  recipientName: string,
  amount: number,
  contributorName: string,
  isFunded?: boolean
): Promise<EmailResponse> {
  const subject = `新しい応援が届きました - ${contributorName}さんから¥${amount.toLocaleString('ja-JP')}`;

  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        ${baseStyles}
        .header {
          background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
        }
        .info-box {
          background-color: #fce7f3;
          border-color: #ec4899;
        }
        .amount {
          font-size: 32px;
          font-weight: bold;
          color: #ec4899;
          text-align: center;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💝 新しい応援が届きました！</h1>
        </div>
        <div class="content">
          <p>お疲れ様です！</p>
          <p>${recipientName} へのお祝いキャンペーンに新しい応援が届きました。</p>

          <div class="info-box">
            <p><strong>応援者：</strong> ${contributorName}</p>
            <p><strong>応援金額：</strong></p>
            <div class="amount">¥${amount.toLocaleString('ja-JP')}</div>
          </div>

          ${
            isFunded
              ? '<div class="info-box" style="background-color: #d1fae5; border-color: #10b981;"><p><strong>✨ 祝！目標金額に到達しました！</strong></p><p>お客様の応援により、eギフトを送付する準備ができます。</p></div>'
              : ''
          }
        </div>
        <div class="footer">
          <p>このメールはCrowdBirthdayから自動送信されています。</p>
          <p>&copy; 2026 CrowdBirthday. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(to, subject, html);
}

// ============================================================================
// CAMPAIGN FUNDED EMAIL (to organizer)
// ============================================================================

export async function sendCampaignFundedNotification(
  to: string,
  recipientName: string,
  totalRaised: number,
  goalAmount: number
): Promise<EmailResponse> {
  const subject = `目安金額に到達しました！eギフトを送りましょう`;

  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        ${baseStyles}
        .header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        .info-box {
          background-color: #d1fae5;
          border-color: #10b981;
        }
        .amount {
          font-size: 32px;
          font-weight: bold;
          color: #10b981;
          text-align: center;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 目安金額に到達しました！</h1>
        </div>
        <div class="content">
          <p>お疲れ様です！</p>
          <p>${recipientName} へのお祝いキャンペーンが目安金額に到達しました！</p>

          <div class="info-box">
            <p><strong>集まった金額：</strong></p>
            <div class="amount">¥${totalRaised.toLocaleString('ja-JP')}</div>
            <p style="text-align: center; margin: 10px 0; color: #666;">/ ¥${goalAmount.toLocaleString('ja-JP')}（目安金額）</p>
          </div>

          <p>多くの方からお祝いをいただき、ありがとうございました！</p>
          <p>これで ${recipientName} さんにeギフトを送付できます。</p>

          <p style="margin-top: 30px; font-size: 14px; color: #666;">eギフトは自動的に送付されます。配信状況はダッシュボードでご確認ください。</p>
        </div>
        <div class="footer">
          <p>このメールはCrowdBirthdayから自動送信されています。</p>
          <p>&copy; 2026 CrowdBirthday. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(to, subject, html);
}

// ============================================================================
// EGIFT SENT EMAIL (to recipient)
// ============================================================================

export async function sendEGiftNotification(
  to: string,
  recipientName: string,
  campaignTitle: string,
  giftType: string,
  amount: number,
  contributorMessages: Array<{ name: string; message: string }>
): Promise<EmailResponse> {
  const subject = `お祝いのeギフトが届きました！`;

  const messagesHtml = contributorMessages
    .slice(0, 5)
    .map(
      (msg) => `
    <div class="message">
      <p><strong>${msg.name}さんより：</strong></p>
      <p style="margin: 10px 0;">"${msg.message}"</p>
    </div>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        ${baseStyles}
        .header {
          background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
        }
        .info-box {
          background-color: #fce7f3;
          border-color: #ec4899;
          padding: 20px;
        }
        .gift-details {
          font-size: 18px;
          font-weight: bold;
          color: #ec4899;
          margin: 15px 0;
        }
        .message {
          background-color: #f9fafb;
          padding: 15px;
          border-radius: 8px;
          margin: 10px 0;
          border-left: 3px solid #ec4899;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎁 お祝いのeギフトが届きました！</h1>
        </div>
        <div class="content">
          <p>${recipientName} さん、こんにちは！</p>
          <p>「${campaignTitle}」へのお祝いとして、eギフトが届きました。</p>

          <div class="info-box">
            <p><strong>ギフト種類：</strong> ${giftType}</p>
            <p><strong>ギフト金額：</strong></p>
            <div class="gift-details">¥${amount.toLocaleString('ja-JP')}</div>
          </div>

          <p style="margin-top: 30px;">応援者からのメッセージ：</p>
          ${messagesHtml}

          <p style="margin-top: 30px;">たくさんの温かいお祝いをありがとうございました！</p>
        </div>
        <div class="footer">
          <p>このメールはCrowdBirthdayから自動送信されています。</p>
          <p>&copy; 2026 CrowdBirthday. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(to, subject, html);
}

// ============================================================================
// WELCOME EMAIL
// ============================================================================

export async function sendWelcomeEmail(
  to: string,
  displayName: string
): Promise<EmailResponse> {
  const subject = 'CrowdBirthdayへようこそ！';

  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        ${baseStyles}
        .header {
          background: linear-gradient(135deg, #ec4899 0%, #f43f5e 50%, #db2777 100%);
        }
        .feature {
          margin: 15px 0;
          padding: 15px;
          background-color: #fce7f3;
          border-radius: 8px;
          border-left: 4px solid #ec4899;
        }
        .feature-title {
          font-weight: bold;
          color: #be185d;
          margin-bottom: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 CrowdBirthdayへようこそ！</h1>
        </div>
        <div class="content">
          <p>${displayName} さん、こんにちは！</p>
          <p>CrowdBirthdayでのアカウント作成、ありがとうございます！</p>

          <div class="feature">
            <div class="feature-title">💝 Friend モード</div>
            <p>友人のお誕生日などにお祝いキャンペーンを作成。本人承認後、応援を集めます。</p>
          </div>

          <div class="feature">
            <div class="feature-title">🎯 Fan モード</div>
            <p>自分自身のためにキャンペーンを作成。ファンからのお祝いを直接受け取ります。</p>
          </div>

          <div class="feature">
            <div class="feature-title">🎁 eGift で受け取り</div>
            <p>Amazon Gift Card、Starbucks、Giftee、QUOCard Pay から選べるデジタルギフト。</p>
          </div>

          <p style="margin-top: 30px;">何かご不明な点がございましたら、チャットサポートまたは support@crowdbirthday.com にお気軽にご連絡ください。</p>
        </div>
        <div class="footer">
          <p>このメールはCrowdBirthdayから自動送信されています。</p>
          <p>&copy; 2026 CrowdBirthday. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(to, subject, html);
}
