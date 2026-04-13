/**
 * AI Customer Support Chat Endpoint
 * Simplified chatbot for eGift mode
 * Answers questions about: eGifts, fees, safety, approval process
 */

import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  message: string;
  conversationHistory?: ChatMessage[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();

    if (!body.message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Call Claude API with context about CrowdBirthday eGift model
    const response = await callClaudeAPI(
      body.message,
      body.conversationHistory
    );

    return NextResponse.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to process chat message',
      },
      { status: 500 }
    );
  }
}

/**
 * Call Claude API for intelligent responses
 */
async function callClaudeAPI(
  message: string,
  conversationHistory?: ChatMessage[]
): Promise<string> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return fallbackResponse(message);
    }

    const systemPrompt = `You are a helpful customer support assistant for CrowdBirthday, a tipping × eGift platform for celebrating special occasions.

About CrowdBirthday:
- Two modes: Friend (recipient approval required) and Fan (creator is recipient, no approval)
- eGift model: Instead of physical gifts, supporters send digital gift cards
- Supported eGift types: Amazon Gift Card, Starbucks, Giftee, QUOCard Pay
- Platform fee: 10% of contributions
- All campaigns require recipient email for eGift delivery
- Friend mode campaigns must be approved by the recipient before going live

Your role:
- Answer questions about how eGifts work
- Explain the approval process for Friend mode
- Clarify fees and pricing
- Provide safety and privacy information
- Be friendly, helpful, and respond primarily in Japanese

Keep responses concise and helpful. If a user has a technical issue, suggest they contact support at support@crowdbirthday.com`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          ...(conversationHistory || []),
          {
            role: 'user',
            content: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Claude API error:', error);
      return fallbackResponse(message);
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text: string }>;
    };
    return data.content[0].text || fallbackResponse(message);
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return fallbackResponse(message);
  }
}

/**
 * Fallback response when Claude API is unavailable
 */
function fallbackResponse(message: string): string {
  const messageLower = message.toLowerCase();

  if (
    messageLower.includes('egift') ||
    messageLower.includes('ギフト') ||
    messageLower.includes('gift')
  ) {
    return 'eギフトは、物理的な配送の代わりにデジタルギフトカードをお祝いの方から直接受取人に送付する方法です。Amazon Gift Card、Starbucks、Giftee、QUOCard Payからお選びいただけます。';
  }

  if (
    messageLower.includes('fee') ||
    messageLower.includes('手数料') ||
    messageLower.includes('料金')
  ) {
    return 'CrowdBirthdayは、プラットフォーム手数料として10%をお預かりしています。ご支援いただいた金額の90%がeギフト購入に充てられます。';
  }

  if (
    messageLower.includes('approval') ||
    messageLower.includes('承認') ||
    messageLower.includes('approve')
  ) {
    return 'Friend モードのキャンペーンは、本人の承認が必要です。キャンペーン作成時に本人確認用のリンクがLINEで送られ、そこでメールアドレスを登録して承認することでキャンペーンがアクティブになります。';
  }

  if (
    messageLower.includes('safe') ||
    messageLower.includes('security') ||
    messageLower.includes('安全')
  ) {
    return 'CrowdBirthdayは、Stripe決済を使用して安全な支払い処理を行っています。個人情報は厳密に保護され、本人承認済みキャンペーンのみがアクティブになります。';
  }

  if (
    messageLower.includes('hello') ||
    messageLower.includes('hi') ||
    messageLower.includes('こんにちは')
  ) {
    return 'こんにちは！CrowdBirthdayへようこそ。eギフト、手数料、承認プロセス、安全性についてのご質問があればお答えします。';
  }

  return 'ご質問ありがとうございます。eギフトについて、手数料、承認プロセス、安全性などのお問い合わせをサポートしています。具体的なご質問があればお答えします。';
}
