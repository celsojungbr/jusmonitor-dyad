import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  oab: string
  uf: string
  userId: string
  page?: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  console.log('🚀 [Escavador OAB] Iniciando consulta')

  try {
    const body: RequestBody = await req.json()
    const { oab, uf, userId, page = 1 } = body

    if (!oab || !uf || !userId) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios: oab, uf, userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const escavadorApiKey = Deno.env.get('ESCAVADOR_API_KEY')
    if (!escavadorApiKey) {
      return new Response(
        JSON.stringify({ error: 'API Key não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check credits
    const { data: creditsPlan } = await supabase
      .from('credits_plans')
      .select('credits_balance')
      .eq('user_id', userId)
      .single()

    const requiredCredits = 8
    if (!creditsPlan || creditsPlan.credits_balance < requiredCredits) {
      return new Response(
        JSON.stringify({ error: 'Créditos insuficientes', required: requiredCredits }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call API
    const apiUrl = `https://api.escavador.com/v2/processos/advogado?oab=${oab}&uf=${uf}&page=${page}`
    console.log('🌐 [Escavador OAB] URL:', apiUrl)

    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': escavadorApiKey,
        'Content-Type': 'application/json',
      },
    })

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      console.error('❌ [Escavador OAB] Erro:', errorText)
      return new Response(
        JSON.stringify({ error: 'Erro na API', details: errorText }),
        { status: apiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiData = await apiResponse.json()

    // Debit credits
    await supabase
      .from('credits_plans')
      .update({ credits_balance: creditsPlan.credits_balance - requiredCredits })
      .eq('user_id', userId)

    // Record transaction
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      transaction_type: 'consumption',
      operation_type: 'consulta_processual_oab',
      credits_amount: -requiredCredits,
      cost_in_reais: 0,
      description: `Consulta OAB ${oab}/${uf}`
    })

    // Record search
    await supabase.from('user_searches').insert({
      user_id: userId,
      search_type: 'oab',
      search_value: `${oab}/${uf}`,
      credits_consumed: requiredCredits,
      results_count: apiData.count || 0,
      from_cache: false,
      api_used: 'escavador'
    })

    console.log('✅ [Escavador OAB] Consulta finalizada')

    return new Response(
      JSON.stringify({
        success: true,
        provider: 'escavador',
        results_count: apiData.count || 0,
        credits_consumed: requiredCredits,
        items: apiData.items || [],
        pagination: {
          next: apiData.next || null,
          previous: apiData.previous || null
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 [Escavador OAB] Erro:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: error instanceof Error ? error.message : 'Desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})