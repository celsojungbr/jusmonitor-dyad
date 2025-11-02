import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { monitoringType, value, frequency, userId, processId } = await req.json()

    if (!monitoringType || !value || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Custo: 10 créditos por monitoramento/mês
    const creditCost = 10

    // Verificar saldo
    const { data: plan } = await supabaseClient
      .from('credits_plans')
      .select('credits_balance')
      .eq('user_id', userId)
      .single()

    if (!plan || plan.credits_balance < creditCost) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient credits',
          required: creditCost,
          available: plan?.credits_balance || 0
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calcular next_check baseado na frequência
    const now = new Date()
    const nextCheck = new Date(now)
    if (frequency === 'daily') {
      nextCheck.setDate(nextCheck.getDate() + 1)
    } else if (frequency === 'weekly') {
      nextCheck.setDate(nextCheck.getDate() + 7)
    }

    // Obter configuração da API JUDiT (preferencial para callbacks)
    const { data: apiConfig } = await supabaseClient
      .from('api_configurations')
      .select('*')
      .eq('api_name', 'judit')
      .eq('is_active', true)
      .single()

    let trackingId: string | null = null
    let callbackUrl: string | null = null
    let apiProvider: string | null = null

    // Registrar callback na API (se disponível)
    if (apiConfig) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        callbackUrl = `${supabaseUrl}/functions/v1/judit-callback`

        console.log(`[create-monitoring] Registrando callback JUDiT: ${callbackUrl}`)

        // Registrar tracking na JUDiT
        const response = await fetch(`${apiConfig.endpoint_url}/tracking/tracking`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiConfig.api_key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            document: monitoringType === 'cnj' ? null : value,
            cnj_number: monitoringType === 'cnj' ? value : null,
            document_type: monitoringType === 'cpf' ? 'CPF' : monitoringType === 'cnpj' ? 'CNPJ' : null,
            oab_number: monitoringType === 'oab' ? value : null,
            callback_url: callbackUrl
          })
        })

        if (response.ok) {
          const data = await response.json()
          trackingId = data.tracking_id || data.id
          apiProvider = 'judit'
          console.log(`[create-monitoring] Callback registrado. Tracking ID: ${trackingId}`)
        } else {
          console.error(`[create-monitoring] Erro ao registrar callback: ${response.status}`)
        }
      } catch (error) {
        console.error('[create-monitoring] Erro ao registrar callback:', error)
      }
    }

    // Criar monitoramento
    const { data: monitoring, error: monitoringError } = await supabaseClient
      .from('monitorings')
      .insert({
        user_id: userId,
        monitoring_type: monitoringType,
        monitoring_value: value,
        process_id: processId || null,
        frequency: frequency || 'daily',
        status: 'active',
        last_check: now.toISOString(),
        next_check: nextCheck.toISOString(),
        alerts_count: 0,
        tracking_id: trackingId,
        callback_url: callbackUrl,
        api_provider: apiProvider
      })
      .select()
      .single()

    if (monitoringError) {
      throw monitoringError
    }

    // Deduzir créditos
    await supabaseClient
      .from('credits_plans')
      .update({ credits_balance: plan.credits_balance - creditCost })
      .eq('user_id', userId)

    // Registrar transação
    await supabaseClient
      .from('credit_transactions')
      .insert({
        user_id: userId,
        transaction_type: 'consumption',
        operation_type: 'Criar Monitoramento',
        credits_amount: -creditCost,
        description: `Monitoramento ${monitoringType}: ${value}`
      })

    return new Response(
      JSON.stringify({
        success: true,
        monitoring,
        credits_consumed: creditCost
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in create-monitoring:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
