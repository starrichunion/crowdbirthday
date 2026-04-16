-- ============================================================================
-- 企画者のSNSリンク (複数) と 欲しい物の商品URL を campaigns に追加
--
-- 背景:
--   - ファンモードでは「企画者 = 受取人」なので、応援者がXやInstagram等で
--     誰なのか確認できると信頼性が上がる。1つだけだと窮屈なので jsonb で複数。
--   - 「欲しい物」を商品URLで指定できるようにし、詳細ページで OGP プレビューを
--     表示する。OGPの取得は別エンドポイント (/api/og-preview) でキャッシュする。
--
-- データ形式:
--   sns_links: jsonb 配列 [{ "label": "X", "url": "https://..." }, ...]
--             label は省略可。urlは https://... 必須。
--   wish_item_url: text。Amazon/楽天/Yahoo\!ショッピング 等の商品ページ。
-- ============================================================================

alter table public.campaigns
  add column if not exists sns_links jsonb not null default '[]'::jsonb,
  add column if not exists wish_item_url text;

comment on column public.campaigns.sns_links is
  '企画者の公開SNS/サイトリンク。jsonb配列 [{label?, url}]。';
comment on column public.campaigns.wish_item_url is
  '欲しい物の商品ページURL。詳細ページでOGPプレビューを表示する。';

-- campaign_stats ビューを再作成して新カラムを露出
drop view if exists public.campaign_stats;
create or replace view public.campaign_stats as
select
  c.id,
  c.organizer_id,
  c.recipient_id,
  c.mode,
  c.category,
  c.recipient_name,
  c.wish_item,
  c.wish_item_url,
  c.wish_price,
  c.sns_links,
  c.description,
  c.status,
  c.deadline,
  c.is_public,
  c.slug,
  c.created_at,
  c.updated_at,
  coalesce(sum(cont.amount), 0)::int as total_raised,
  coalesce(count(distinct cont.id), 0)::int as contributor_count
from public.campaigns c
left join public.contributions cont
  on c.id = cont.campaign_id and cont.status = 'completed'
group by c.id;

comment on view public.campaign_stats is
  'Campaign overview with aggregated contribution statistics + sns/wish_url';

grant select on public.campaign_stats to anon, authenticated;

-- get_campaign_by_slug 関数も新カラムを返すように更新
drop function if exists public.get_campaign_by_slug(text);
create or replace function public.get_campaign_by_slug(slug_param text)
returns table (
  id uuid,
  organizer_id uuid,
  recipient_id uuid,
  recipient_name text,
  mode text,
  category text,
  wish_item text,
  wish_item_url text,
  wish_price integer,
  sns_links jsonb,
  description text,
  status text,
  deadline timestamptz,
  is_public boolean,
  slug text,
  created_at timestamptz,
  updated_at timestamptz,
  total_raised integer,
  contributor_count bigint
) as $$
select
  cs.id,
  cs.organizer_id,
  cs.recipient_id,
  cs.recipient_name,
  cs.mode,
  cs.category,
  cs.wish_item,
  cs.wish_item_url,
  cs.wish_price,
  cs.sns_links,
  cs.description,
  cs.status,
  cs.deadline,
  cs.is_public,
  cs.slug,
  cs.created_at,
  cs.updated_at,
  cs.total_raised,
  cs.contributor_count
from public.campaign_stats cs
where cs.slug = slug_param;
$$ language sql stable;

grant execute on function public.get_campaign_by_slug to anon, authenticated;
