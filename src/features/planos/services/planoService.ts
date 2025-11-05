import { ApiClient } from '@/shared/services/apiClient'
import { PlanType } from '@/shared/types'

export class PlanoService {
  static async getCurrentPlan() {
    const userId = await ApiClient.getCurrentUserId()
    const { supabase } = await import('@/integrations/supabase/client')

    const { data, error } = await supabase
      .from('credits_plans')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) throw new Error(error.message)

    return data
  }

  static async getTransactionHistory() {
    const userId = await ApiClient.getCurrentUserId()
    const { supabase } = await import('@/integrations/supabase/client')

    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw new Error(error.message)

    return data
  }

  static async upgradeDegrade(newPlanType: PlanType) {
    const userId = await ApiClient.getCurrentUserId()
    const { supabase } = await import('@/integrations/supabase/client')

    // Definir custo por crédito baseado no plano
    const creditCostMap: Record<PlanType, number> = {
      'prepaid': 1.50,
      'plus': 1.00,
      'pro': 0.70
    }

    const { error } = await supabase
      .from('credits_plans')
      .update({
        plan_type: newPlanType,
        credit_cost: creditCostMap[newPlanType],
        subscription_status: newPlanType === 'prepaid' ? 'active' : 'active',
        next_billing_date: newPlanType !== 'prepaid'
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : null
      })
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  }

  static async purchaseCredits(amount: number) {
    const userId = await ApiClient.getCurrentUserId()
    const { supabase } = await import('@/integrations/supabase/client')

    // Obter plano atual para saber o custo
    const { data: plan } = await supabase
      .from('credits_plans')
      .select('credits_balance, credit_cost')
      .eq('user_id', userId)
      .single()

    if (!plan) throw new Error('Plan not found')

    const totalCost = amount * plan.credit_cost

    // Atualizar saldo
    const { error: updateError } = await supabase
      .from('credits_plans')
      .update({ credits_balance: plan.credits_balance + amount })
      .eq('user_id', userId)

    if (updateError) throw new Error(updateError.message)

    // Registrar transação
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        transaction_type: 'purchase',
        operation_type: 'Compra de Créditos',
        credits_amount: amount,
        cost_in_reais: totalCost,
        description: `Compra de ${amount} créditos por R$ ${totalCost.toFixed(2)}`
      })

    if (transactionError) throw new Error(transactionError.message)

    return { amount, totalCost }
  }

  static async cancelSubscription() {
    const userId = await ApiClient.getCurrentUserId()
    const { supabase } = await import('@/integrations/supabase/client')

    const { error } = await supabase
      .from('credits_plans')
      .update({
        subscription_status: 'canceled',
        next_billing_date: null
      })
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  }

  // Calcular economia ao mudar de plano
  static calculateSavings(currentPlanType: PlanType, newPlanType: PlanType, monthlyUsage: number) {
    const costMap: Record<PlanType, number> = {
      'prepaid': 1.50,
      'plus': 1.00,
      'pro': 0.70
    }

    const currentMonthlyCost = monthlyUsage * costMap[currentPlanType]
    const newMonthlyCost = monthlyUsage * costMap[newPlanType]

    // Adicionar taxa mensal para planos Plus e Pro
    const currentTotalCost = currentMonthlyCost + (currentPlanType === 'prepaid' ? 0 : currentPlanType === 'plus' ? 99 : 199)
    const newTotalCost = newMonthlyCost + (newPlanType === 'prepaid' ? 0 : newPlanType === 'plus' ? 99 : 199)

    return {
      currentCost: currentTotalCost,
      newCost: newTotalCost,
      savings: currentTotalCost - newTotalCost,
      savingsPercentage: ((currentTotalCost - newTotalCost) / currentTotalCost) * 100
    }
  }
}