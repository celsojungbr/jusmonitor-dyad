// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  document: string
  userId: string
  page?: number
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()
  console.log('🚀 [Escavador] Iniciando consulta de processos por envolvido')

  try {
    const body: RequestBody = await req.json()
    const { document, userId, page = 1 } = body

    console.log('📝 [Escavador] Parâmetros:', { document, userId, page })

    if (!document || !userId) {
      console.error('❌ [Escavador] Parâmetros faltando: document ou userId')
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios: document, userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ [Escavador] Variáveis de ambiente Supabase não configuradas.')
      return new Response(
        JSON.stringify({ error: 'Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas na Edge Function.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get API Key
    const escavadorApiKey = Deno.env.get('ESCAVADOR_DYAD_API_KEY') // ATUALIZADO PARA ESCAVADOR_DYAD_API_KEY
    if (!escavadorApiKey) {
      console.error('❌ [Escavador] API Key do Escavador não configurada.')
      return new Response(
        JSON.stringify({ error: 'API Key do Escavador não configurada no ambiente da Edge Function.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔑 [Escavador] API Key encontrada')

    // Clean document
    const cleanDocument = document.replace(/\D/g, '')
    console.log('🧹 [Escavador] Documento limpo:', cleanDocument)

    // Validate document
    if (cleanDocument.length !== 11 && cleanDocument.length !== 14) {
      console.error('❌ [Escavador] Documento inválido: CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos.')
      return new Response(
        JSON.stringify({ error: 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check credits
    console.log('💰 [Escavador] Verificando créditos para userId:', userId)
    const { data: creditsPlan, error: creditsError } = await supabase
      .from('credits_plans')
      .select('credits_balance')
      .eq('user_id', userId)
      .single()

    if (creditsError) {
      console.error('❌ [Escavador] Erro ao buscar créditos:', creditsError.message)
      await supabase.from('system_logs').insert({
        log_type: 'error',
        user_id: userId,
        action: 'escavador_credits_fetch_error',
        metadata: {
          error_message: creditsError.message,
          error_code: creditsError.code,
          document: cleanDocument
        }
      })
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar créditos', details: creditsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!creditsPlan) {
      console.error('❌ [Escavador] Plano de créditos não encontrado para userId:', userId)
      await supabase.from('system_logs').insert({
        log_type: 'error',
        user_id: userId,
        action: 'escavador_credits_plan_not_found',
        metadata: {
          document: cleanDocument
        }
      })
      return new Response(
        JSON.stringify({ error: 'Plano de créditos não encontrado para o usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requiredCredits = 9
    console.log(`💳 [Escavador] Saldo: ${creditsPlan.credits_balance} | Necessário: ${requiredCredits}`)

    if (creditsPlan.credits_balance < requiredCredits) {
      console.error('❌ [Escavador] Créditos insuficientes')
      return new Response(
        JSON.stringify({ 
          error: 'Créditos insuficientes',
          required: requiredCredits,
          available: creditsPlan.credits_balance
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call Escavador API
    const apiUrl = `https://api.escavador.com/api/v2/processos/envolvido?q=${cleanDocument}&qo=exact&page=${page}`
    console.log('🌐 [Escavador] URL:', apiUrl)
    console.log('🔐 [Escavador] Enviando requisição...')

    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${escavadorApiKey}`,
        'Content-Type': 'application/json',
      },
    })

    const responseTime = Date.now() - startTime
    console.log(`📡 [Escavador] Resposta recebida em ${responseTime}ms - Status: ${apiResponse.status}`)

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      console.error('❌ [Escavador] Erro na API Escavador:', errorText)

      await supabase.from('system_logs').insert({
        log_type: 'error',
        user_id: userId,
        action: 'escavador_api_call_failed',
        metadata: {
          status: apiResponse.status,
          error: errorText,
          document: cleanDocument,
          url: apiUrl
        }
      })

      return new Response(
        JSON.stringify({ 
          error: 'Erro ao consultar API Escavador',
          details: errorText,
          status: apiResponse.status
        }),
        { status: apiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiData = await apiResponse.json()
    console.log('✅ [Escavador] Dados recebidos:', {
      count: apiData.count,
      items: apiData.items?.length || 0
    })

    // Debit credits
    console.log('💸 [Escavador] Debitando créditos...')
    const { error: debitError } = await supabase
      .from('credits_plans')
      .update({ 
        credits_balance: creditsPlan.credits_balance - requiredCredits,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (debitError) {
      console.error('❌ [Escavador] Erro ao debitar créditos:', debitError)
    } else {
      console.log('✅ [Escavador] Créditos debitados')
    }

    // Record transaction
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      transaction_type: 'consumption',
      operation_type: 'consulta_processual_cpf_cnpj',
      credits_amount: -requiredCredits,
      cost_in_reais: 0,
      description: `Consulta processual Escavador - ${cleanDocument}`
    })

    // Record search
    await supabase.from('user_searches').insert({
      user_id: userId,
      search_type: cleanDocument.length === 11 ? 'cpf' : 'cnpj',
      search_value: cleanDocument,
      credits_consumed: requiredCredits,
      results_count: apiData.count || 0,
      from_cache: false,
      api_used: 'escavador'
    })

    // Save processes
    if (apiData.items && apiData.items.length > 0) {
      console.log(`💾 [Escavador] Salvando ${apiData.items.length} processos...`)
      
      for (const item of apiData.items) {
        const fonte = item.fontes?.[0]
        
        const processData = {
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
          parties_cpf_cnpj: [cleanDocument],
          last_update: new Date().toISOString(),
        }

        await supabase
          .from('processes')
          .upsert(processData, { 
            onConflict: 'cnj_number',
            ignoreDuplicates: false 
          })
      }
    }

    // Log success
    await supabase.from('system_logs').insert({
      log_type: 'api_call',
      user_id: userId,
      action: 'escavador_consulta_sucesso',
      metadata: {
        document: cleanDocument,
        results_count: apiData.count,
        credits_consumed: requiredCredits,
        response_time_ms: responseTime
      }
    })

    console.log(`🎉 [Escavador] Consulta finalizada em ${responseTime}ms`)

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
    console.error('💥 [Escavador] Erro fatal na Edge Function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno no servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})