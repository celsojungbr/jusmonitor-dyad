import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { CreditsPlan } from '../types'
import { useAuth } from './useAuth'

export function useCredits() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: plan, isLoading: loading, error } = useQuery({
    queryKey: ['credits_plan', user?.id],
    queryFn: async () => {
      if (!user) return null

      const { data, error: fetchError } = await supabase
        .from('credits_plans')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError) throw fetchError
      return data as CreditsPlan
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  useEffect(() => {
    if (!user) return

    // Subscribe para mudanças em tempo real
    const channel = supabase
      .channel('credits_plan_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'credits_plans',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new) {
            queryClient.setQueryData(['credits_plan', user.id], payload.new)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, queryClient])

  const hasCredits = (amount: number): boolean => {
    if (!plan) return false
    return plan.credits_balance >= amount
  }

  const getCreditCost = (): number => {
    if (!plan) return 1.50 // Default para prepago
    return plan.credit_cost
  }

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['credits_plan', user?.id] })
  }

  return {
    plan,
    loading,
    error: error?.message ?? null,
    balance: plan?.credits_balance ?? 0,
    creditCost: getCreditCost(),
    planType: plan?.plan_type ?? 'prepaid',
    hasCredits,
    refetch
  }
}
