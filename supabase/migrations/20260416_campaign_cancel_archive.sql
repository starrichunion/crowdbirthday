-- ============================================================================
-- Campaign lifecycle: deletion / cancellation / archive support
--
-- Background:
--   campaign.status previously only had ('pending_approval','active','funded','egift_sent','expired').
--   Add two more states to support stopping/hiding campaigns.
--
-- New states:
--   cancelled : organizer stopped the campaign partway → all contributions refunded
--   archived  : completed campaign hidden from listings (from funded/egift_sent/expired)
--
-- New columns:
--   cancelled_at  : time the campaign was cancelled
--   cancel_reason : optional free-text reason
--
-- Deletion policy (enforced in app code):
--   - 0 contributions AND status in ('pending_approval','active') → hard delete OK
--   - 1+ contributions AND status = 'active'  → cancel flow (refund all → status='cancelled')
--   - status in ('funded','egift_sent','expired') → archive only (no hard delete / cancel)
-- ============================================================================

alter table public.campaigns
  drop constraint if exists campaigns_status_check;

alter table public.campaigns
  add constraint campaigns_status_check
  check (status in (
    'pending_approval',
    'active',
    'funded',
    'egift_sent',
    'expired',
    'cancelled',
    'archived'
  ));

alter table public.campaigns
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancel_reason text;

comment on column public.campaigns.cancelled_at is
  'Campaign was cancelled at this time (only set when status = cancelled).';

comment on column public.campaigns.cancel_reason is
  'Optional free-text reason why the campaign was cancelled.';
