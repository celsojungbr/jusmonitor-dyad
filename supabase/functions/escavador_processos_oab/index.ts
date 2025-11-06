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

Deno.serve(async (req: Request) => { // Corrigido: Adicionado tipo Request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()
  console.log('🚀 [Escavador OAB] Iniciando consulta de processos por OAB')

  try {
    const body: RequestBody = await req.json()
    const { oab, uf, userId, page = 1 } = body

    console.log('📝 [Escavador OAB] Parâmetros:', { oab, uf, userId, page })

    if (!oab || !uf || !userId) {
      console.error('❌ [Escavador OAB] Parâmetros faltando: oab, uf ou userId')
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios: oab, uf, userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ [Escavador OAB] Variáveis de ambiente Supabase não configuradas.')
      return new Response(
        JSON.stringify({ error: 'Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas na Edge Function.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const supabase = createClient(supabaseUrl, supabaseKey)

    const escavadorApiKey = Deno.env.get('ESCAVADOR_API_KEY')
    if (!escavadorApiKey) {
      console.error('❌ [Escavador OAB] API Key do Escavador não configurada.')
      return new Response(
        JSON.stringify({ error: 'API Key do Escavador não configurada no ambiente da Edge Function.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔑 [Escavador OAB] API Key encontrada')

    // Check credits
    console.log('💰 [Escavador OAB] Verificando créditos para userId:', userId)
    const { data: creditsPlan, error: creditsError } = await supabase
      .from('credits_plans')
      .select('credits_balance')
      .eq('user_id', userId)
      .single()

    if (creditsError) {
      console.error('❌ [Escavador OAB] Erro ao buscar créditos:', creditsError.message)
      await supabase.from('system_logs').insert({
        log_type: 'error',
        user_id: userId,
        action: 'escavador_oab_credits_fetch_error',
        metadata: {
          error_message: creditsError.message,
          error_code: creditsError.code,
          oab, uf
        }
      })
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar créditos', details: creditsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!creditsPlan) {
      console.error('❌ [Escavador OAB] Plano de créditos não encontrado para userId:', userId)
      await supabase.from('system_logs').insert({
        log_type: 'error',
        user_id: userId,
        action: 'escavador_oab_credits_plan_not_found',
        metadata: {
          oab, uf
        }
      })
      return new Response(
        JSON.stringify({ error: 'Plano de créditos não encontrado para o usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requiredCredits = 8
    console.log(`💳 [Escavador OAB] Saldo: ${creditsPlan.credits_balance} | Necessário: ${requiredCredits}`)

    if (creditsPlan.credits_balance < requiredCredits) {
      console.error('❌ [Escavador OAB] Créditos insuficientes')
      return new Response(
        JSON.stringify({ 
          error: 'Créditos insuficientes',
          required: requiredCredits,
          available: creditsPlan.credits_balance
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call API
    const apiUrl = `https://api.escavador.com/v2/processos/advogado?oab=${oab}&uf=${uf}&page=${page}`
    console.log('🌐 [Escavador OAB] URL:', apiUrl)

    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${escavadorApiKey}`, // CORREÇÃO AQUI
        'Content-Type': 'application/json',
      },
    })

    const responseTime = Date.now() - startTime
    console.log(`📡 [Escavador OAB] Resposta recebida em ${responseTime}ms - Status: ${apiResponse.status}`)

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      console.error('❌ [Escavador OAB] Erro na API Escavador:', errorText)
      await supabase.from('system_logs').insert({
        log_type: 'error',
        user_id: userId,
        action: 'escavador_oab_api_call_failed',
        metadata: {
          status: apiResponse.status,
          error: errorText,
          oab, uf, url: apiUrl
        }
      })
      return new Response(
        JSON.stringify({ error: 'Erro na API', details: errorText }),
        { status: apiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiData = await apiResponse.json()

    // Debit credits
    console.log('💸 [Escavador OAB] Debitando créditos...')
    const { error: debitError } = await supabase
      .from('credits_plans')
      .update({ 
        credits_balance: creditsPlan.credits_balance - requiredCredits,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (debitError) {
      console.error('❌ [Escavador OAB] Erro ao debitar créditos:', debitError)
    } else {
      console.log('✅ [Escavador OAB] Créditos debitados')
    }

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

    // Save processes (similar logic as processos_envolvido, simplified for brevity)
    if (apiData.items && apiData.items.length > 0) {
      console.log(`💾 [Escavador OAB] Salvando ${apiData.items.length} processos...`)
      for (const item of apiData.items) {
        const fonte = item.fontes?.[0]
        await supabase
          .from('processes')
          .upsert({
            cnj_number: item.numero_cnj,
            tribunal: fonte?.sigla || fonte?.tribunal?.sigla || 'Desconhecido',
            court_name: fonte?.nome || fonte?.tribunal?.nome || null,
            distribution_date: item.data_inicio || null,
            status: fonte?.status_predito || fonte?.capa?.situacao || null,
            case_value: fonte?.capa?.valor_causa || null,
            judge_name: fonte?.capa?.juiz || null,
            phase: fonte?.capa?.fase || null,
            author_names: item.titulo_polo_ativo ? [item.titulo_polo_ativo] : [],
            defendant_names: item.titulo_polo_passivo ? [item.titulo_polo_passivo] : [],
            parties_cpf_cnpj: [], // OAB search doesn't provide CPF/CNPJ for parties directly
            last_update: new Date().toISOString(),
          }, { onConflict: 'cnj_number', ignoreDuplicates: false })
      }
    }

    // Log success
    await supabase.from('system_logs').insert({
      log_type: 'api_call',
      user_id: userId,
      action: 'escavador_oab_consulta_sucesso',
      metadata: {
        oab, uf,
        results_count: apiData.count,
        credits_consumed: requiredCredits,
        response_time_ms: responseTime
      }
    })

    console.log(`🎉 [Escavador OAB] Consulta finalizada em ${responseTime}ms`)

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
    console.error('💥 [Escavador OAB] Erro fatal na Edge Function:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: error instanceof Error ? error.message : 'Desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})