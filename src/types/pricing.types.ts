export interface PricingConfig {
  id: string;
  operation_name: string;
  credits_cost: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  plan_name: string;
  plan_type: 'prepaid' | 'plus' | 'pro';
  credit_price: number;
  monthly_price: number | null;
  included_credits: number;
  can_recharge: boolean;
  description: string | null;
  features: string[] | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Promotion {
  id: string;
  promotion_name: string;
  promotion_type: 'discount_percentage' | 'discount_fixed' | 'bonus_credits' | 'free_trial';
  description: string | null;
  discount_percentage: number | null;
  discount_fixed: number | null;
  bonus_credits: number | null;
  applicable_to: string[] | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  max_uses: number | null;
  current_uses: number;
  coupon_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePricingConfigDto {
  operation_name: string;
  credits_cost: number;
  description?: string;
  is_active?: boolean;
}

export interface UpdatePricingConfigDto {
  operation_name?: string;
  credits_cost?: number;
  description?: string;
  is_active?: boolean;
}

export interface CreateSubscriptionPlanDto {
  plan_name: string;
  plan_type: 'prepaid' | 'plus' | 'pro';
  credit_price: number;
  monthly_price?: number | null;
  included_credits?: number;
  can_recharge?: boolean;
  description?: string;
  features?: string[];
  is_active?: boolean;
  display_order?: number;
}

export interface UpdateSubscriptionPlanDto {
  plan_name?: string;
  plan_type?: 'prepaid' | 'plus' | 'pro';
  credit_price?: number;
  monthly_price?: number | null;
  included_credits?: number;
  can_recharge?: boolean;
  description?: string;
  features?: string[];
  is_active?: boolean;
  display_order?: number;
}

export interface CreatePromotionDto {
  promotion_name: string;
  promotion_type: 'discount_percentage' | 'discount_fixed' | 'bonus_credits' | 'free_trial';
  description?: string;
  discount_percentage?: number;
  discount_fixed?: number;
  bonus_credits?: number;
  applicable_to?: string[];
  start_date: string;
  end_date: string;
  is_active?: boolean;
  max_uses?: number;
  coupon_code?: string;
}

export interface UpdatePromotionDto {
  promotion_name?: string;
  promotion_type?: 'discount_percentage' | 'discount_fixed' | 'bonus_credits' | 'free_trial';
  description?: string;
  discount_percentage?: number;
  discount_fixed?: number;
  bonus_credits?: number;
  applicable_to?: string[];
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  max_uses?: number;
  current_uses?: number;
  coupon_code?: string;
}
