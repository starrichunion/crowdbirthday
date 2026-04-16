import type { Metadata } from 'next';
import { createServiceClient } from '@/lib/supabase/server';
import CampaignClientView from './CampaignClientView';

type CampaignMeta = {
  id: string;
  mode: 'friend' | 'fan' | string;
  recipient_name: string | null;
  wish_item: string | null;
  description: string | null;
  category: string | null;
  status: string | null;
};

async function fetchCampaignMeta(id: string): Promise<CampaignMeta | null> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('campaigns' as any)
      .select('id, mode, recipient_name, wish_item, description, category, status')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return data as any as CampaignMeta;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const campaign = await fetchCampaignMeta(params.id);

  if (!campaign) {
    return {
      title: 'キャンペーン',
      description: 'CrowdBirthday のキャンペーンページ。',
    };
  }

  const name = campaign.recipient_name ?? 'お祝い';
  const modeLabel =
    campaign.mode === 'fan'
      ? 'ファンモード'
      : campaign.mode === 'friend'
      ? 'フレンドモード'
      : '';

  const title =
    campaign.mode === 'fan'
      ? `${name} さんを応援しよう`
      : `${name} さんへお祝いを贈ろう`;

  const descRaw =
    campaign.description ||
    campaign.wish_item ||
    'みんなでお祝いを集めて、eギフトで届けよう。';
  const description =
    descRaw.length > 140 ? descRaw.slice(0, 137) + '…' : descRaw;

  const ogImageUrl = `/api/og?id=${encodeURIComponent(campaign.id)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'CrowdBirthday',
      locale: 'ja_JP',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${name} - ${modeLabel || 'CrowdBirthday'}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function CampaignPage({
  params,
}: {
  params: { id: string };
}) {
  return <CampaignClientView params={params} />;
}
