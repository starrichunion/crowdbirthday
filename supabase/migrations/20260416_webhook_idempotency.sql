-- ============================================================================
-- Stripe Webhook Idempotency
--
-- 背景:
--   Stripe は webhook 配信失敗や遅延時に同じ event を再配信することがある。
--   これを防がないと、1 回の決済で複数の contribution が作成されてしまう
--   (= 集金額が水増しされる / 冪等性違反) リスクがある。
--
-- 設計:
--   webhook 受信時、最初に INSERT INTO webhook_events(id) を試行する。
--   成功したらそのまま処理を続行。unique 違反なら「既に処理済み」として
--   早期 return 200。id は Stripe の evt_xxx をそのまま使う。
--
--   processed_at は監視・デバッグ用。status は成功/失敗のトレース用で、
--   失敗時にリトライを許す設計にすると運用しやすい。
-- ============================================================================

create table if not exists public.webhook_events (
  id text primary key,
  event_type text not null,
  status text not null default 'processed' check (status in ('processed', 'failed')),
  payload jsonb,
  error_message text,
  processed_at timestamptz not null default now()
);

comment on table public.webhook_events is
  'Stripe webhook 冪等性テーブル。id = Stripe event.id (evt_xxx)。重複配信を防ぐ。';

comment on column public.webhook_events.id is
  'Stripe event ID (evt_xxx)。PRIMARY KEY なので 2 回目以降の INSERT は失敗する。';

comment on column public.webhook_events.status is
  'processed = 正常処理完了 / failed = 処理中にエラー。failed は再実行可能。';

-- RLS は service_role のみアクセスする想定なので有効にしなくてもよいが、
-- 安全側に倒して明示的に OFF を宣言する。
alter table public.webhook_events enable row level security;

-- 誰もアクセスできない。service_role は RLS をバイパスするので関係ない。
-- (ポリシー未定義 = deny all)
