-- CrowdBirthday Database Schema
-- Supabase PostgreSQL
-- Redesigned for Tipping × eGift model with Friend Mode and Fan Mode

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. USERS TABLE (extends Supabase auth.users)
-- ============================================================================
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text not null,
  avatar_url text,
  email text not null unique,
  provider text not null default 'email',
  is_creator boolean not null default false,
  profile_slug text unique,
  bio text,
  line_user_id text,
  egift_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.users is 'User profiles extending Supabase auth.users';
comment on column public.users.id is 'Foreign key to auth.users(id)';
comment on column public.users.is_creator is 'Flag indicating if user can create campaigns';
comment on column public.users.profile_slug is 'URL-friendly unique identifier for public profiles';
comment on column public.users.line_user_id is 'LINE user ID for LINE authentication and approval';
comment on column public.users.egift_email is 'Email address where eGifts are sent';

-- ============================================================================
-- 2. CAMPAIGNS TABLE
-- ============================================================================
create table public.campaigns (
  id uuid primary key default uuid_generate_v4(),
  organizer_id uuid references public.users(id) on delete cascade not null,
  recipient_id uuid references public.users(id) on delete set null,
  recipient_name text not null,
  mode text not null check (mode in ('friend', 'fan')),
  category text not null check (category in ('birthday', 'wedding', 'baby', 'graduation', 'retirement', 'thanks')),
  wish_item text,
  wish_price integer,
  description text,
  status text not null default 'pending_approval' check (status in ('pending_approval', 'active', 'funded', 'egift_sent', 'expired')),
  deadline timestamptz,
  is_public boolean not null default false,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.campaigns is 'Gift fundraising campaigns in tipping × eGift model';
comment on column public.campaigns.mode is 'friend=organizer creates for recipient, fan=creator makes their own page';
comment on column public.campaigns.category is 'birthday, wedding, baby, graduation, retirement, thanks';
comment on column public.campaigns.wish_item is 'Item recipient wishes for (optional)';
comment on column public.campaigns.wish_price is 'Price goal in JPY (optional)';
comment on column public.campaigns.status is 'pending_approval (awaiting recipient approval), active, funded, egift_sent, expired';
comment on column public.campaigns.is_public is 'true=fan mode (public), false=friend mode (invite-only by link)';
comment on column public.campaigns.slug is 'URL-friendly unique identifier for campaign link';

create index idx_campaigns_organizer_id on public.campaigns(organizer_id);
create index idx_campaigns_recipient_id on public.campaigns(recipient_id);
create index idx_campaigns_status on public.campaigns(status);
create index idx_campaigns_category on public.campaigns(category);
create index idx_campaigns_slug on public.campaigns(slug);
create index idx_campaigns_created_at on public.campaigns(created_at desc);

-- ============================================================================
-- 3. APPROVALS TABLE (new - for Friend Mode recipient approval via LINE)
-- ============================================================================
create table public.approvals (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  recipient_line_user_id text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.approvals is 'Recipient approval records for Friend Mode campaigns';
comment on column public.approvals.recipient_line_user_id is 'LINE user ID of the recipient';
comment on column public.approvals.status is 'pending, approved, or rejected';
comment on column public.approvals.token is 'Unique token for approval link (no login required)';

create index idx_approvals_campaign_id on public.approvals(campaign_id);
create index idx_approvals_token on public.approvals(token);
create index idx_approvals_status on public.approvals(status);

-- ============================================================================
-- 4. CONTRIBUTIONS TABLE (simplified)
-- ============================================================================
create table public.contributions (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  contributor_name text not null,
  amount integer not null check (amount > 0),
  message text,
  is_anonymous boolean not null default false,
  stripe_payment_intent_id text unique,
  status text not null default 'pending' check (status in ('pending', 'completed', 'refunded')),
  created_at timestamptz not null default now()
);

comment on table public.contributions is 'Contributions to campaigns in tipping model';
comment on column public.contributions.campaign_id is 'Campaign being contributed to';
comment on column public.contributions.contributor_name is 'Name of the contributor (from form, not user account)';
comment on column public.contributions.amount is 'Amount in JPY';
comment on column public.contributions.is_anonymous is 'When true, contributor name is hidden from organizer';
comment on column public.contributions.stripe_payment_intent_id is 'Stripe Payment Intent ID for payment reconciliation';
comment on column public.contributions.status is 'pending (awaiting payment), completed (paid), refunded';

create index idx_contributions_campaign_id on public.contributions(campaign_id);
create index idx_contributions_status on public.contributions(status);
create index idx_contributions_created_at on public.contributions(created_at desc);

-- ============================================================================
-- 5. EGIFT_ORDERS TABLE (replaces purchases - handles eGift distribution)
-- ============================================================================
create table public.egift_orders (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  gift_type text not null check (gift_type in ('amazon_gift_card', 'starbucks', 'giftee', 'quocard_pay')),
  amount integer not null check (amount > 0),
  recipient_email text not null,
  status text not null default 'pending' check (status in ('pending', 'purchased', 'sent', 'opened', 'failed')),
  external_order_id text,
  sent_at timestamptz,
  opened_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.egift_orders is 'eGift purchase and distribution records';
comment on column public.egift_orders.gift_type is 'Type of eGift: amazon_gift_card, starbucks, giftee, or quocard_pay';
comment on column public.egift_orders.amount is 'Gift amount in JPY';
comment on column public.egift_orders.recipient_email is 'Email address where eGift is sent';
comment on column public.egift_orders.status is 'pending, purchased, sent, opened, failed';
comment on column public.egift_orders.external_order_id is 'ID from the eGift provider API';

create index idx_egift_orders_campaign_id on public.egift_orders(campaign_id);
create index idx_egift_orders_status on public.egift_orders(status);
create index idx_egift_orders_created_at on public.egift_orders(created_at desc);

-- ============================================================================
-- 6. USERS INDEX
-- ============================================================================
create index idx_users_profile_slug on public.users(profile_slug);
create index idx_users_email on public.users(email);
create index idx_users_line_user_id on public.users(line_user_id);

-- ============================================================================
-- 7. TRIGGERS FOR UPDATED_AT
-- ============================================================================
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_users_updated_at before update on public.users
  for each row execute function public.update_updated_at_column();

create trigger update_campaigns_updated_at before update on public.campaigns
  for each row execute function public.update_updated_at_column();

-- ============================================================================
-- 8. VIEWS
-- ============================================================================
create or replace view public.campaign_stats as
select
  c.id,
  c.organizer_id,
  c.recipient_id,
  c.mode,
  c.category,
  c.recipient_name,
  c.wish_item,
  c.wish_price,
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
left join public.contributions cont on c.id = cont.campaign_id and cont.status = 'completed'
group by c.id;

comment on view public.campaign_stats is 'Campaign overview with aggregated contribution statistics';

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.campaigns enable row level security;
alter table public.approvals enable row level security;
alter table public.contributions enable row level security;
alter table public.egift_orders enable row level security;

-- Users RLS
-- Anyone can read public profiles, users can update their own
create policy "Users can read all profiles"
  on public.users for select
  using (true);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Campaigns RLS
-- Anyone can read campaigns by slug, organizer can update own
create policy "Anyone can read campaigns by slug"
  on public.campaigns for select
  using (true);

create policy "Organizers can create campaigns"
  on public.campaigns for insert
  with check (auth.uid() = organizer_id);

create policy "Organizers can update own campaigns"
  on public.campaigns for update
  using (auth.uid() = organizer_id)
  with check (auth.uid() = organizer_id);

create policy "Organizers can delete own campaigns"
  on public.campaigns for delete
  using (auth.uid() = organizer_id);

-- Approvals RLS
-- Anyone with the token can read/update their approval record
create policy "Anyone can read approval by token"
  on public.approvals for select
  using (true);

create policy "Anyone can update approval with valid token"
  on public.approvals for update
  using (status = 'pending');

create policy "Organizers can create approvals"
  on public.approvals for insert
  with check (
    campaign_id in (
      select id from public.campaigns where auth.uid() = organizer_id
    )
  );

-- Contributions RLS
-- Anyone can insert, campaign organizer can read contributions to their campaigns
create policy "Anyone can create contributions"
  on public.contributions for insert
  with check (true);

create policy "Organizers see contributions to their campaigns"
  on public.contributions for select
  using (
    campaign_id in (
      select id from public.campaigns where auth.uid() = organizer_id
    )
  );

-- eGift Orders RLS
-- Only organizer of campaign can read
create policy "Organizers see egift orders for their campaigns"
  on public.egift_orders for select
  using (
    campaign_id in (
      select id from public.campaigns where auth.uid() = organizer_id
    )
  );

create policy "Organizers can create egift orders"
  on public.egift_orders for insert
  with check (
    campaign_id in (
      select id from public.campaigns where auth.uid() = organizer_id
    )
  );

create policy "Organizers can update egift orders"
  on public.egift_orders for update
  using (
    campaign_id in (
      select id from public.campaigns where auth.uid() = organizer_id
    )
  );

-- ============================================================================
-- 10. GRANTS FOR ANON/AUTHENTICATED USERS
-- ============================================================================
grant usage on schema public to anon, authenticated;
grant select on public.users to anon, authenticated;
grant select on public.campaigns to anon, authenticated;
grant select on public.campaign_stats to anon, authenticated;
grant select, update on public.approvals to anon, authenticated;
grant insert on public.contributions to anon, authenticated;
grant all on public.users to authenticated;
grant all on public.campaigns to authenticated;
grant all on public.contributions to authenticated;
grant all on public.approvals to authenticated;
grant all on public.egift_orders to authenticated;
