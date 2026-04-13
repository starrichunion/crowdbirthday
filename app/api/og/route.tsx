// OGP Image Generation for Campaign Sharing
// Generates dynamic Open Graph images for campaigns
// Supports both Friend and Fan modes with mode-specific gradient colors

import { ImageResponse } from 'next/og';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { CampaignStats } from '@/lib/supabase/types';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('id');

    if (!campaignId) {
      return new ImageResponse(
        (
          <div
            style={{
              width: '1200px',
              height: '630px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
              fontSize: '32px',
              color: 'white',
              fontWeight: 'bold',
            }}
          >
            CrowdBirthday
          </div>
        ),
        { width: 1200, height: 630 }
      );
    }

    const supabase = await createServerClient();
    const { data: campaign } = await supabase
      .from('campaign_stats')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (!campaign) {
      return new ImageResponse(
        (
          <div
            style={{
              width: '1200px',
              height: '630px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
              fontSize: '32px',
              color: 'white',
            }}
          >
            Campaign not found
          </div>
        ),
        { width: 1200, height: 630 }
      );
    }

    const typedCampaign = campaign as unknown as CampaignStats;

    const gradientStart =
      typedCampaign.mode === 'friend' ? '#ec4899' : '#c084fc';
    const gradientEnd = typedCampaign.mode === 'friend' ? '#f43f5e' : '#9333ea';

    const progressPercent = typedCampaign.wish_price
      ? Math.min(
          (typedCampaign.total_raised / typedCampaign.wish_price) * 100,
          100
        )
      : 0;

    const formatter = new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    });

    const raisedText = formatter.format(typedCampaign.total_raised || 0);

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
            padding: '60px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: 'white',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '30px',
              fontSize: '20px',
              fontWeight: 'bold',
            }}
          >
            <span style={{ fontSize: '24px' }}>&#x2705;</span>
            <span>本人承認済み</span>
          </div>

          <div
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
              marginBottom: '30px',
              lineHeight: '1.2',
              maxWidth: '1000px',
            }}
          >
            {typedCampaign.recipient_name}へのお祝い
          </div>

          <div
            style={{
              fontSize: '24px',
              marginBottom: '40px',
              opacity: 0.95,
              maxWidth: '1000px',
            }}
          >
            {typedCampaign.wish_item || 'CrowdBirthdayでお祝いを集めよう'}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '60px',
              marginTop: 'auto',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '18px', opacity: 0.9 }}>
                集まった金額
              </span>
              <span
                style={{
                  fontSize: '44px',
                  fontWeight: 'bold',
                  letterSpacing: '-1px',
                }}
              >
                {raisedText}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '18px', opacity: 0.9 }}>応援者数</span>
              <span
                style={{
                  fontSize: '44px',
                  fontWeight: 'bold',
                  letterSpacing: '-1px',
                }}
              >
                {typedCampaign.contributor_count}人
              </span>
            </div>
          </div>

          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                backgroundColor: 'white',
                borderRadius: '4px',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '20px',
              borderTop: '2px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>
              CrowdBirthday
            </span>
            <span style={{ fontSize: '18px', opacity: 0.9 }}>
              tipping x eGift
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('OGP generation error:', error);
    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
            fontSize: '32px',
            color: 'white',
          }}
        >
          Error generating image
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }
}
