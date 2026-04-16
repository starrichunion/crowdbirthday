export type UserProfile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  email: string;
  provider: 'google' | 'email' | 'line' | 'x';
  is_creator: boolean;
  profile_slug: string | null;
  bio: string | null;
  line_user_id: string | null;
  egift_email: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignMode = 'friend' | 'fan';
export type CampaignStatus =
  | 'pending_approval'
  | 'active'
  | 'funded'
  | 'egift_sent'
  | 'expired';
export type CampaignCategory =
  | 'birthday'
  | 'wedding'
  | 'baby'
  | 'graduation'
  | 'retirement'
  | 'thanks';

export type SnsLink = {
  /** 表示用ラベル (省略時はホスト名から推測) */
  label?: string;
  url: string;
};

export type Campaign = {
  id: string;
  organizer_id: string;
  recipient_id: string | null;
  recipient_name: string;
  mode: CampaignMode;
  category: CampaignCategory;
  wish_item: string | null;
  wish_item_url: string | null;
  wish_price: number | null;
  sns_links: SnsLink[];
  description: string | null;
  status: CampaignStatus;
  deadline: string | null;
  is_public: boolean;
  slug: string;
  created_at: string;
  updated_at: string;
};

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type Approval = {
  id: string;
  campaign_id: string;
  recipient_line_user_id: string;
  status: ApprovalStatus;
  token: string;
  approved_at: string | null;
  created_at: string;
};

export type Contribution = {
  id: string;
  campaign_id: string;
  contributor_name: string;
  amount: number;
  message: string | null;
  is_anonymous: boolean;
  stripe_payment_intent_id: string | null;
  status: 'pending' | 'completed' | 'refunded';
  created_at: string;
};

export type EGiftType = 'amazon_gift_card' | 'starbucks' | 'giftee' | 'quocard_pay';
export type EGiftStatus = 'pending' | 'purchased' | 'sent' | 'opened' | 'failed';

export type EGiftOrder = {
  id: string;
  campaign_id: string;
  gift_type: EGiftType;
  amount: number;
  recipient_email: string;
  status: EGiftStatus;
  external_order_id: string | null;
  sent_at: string | null;
  opened_at: string | null;
  created_at: string;
};

export type CampaignStats = {
  id: string;
  organizer_id: string;
  recipient_id: string | null;
  mode: CampaignMode;
  category: CampaignCategory;
  recipient_name: string;
  wish_item: string | null;
  wish_item_url: string | null;
  wish_price: number | null;
  sns_links: SnsLink[];
  status: CampaignStatus;
  deadline: string | null;
  is_public: boolean;
  slug: string;
  created_at: string;
  updated_at: string;
  total_raised: number;
  contributor_count: number;
};

// Supabase Database Schema
export type Database = {
  public: {
    Tables: {
      users: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;
      };
      campaigns: {
        Row: Campaign;
        Insert: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Campaign, 'id' | 'created_at' | 'updated_at'>>;
      };
      approvals: {
        Row: Approval;
        Insert: Omit<Approval, 'id' | 'approved_at' | 'created_at'>;
        Update: Partial<Omit<Approval, 'id' | 'created_at'>>;
      };
      contributions: {
        Row: Contribution;
        Insert: Omit<Contribution, 'id' | 'created_at'>;
        Update: Partial<Omit<Contribution, 'id' | 'created_at'>>;
      };
      egift_orders: {
        Row: EGiftOrder;
        Insert: Omit<EGiftOrder, 'id' | 'sent_at' | 'opened_at' | 'created_at'>;
        Update: Partial<Omit<EGiftOrder, 'id' | 'created_at'>>;
      };
    };
    Views: {
      campaign_stats: {
        Row: CampaignStats;
      };
    };
    Functions: {
      handle_contribution_completion: {
        Args: { campaign_uuid: string; amount_added: number };
        Returns: void;
      };
      get_campaign_by_slug: {
        Args: { slug_param: string };
        Returns: CampaignStats[];
      };
      get_dashboard_data: {
        Args: { user_uuid: string };
        Returns: Array<
          CampaignStats & {
            total_raised: number;
            contributor_count: number;
          }
        >;
      };
      get_campaign_contributions: {
        Args: { campaign_uuid: string };
        Returns: Array<{
          id: string;
          contributor_name: string;
          amount: number;
          message: string | null;
          is_anonymous: boolean;
          status: string;
          created_at: string;
        }>;
      };
    };
    Enums: Record<string, never>;
  };
};
