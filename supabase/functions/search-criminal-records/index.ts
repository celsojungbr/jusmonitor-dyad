import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  cpf: string
  userId: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { cpf, userId }: RequestBody = await req.json()

    console.log(`[Criminal Records] Searching for CPF: ${cpf}`)

    // Verificar créditos do usuário
    const { data: creditsData, error: creditsError } = await supabase
      .from('credits_plans')
      .select('credits_balance, credit_cost')
      .eq('user_id', userId)
      .single()

    if (creditsError || !creditsData) {
      throw new Error('Erro ao verificar créditos')
    }

    const creditCost = 8 // Custo da consulta penal

    if (creditsData.credits_balance < creditCost) {
      return new Response(
        JSON.stringify({ error: 'Créditos insuficientes', required: creditCost, available: creditsData.credits_balance }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar cache (30 dias)
    const cacheExpiration = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const { data: cachedData } = await supabase
      .from('criminal_records')
      .select('*')
      .eq('cpf', cpf)
      .gte('last_update', cacheExpiration.toISOString())
      .maybeSingle()

    if (cachedData) {
      console.log('[Criminal Records] Cache hit!')
      
      // Registrar busca (sem consumir créditos)
      await supabase.from('user_searches').insert({
        user_id: userId,
        search_type: 'cpf',
        search_value: cpf,
        credits_consumed: 0,
        results_count: cachedData.has_active_warrants ? 1 : 0,
        from_cache: true,
        api_used: 'judit'
      })

      return new Response(
        JSON.stringify({
          success: true,
          from_cache: true,
          credits_consumed: 0,
          data: {
            cpf: cachedData.cpf,
            warrants: cachedData.warrants,
            criminal_executions: cachedData.criminal_executions,
            has_active_warrants: cachedData.has_active_warrants,
            last_update: cachedData.last_update
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar configuração da API JUDiT
    const { data: apiConfig } = await supabase
      .from('api_configurations')
      .select('api_key, endpoint_url')
      .eq('api_name', 'judit')
      .eq('is_active', true)
      .order('priority')
      .limit(1)
      .maybeSingle()

    if (!apiConfig) {
      throw new Error('Configuração da API JUDiT não encontrada')
    }

    const startTime = Date.now()

    // Chamar ambos endpoints em paralelo
    const [warrantsResponse, executionsResponse] = await Promise.all([
      fetch(`${apiConfig.endpoint_url}/criminal-consultation/warrant`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiConfig.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf })
      }),
      fetch(`${apiConfig.endpoint_url}/criminal-consultation/criminal-execution`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiConfig.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf })
      })
    ])

    const responseTime = Date.now() - startTime

    if (!warrantsResponse.ok || !executionsResponse.ok) {
      console.error('[Criminal Records] API Error')
      throw new Error(`Erro na API JUDiT`)
    }

    const warrantsData = await warrantsResponse.json()
    const executionsData = await executionsResponse.json()

    console.log('[Criminal Records] API responses received')

    const warrants = warrantsData.warrants || warrantsData.data || []
    const criminal_executions = executionsData.executions || executionsData.data || []
    const has_active_warrants = warrants.length > 0

    // Salvar no cache
    const { data: savedData } = await supabase
      .from('criminal_records')
      .upsert({
        cpf,
        warrants,
        criminal_executions,
        has_active_warrants,
        last_update: new Date().toISOString()
      }, { onConflict: 'cpf' })
      .select()
      .single()

    // Deduzir créditos
    await supabase
      .from('credits_plans')
      .update({ credits_balance: creditsData.credits_balance - creditCost })
      .eq('user_id', userId)

    // Registrar transação
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      transaction_type: 'debit',
      credits_amount: creditCost,
      cost_in_reais: creditCost * (creditsData.credit_cost || 1.50),
      operation_type: 'criminal_records_search',
      description: `Consulta penal: ${cpf}`
    })

    // Registrar busca
    await supabase.from('user_searches').insert({
      user_id: userId,
      search_type: 'cpf',
      search_value: cpf,
      credits_consumed: creditCost,
      results_count: has_active_warrants ? 1 : 0,
      from_cache: false,
      api_used: 'judit',
      response_time_ms: responseTime
    })

    return new Response(
      JSON.stringify({
        success: true,
        from_cache: false,
        credits_consumed: creditCost,
        data: {
          cpf: savedData.cpf,
          warrants: savedData.warrants,
          criminal_executions: savedData.criminal_executions,
          has_active_warrants: savedData.has_active_warrants,
          last_update: savedData.last_update
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Criminal Records] Error:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
