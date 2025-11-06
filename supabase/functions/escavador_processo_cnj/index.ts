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

  const startTime = Date.now()
  console.log('🚀 [Escavador CNJ] Iniciando consulta de processo por CNJ')

  try {
    const body: RequestBody = await req.json()
    const { cnjNumber, userId } = body

    console.log('📝 [Escavador CNJ] Parâmetros:', { cnjNumber, userId })

    if (!cnjNumber || !userId) {
      console.error('❌ [Escavador CNJ] Parâmetros faltando: cnjNumber ou userId')
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios: cnjNumber, userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ [Escavador CNJ] Variáveis de ambiente Supabase não configuradas.')
      return new Response(
        JSON.stringify({ error: 'Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas na Edge Function.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const supabase = createClient(supabaseUrl, supabaseKey)

    const escavadorApiKey = Deno.env.get('ESCAVADOR_API_KEY')
    if (!escavadorApiKey) {
      console.error('❌ [Escavador CNJ] API Key do Escavador não configurada.')
      return new Response(
        JSON.stringify({ error: 'API Key do Escavador não configurada no ambiente da Edge Function.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔑 [Escavador CNJ] API Key encontrada')

    // Check credits
    console.log('💰 [Escavador CNJ] Verificando créditos para userId:', userId)
    const { data: creditsPlan, error: creditsError } = await supabase
      .from('credits_plans')
      .select('credits_balance')
      .eq('user_id', userId)
      .single()

    if (creditsError) {
      console.error('❌ [Escavador CNJ] Erro ao buscar créditos:', creditsError.message)
      await supabase.from('system_logs').insert({
        log_type: 'error',
        user_id: userId,
        action: 'escavador_cnj_credits_fetch_error',
        metadata: {
          error_message: creditsError.message,
          error_code: creditsError.code,
          cnjNumber
        }
      })
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar créditos', details: creditsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!creditsPlan) {
      console.error('❌ [Escavador CNJ] Plano de créditos não encontrado para userId:', userId)
      await supabase.from('system_logs').insert({
        log_type: 'error',
        user_id: userId,
        action: 'escavador_cnj_credits_plan_not_found',
        metadata: {
          cnjNumber
        }
      })
      return new Response(
        JSON.stringify({ error: 'Plano de créditos não encontrado para o usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requiredCredits = 5
    console.log(`💳 [Escavador CNJ] Saldo: ${creditsPlan.credits_balance} | Necessário: ${requiredCredits}`)

    if (creditsPlan.credits_balance < requiredCredits) {
      console.error('❌ [Escavador CNJ] Créditos insuficientes')
      return new Response(
        JSON.stringify({ 
          error: 'Créditos insuficientes',
          required: requiredCredits,
          available: creditsPlan.credits_balance
        }),
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

    const responseTime = Date.now() - startTime
    console.log(`📡 [Escavador CNJ] Resposta recebida em ${responseTime}ms - Status: ${apiResponse.status}`)

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      console.error('❌ [Escavador CNJ] Erro na API Escavador:', errorText)
      await supabase.from('system_logs').insert({
        log_type: 'error',
        user_id: userId,
        action: 'escavador_cnj_api_call_failed',
        metadata: {
          status: apiResponse.status,
          error: errorText,
          cnjNumber, url: apiUrl
        }
      })
      return new Response(
        JSON.stringify({ error: 'Erro na API', details: errorText }),
        { status: apiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiData = await apiResponse.json()

    // Debit credits
    console.log('💸 [Escavador CNJ] Debitando créditos...')
    const { error: debitError } = await supabase
      .from('credits_plans')
      .update({ 
        credits_balance: creditsPlan.credits_balance - requiredCredits,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (debitError) {
      console.error('❌ [Escavador CNJ] Erro ao debitar créditos:', debitError)
    } else {
      console.log('✅ [Escavador CNJ] Créditos debitados')
    }

    // Record transaction
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      transaction_type: 'consumption',
      operation_type: 'consulta_processo_cnj',
      credits_amount: -requiredCredits,
      cost_in_reais: 0,
      description: `Consulta CNJ ${cleanCnj}`
    })

    // Record search
    await supabase.from('user_searches').insert({
      user_id: userId,
      search_type: 'cnj',
      search_value: cleanCnj,
      credits_consumed: requiredCredits,
      results_count: apiData.numero_cnj ? 1 : 0, // Assuming 1 result for CNJ search
      from_cache: false,
      api_used: 'escavador'
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

    // Log success
    await supabase.from('system_logs').insert({
      log_type: 'api_call',
      user_id: userId,
      action: 'escavador_cnj_consulta_sucesso',
      metadata: {
        cnjNumber,
        results_count: apiData.numero_cnj ? 1 : 0,
        credits_consumed: requiredCredits,
        response_time_ms: responseTime
      }
    })

    console.log(`🎉 [Escavador CNJ] Consulta finalizada em ${responseTime}ms`)

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
    console.error('💥 [Escavador CNJ] Erro fatal na Edge Function:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: error instanceof Error ? error.message : 'Desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})