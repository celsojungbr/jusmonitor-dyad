import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { CreditsPlan } from '../types'
import { useAuth } from './useAuth'

export function useCredits() {
  const { user } = useAuth()
  const [plan, setPlan] = useState<CreditsPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setPlan(null)
      setLoading(false)
      return
    }

    fetchPlan()

    // Subscribre para mudanças em tempo real
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
            setPlan(payload.new as CreditsPlan)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const fetchPlan = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('credits_plans')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError) throw fetchError

      setPlan(data)
    } catch (err: any) {
      setError(err.message)
      setPlan(null)
    } finally {
      setLoading(false)
    }
  }

  const hasCredits = (amount: number): boolean => {
    if (!plan) return false
    return plan.credits_balance >= amount
  }

  const getCreditCost = (): number => {
    if (!plan) return 1.50 // Default para prepago
    return plan.credit_cost
  }

  return {
    plan,
    loading,
    error,
    balance: plan?.credits_balance ?? 0,
    creditCost: getCreditCost(),
    planType: plan?.plan_type ?? 'prepaid',
    hasCredits,
    refetch: fetchPlan
  }
}
