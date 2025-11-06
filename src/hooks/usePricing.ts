import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  PricingConfig,
  SubscriptionPlan,
  Promotion,
  CreatePricingConfigDto,
  UpdatePricingConfigDto,
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
  CreatePromotionDto,
  UpdatePromotionDto,
} from '@/types/pricing.types';
import { useToast } from '@/hooks/use-toast';

// ==================== PRICING CONFIG ====================

export const usePricingConfigs = () => {
  return useQuery({
    queryKey: ['pricing-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_config')
        .select('*')
        .order('operation_name');

      if (error) throw new Error(error.message);
      return data as PricingConfig[];
    },
  });
};

export const useCreatePricingConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (dto: CreatePricingConfigDto) => {
      const { data, error } = await supabase
        .from('pricing_config')
        .insert([dto])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as PricingConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-configs'] });
      toast({
        title: 'Sucesso',
        description: 'Configuração de preço criada com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar configuração de preço',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdatePricingConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdatePricingConfigDto }) => {
      const { data, error } = await supabase
        .from('pricing_config')
        .update(dto)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as PricingConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-configs'] });
      toast({
        title: 'Sucesso',
        description: 'Configuração de preço atualizada com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar configuração de preço',
        variant: 'destructive',
      });
    },
  });
};

export const useDeletePricingConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pricing_config')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-configs'] });
      toast({
        title: 'Sucesso',
        description: 'Configuração de preço excluída com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir configuração de preço',
        variant: 'destructive',
      });
    },
  });
};

// ==================== SUBSCRIPTION PLANS ====================

export const useSubscriptionPlans = (includeInactive = false) => {
  return useQuery({
    queryKey: ['subscription-plans', includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('subscription_plans')
        .select('*')
        .order('display_order');

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return data as SubscriptionPlan[];
    },
  });
};

export const useCreateSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (dto: CreateSubscriptionPlanDto) => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert([dto])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as SubscriptionPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({
        title: 'Sucesso',
        description: 'Plano criado com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar plano',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateSubscriptionPlanDto }) => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .update(dto)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as SubscriptionPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({
        title: 'Sucesso',
        description: 'Plano atualizado com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar plano',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('subscription_plans').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({
        title: 'Sucesso',
        description: 'Plano excluído com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir plano',
        variant: 'destructive',
      });
    },
  });
};

// ==================== PROMOTIONS ====================

export const usePromotions = (includeInactive = false) => {
  return useQuery({
    queryKey: ['promotions', includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return data as Promotion[];
    },
  });
};

export const useActivePromotions = () => {
  return useQuery({
    queryKey: ['active-promotions'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data as Promotion[];
    },
  });
};

export const useCreatePromotion = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (dto: CreatePromotionDto) => {
      const { data, error } = await supabase
        .from('promotions')
        .insert([dto])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Promotion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['active-promotions'] });
      toast({
        title: 'Sucesso',
        description: 'Promoção criada com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar promoção',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdatePromotion = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdatePromotionDto }) => {
      const { data, error } = await supabase
        .from('promotions')
        .update(dto)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Promotion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['active-promotions'] });
      toast({
        title: 'Sucesso',
        description: 'Promoção atualizada com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar promoção',
        variant: 'destructive',
      });
    },
  });
};

export const useDeletePromotion = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('promotions').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['active-promotions'] });
      toast({
        title: 'Sucesso',
        description: 'Promoção excluída com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir promoção',
        variant: 'destructive',
      });
    },
  });
};