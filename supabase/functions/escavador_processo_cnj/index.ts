import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  cnjNumber: string
  userId: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  console.log('🚀 [Escavador CNJ] Iniciando consulta')

  try {
    const body: RequestBody = await req.json()
    const { cnjNumber, userId } = body

    if (!cnjNumber || !userId) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios: cnjNumber, userId' }),
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

    const requiredCredits = 5
    if (!creditsPlan || creditsPlan.credits_balance < requiredCredits) {
      return new Response(
        JSON.stringify({ error: 'Créditos insuficientes', required: requiredCredits }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Clean CNJ number
    const cleanCnj = cnjNumber.replace(/\D/g, '')

    // Call API
    const apiUrl = `https://api.escavador.com/v2/processos/${cleanCnj}`
    console.log('🌐 [Escavador CNJ] URL:', apiUrl)

    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': escavadorApiKey,
        'Content-Type': 'application/json',
      },
    })

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      console.error('❌ [Escavador CNJ] Erro:', errorText)
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
      operation_type: 'consulta_processo_cnj',
      credits_amount: -requiredCredits,
      cost_in_reais: 0,
      description: `Consulta CNJ ${cleanCnj}`
    })

    // Save process
    const fonte = apiData.fontes?.[0]
    const processData = {
      cnj_number: apiData.numero_cnj,
      tribunal: fonte?.sigla || fonte?.tribunal?.sigla || 'Desconhecido',
      court_name: fonte?.nome || fonte?.tribunal?.nome || null,
      distribution_date: apiData.data_inicio || null,
      status: fonte?.status_predito || fonte?.capa?.situacao || null,
      case_value: fonte?.capa?.valor_causa || null,
      judge_name: fonte?.capa?.juiz || null,
      phase: fonte?.capa?.fase || null,
      author_names: apiData.titulo_polo_ativo ? [apiData.titulo_polo_ativo] : [],
      defendant_names: apiData.titulo_polo_passivo ? [apiData.titulo_polo_passivo] : [],
      parties_cpf_cnpj: [],
      last_update: new Date().toISOString(),
    }

    await supabase
      .from('processes')
      .upsert(processData, { onConflict: 'cnj_number' })

    console.log('✅ [Escavador CNJ] Consulta finalizada')

    return new Response(
      JSON.stringify({
        success: true,
        provider: 'escavador',
        credits_consumed: requiredCredits,
        process: apiData
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 [Escavador CNJ] Erro:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: error instanceof Error ? error.message : 'Desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})