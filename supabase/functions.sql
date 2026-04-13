-- CrowdBirthday Database Functions
-- Helper functions for common queries and operations in Tipping × eGift model

-- ============================================================================
-- 1. HANDLE_CONTRIBUTION_COMPLETION
-- Updates campaign status to 'funded' when total raised >= wish_price
-- Called after a contribution is completed
-- ============================================================================
create or replace function public.handle_contribution_completion(
  campaign_uuid uuid,
  amount_added integer
)
returns void as $$
declare
  current_total integer;
  campaign_wish_price integer;
begin
  -- Get current total from contributions and wish price from campaign
  select coalesce(sum(cont.amount), 0), c.wish_price
  into current_total, campaign_wish_price
  from public.campaigns c
  left join public.contributions cont on c.id = cont.campaign_id and cont.status = 'completed'
  where c.id = campaign_uuid
  group by c.id, c.wish_price;

  -- Update campaign status to 'funded' if goal reached
  if campaign_wish_price is not null and (current_total + amount_added) >= campaign_wish_price then
    update public.campaigns
    set status = 'funded'
    where id = campaign_uuid and status = 'active';
  end if;
end;
$$ language plpgsql;

comment on function public.handle_contribution_completion is 'Handle campaign status update when contribution is completed';

-- ============================================================================
-- 2. GET_CAMPAIGN_BY_SLUG
-- Public function to fetch campaign by slug with stats
-- ============================================================================
create or replace function public.get_campaign_by_slug(slug_param text)
returns table (
  id uuid,
  organizer_id uuid,
  recipient_id uuid,
  recipient_name text,
  mode text,
  category text,
  wish_item text,
  wish_price integer,
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
  cs.wish_price,
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

comment on function public.get_campaign_by_slug is 'Get campaign details by slug with statistics';

-- ============================================================================
-- 3. GET_DASHBOARD_DATA
-- Get all campaigns for a user with stats
-- ============================================================================
create or replace function public.get_dashboard_data(user_uuid uuid)
returns table (
  id uuid,
  organizer_id uuid,
  recipient_id uuid,
  recipient_name text,
  mode text,
  category text,
  status text,
  slug text,
  created_at timestamptz,
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
  cs.status,
  cs.slug,
  cs.created_at,
  cs.total_raised,
  cs.contributor_count
from public.campaign_stats cs
where cs.organizer_id = user_uuid
order by cs.created_at desc;
$$ language sql stable;

comment on function public.get_dashboard_data is 'Get dashboard data for a user with all their campaigns and stats';

-- ============================================================================
-- 4. GET_CAMPAIGN_CONTRIBUTIONS
-- Get all contributions to a campaign with message visibility
-- ============================================================================
create or replace function public.get_campaign_contributions(campaign_uuid uuid)
returns table (
  id uuid,
  contributor_name text,
  amount integer,
  message text,
  is_anonymous boolean,
  status text,
  created_at timestamptz
) as $$
select
  c.id,
  case when c.is_anonymous then '匿名' else c.contributor_name end,
  c.amount,
  c.message,
  c.is_anonymous,
  c.status,
  c.created_at
from public.contributions c
where c.campaign_id = campaign_uuid and c.status = 'completed'
order by c.created_at desc;
$$ language sql stable;

comment on function public.get_campaign_contributions is 'Get contributions to a campaign with proper anonymity handling';

-- ============================================================================
-- 5. CALCULATE_EGIFT_AMOUNT
-- Calculate eGift amount after platform fee (10%)
-- Returns amount minus 10% commission
-- ============================================================================
create or replace function public.calculate_egift_amount(total_amount integer)
returns integer as $$
begin
  -- Apply 10% platform fee, return net amount
  return (total_amount * 90) / 100;
end;
$$ language plpgsql immutable;

comment on function public.calculate_egift_amount is 'Calculate eGift amount after 10% platform fee deduction';

-- ============================================================================
-- 6. GET_CAMPAIGN_TOTAL_RAISED
-- Get total amount raised for a campaign (completed contributions only)
-- ============================================================================
create or replace function public.get_campaign_total_raised(campaign_uuid uuid)
returns integer as $$
declare
  total integer;
begin
  select coalesce(sum(amount), 0)
  into total
  from public.contributions
  where campaign_id = campaign_uuid and status = 'completed';

  return total;
end;
$$ language plpgsql;

comment on function public.get_campaign_total_raised is 'Get total amount raised for a campaign from completed contributions';

-- ============================================================================
-- 7. FUNCTION PERMISSION GRANTS
-- ============================================================================
grant execute on function public.handle_contribution_completion to authenticated;
grant execute on function public.get_campaign_by_slug to anon, authenticated;
grant execute on function public.get_dashboard_data to authenticated;
grant execute on function public.get_campaign_contributions to anon, authenticated;
grant execute on function public.calculate_egift_amount to authenticated;
grant execute on function public.get_campaign_total_raised to authenticated;
