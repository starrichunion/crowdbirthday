-- CrowdBirthday Seed Data
-- Realistic sample data with Japanese content
-- eGift Model: Simplified with Contributions and eGift Orders

-- Note: User IDs are generated as UUIDs. In practice, these would be created via Supabase Auth
-- For seeding, we'll use fixed UUIDs for reproducibility

-- ============================================================================
-- SEED USERS
-- ============================================================================

-- User 1: ゆきの (Yukino) - Campaign Organizer
insert into public.users (id, display_name, email, provider, avatar_url, profile_slug, is_creator, bio, egift_email)
values (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'ゆきの',
  'yukino.sample@example.com',
  'email',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=yukino',
  'yukino',
  true,
  '30歳のデザイナー。友人の誕生日や結婚式をお祝いするのが好きです。',
  'yukino.gift@example.com'
) on conflict (id) do nothing;

-- User 2: けんた (Kenta) - Campaign Recipient and Contributor
insert into public.users (id, display_name, email, provider, avatar_url, profile_slug, is_creator, bio, egift_email)
values (
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  'けんた',
  'kenta.sample@example.com',
  'email',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=kenta',
  'kenta',
  true,
  'エンジニア。新しいガジェットが大好き。',
  'kenta.gift@example.com'
) on conflict (id) do nothing;

-- User 3: あかり (Akari) - Contributor
insert into public.users (id, display_name, email, provider, avatar_url, profile_slug, is_creator, bio, egift_email)
values (
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  'あかり',
  'akari.sample@example.com',
  'email',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=akari',
  'akari',
  false,
  '学生。友人をサポートするのが好きです。',
  'akari.gift@example.com'
) on conflict (id) do nothing;

-- ============================================================================
-- SEED CAMPAIGNS
-- ============================================================================

-- Campaign 1: Birthday Party for Kenta (Friend Mode)
insert into public.campaigns (
  id, organizer_id, recipient_id, recipient_name, mode, category,
  wish_item, wish_price, description,
  status, deadline, is_public, slug
)
values (
  '660e8400-e29b-41d4-a716-446655440001'::uuid,
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  'けんた',
  'friend',
  'birthday',
  'Sony WH-1000XM5 ワイヤレスヘッドフォン',
  50000,
  'けんたが30歳になるのを記念して、みんなでお祝いしましょう！高級なワイヤレスヘッドフォンが欲しいとのこと。みんなで力を合わせて素敵なギフトを贈りましょう！',
  'active',
  '2026-05-15'::timestamptz,
  false,
  'birthday-kenta-30'
) on conflict (id) do nothing;

-- Campaign 2: Wedding Gift Registry (Fan Mode)
insert into public.campaigns (
  id, organizer_id, recipient_id, recipient_name, mode, category,
  wish_item, wish_price, description,
  status, deadline, is_public, slug
)
values (
  '660e8400-e29b-41d4-a716-446655440002'::uuid,
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  null,
  'けんた',
  'fan',
  'wedding',
  'ダイニングテーブルセット',
  120000,
  'この度の結婚式にあたり、皆様からの温かいご支援をお願いします。新居の家具や生活用品を揃えるため、eギフトでサポートいただけると幸いです。',
  'active',
  '2026-06-30'::timestamptz,
  true,
  'wedding-kenta-fan'
) on conflict (id) do nothing;

-- Campaign 3: Retirement Gift (Fan Mode)
insert into public.campaigns (
  id, organizer_id, recipient_id, recipient_name, mode, category,
  wish_item, wish_price, description,
  status, deadline, is_public, slug
)
values (
  '660e8400-e29b-41d4-a716-446655440003'::uuid,
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  null,
  'ゆきの',
  'fan',
  'retirement',
  'キャンプ用テント',
  60000,
  '定年を迎えるにあたり、これからの人生を楽しむための道具たちを揃えたいと思います。皆様からのサポートをいただき、新しい趣味に挑戦したいです。',
  'active',
  '2026-04-30'::timestamptz,
  true,
  'retirement-yukino-fan'
) on conflict (id) do nothing;

-- ============================================================================
-- SEED APPROVALS (for Friend Mode)
-- ============================================================================

-- Approval for Campaign 1 (Birthday - Friend Mode needs recipient approval)
insert into public.approvals (
  id, campaign_id, recipient_line_user_id, status, token, approved_at, created_at
)
values (
  '550e8400-e29b-41d4-a716-446655440010'::uuid,
  '660e8400-e29b-41d4-a716-446655440001'::uuid,
  'U1234567890abcdef1234567890',
  'approved',
  'approval_token_birthday_kenta_001',
  now(),
  now()
) on conflict (id) do nothing;

-- ============================================================================
-- SEED CONTRIBUTIONS (eGift Model - simpler structure)
-- ============================================================================

-- Contributions to Campaign 1 (Birthday)
insert into public.contributions (
  id, campaign_id, contributor_name, amount, message, is_anonymous, status, created_at
)
values
(
  '880e8400-e29b-41d4-a716-446655440001'::uuid,
  '660e8400-e29b-41d4-a716-446655440001'::uuid,
  'あかり',
  8000,
  'けんたへ。素敵なヘッドフォンだね。音楽をいっぱい楽しんでね！',
  false,
  'completed',
  now() - interval '3 days'
),
(
  '880e8400-e29b-41d4-a716-446655440002'::uuid,
  '660e8400-e29b-41d4-a716-446655440001'::uuid,
  '匿名',
  10000,
  'お誕生日おめでとうございます！',
  true,
  'completed',
  now() - interval '2 days'
),
(
  '880e8400-e29b-41d4-a716-446655440003'::uuid,
  '660e8400-e29b-41d4-a716-446655440001'::uuid,
  'あかり',
  25000,
  'ヘッドフォンを一緒に楽しもう！',
  false,
  'completed',
  now() - interval '1 day'
),
(
  '880e8400-e29b-41d4-a716-446655440004'::uuid,
  '660e8400-e29b-41d4-a716-446655440001'::uuid,
  '匿名',
  10000,
  'お祝いします。',
  true,
  'completed',
  now()
);

-- Contributions to Campaign 2 (Wedding)
insert into public.contributions (
  id, campaign_id, contributor_name, amount, message, is_anonymous, status, created_at
)
values
(
  '880e8400-e29b-41d4-a716-446655440005'::uuid,
  '660e8400-e29b-41d4-a716-446655440002'::uuid,
  'あかり',
  30000,
  'ご結婚おめでとうございます。素敵なテーブルで楽しい食事をしてください。',
  false,
  'completed',
  now() - interval '5 days'
),
(
  '880e8400-e29b-41d4-a716-446655440006'::uuid,
  '660e8400-e29b-41d4-a716-446655440002'::uuid,
  '匿名',
  30000,
  'おめでとう！',
  true,
  'completed',
  now() - interval '3 days'
),
(
  '880e8400-e29b-41d4-a716-446655440007'::uuid,
  '660e8400-e29b-41d4-a716-446655440002'::uuid,
  'ゆきの',
  25000,
  '新しい家での生活を楽しんでね！',
  false,
  'completed',
  now() - interval '1 day'
),
(
  '880e8400-e29b-41d4-a716-446655440008'::uuid,
  '660e8400-e29b-41d4-a716-446655440002'::uuid,
  '匿名',
  35000,
  '幸せいっぱいで。',
  true,
  'completed',
  now()
);

-- Contributions to Campaign 3 (Retirement)
insert into public.contributions (
  id, campaign_id, contributor_name, amount, message, is_anonymous, status, created_at
)
values
(
  '880e8400-e29b-41d4-a716-446655440009'::uuid,
  '660e8400-e29b-41d4-a716-446655440003'::uuid,
  'けんた',
  25000,
  '新しい趣味を楽しんでください！',
  false,
  'completed',
  now() - interval '4 days'
),
(
  '880e8400-e29b-41d4-a716-446655440010'::uuid,
  '660e8400-e29b-41d4-a716-446655440003'::uuid,
  '匿名',
  20000,
  'キャンプ楽しんでね！',
  true,
  'completed',
  now() - interval '2 days'
);

-- ============================================================================
-- SEED EGIFT ORDERS
-- ============================================================================

-- eGift order for Campaign 1 (Birthday - Amazon Gift Card)
insert into public.egift_orders (
  id, campaign_id, gift_type, amount, recipient_email, status, external_order_id, sent_at, opened_at, created_at
)
values
(
  '990e8400-e29b-41d4-a716-446655440001'::uuid,
  '660e8400-e29b-41d4-a716-446655440001'::uuid,
  'amazon_gift_card',
  53100,
  'kenta.gift@example.com',
  'sent',
  'amazon_gc_order_20260410_001',
  now() - interval '1 day',
  now() - interval '6 hours',
  now() - interval '2 days'
);

-- eGift order for Campaign 2 (Wedding - Giftee)
insert into public.egift_orders (
  id, campaign_id, gift_type, amount, recipient_email, status, external_order_id, sent_at, opened_at, created_at
)
values
(
  '990e8400-e29b-41d4-a716-446655440002'::uuid,
  '660e8400-e29b-41d4-a716-446655440002'::uuid,
  'giftee',
  126000,
  'kenta.gift@example.com',
  'sent',
  'giftee_order_20260410_001',
  now() - interval '1 day',
  null,
  now() - interval '2 days'
);

-- eGift order for Campaign 3 (Retirement - QUOCard Pay)
insert into public.egift_orders (
  id, campaign_id, gift_type, amount, recipient_email, status, external_order_id, sent_at, opened_at, created_at
)
values
(
  '990e8400-e29b-41d4-a716-446655440003'::uuid,
  '660e8400-e29b-41d4-a716-446655440003'::uuid,
  'quocard_pay',
  45000,
  'yukino.gift@example.com',
  'sent',
  'quocard_order_20260410_001',
  now() - interval '1 day',
  null,
  now() - interval '2 days'
);

-- ============================================================================
-- VERIFY SEED DATA
-- ============================================================================
-- Run these selects to verify the seed data was inserted correctly:
-- select count(*) from public.users;
-- select count(*) from public.campaigns;
-- select count(*) from public.contributions;
-- select count(*) from public.egift_orders;
-- select count(*) from public.approvals;
-- select * from public.campaign_stats;
