import { redirect, notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';

export default async function ShortLinkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data, error } = await (supabase as any)
    .from('campaigns')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  redirect(`/campaign/${data.id}`);
}
