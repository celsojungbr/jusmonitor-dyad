import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRealtimePricingSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('pricing-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscription_plans' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pricing_config' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pricing-configs'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'promotions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['promotions'] });
          queryClient.invalidateQueries({ queryKey: ['active-promotions'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}