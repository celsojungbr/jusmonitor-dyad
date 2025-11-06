import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EscavadorProcesso {
  numero_cnj: string
  titulo_polo_ativo?: string
  titulo_polo_passivo?: string
  data_inicio?: string
  fontes?: Array<{
    sigla?: string
    nome?: string
    tribunal?: {
      sigla?: string
      nome?: string
    }
    status_predito?: string
    capa?: {
      situacao?: string
      valor_causa?: number
      juiz?: string
      vara?: string
      fase?: string
    }
  }>
}

interface EscavadorResponse {
  count: number
  items: EscavadorProcesso[]
  next?: string
  previous?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🚀 [Escavador] Iniciando consulta CPF/CNPJ')

    // Parse request body
    const { document, userId } = await req.json()
    
    if (!document || !userId) {
      console.error('❌ [Escavador] Parâmetros faltando:', { document, userId })
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios: document, userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📝 [Escavador] Documento:', document)
    console.log('👤 [Escavador] User ID:', userId)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get Escavador API key
    const escavadorApiKey = Deno.env.get('ESCAVADOR_API_KEY')
    if (!escavadorApiKey) {
      console.error('❌ [Escavador] API Key não configurada')
      return new Response(
        JSON.stringify({ error: 'API Key do Escavador não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔑 [Escavador] API Key encontrada:', escavadorApiKey.substring(0, 10) + '...')

    // Validate and clean document
    const cleanDocument = document.replace(/\D/g, '')
    console.log('🧹 [Escavador] Documento limpo:', cleanDocument)

    if (cleanDocument.length !== 11 && cleanDocument.length !== 14) {
      console.error('❌ [Escavador] Documento inválido:', cleanDocument)
      return new Response(
        JSON.stringify({ error: 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check user credits
    console.log('💰 [Escavador] Verificando créditos do usuário...')
    const { data: creditsPlan, error: creditsError } = await supabase
      .from('credits_plans')
      .select('credits_balance')
      .eq('user_id', userId)
      .single()

    if (creditsError || !creditsPlan) {
      console.error('❌ [Escavador] Erro ao buscar plano de créditos:', creditsError)
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar créditos do usuário' }),
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
    console.log('🌐 [Escavador] Chamando API externa...')
    const escavadorUrl = `https://api.escavador.com/v2/processos/envolvido?q=${cleanDocument}&qo=exact`
    console.log('🔗 [Escavador] URL:', escavadorUrl)

    const escavadorResponse = await fetch(escavadorUrl, {
      method: 'GET',
      headers: {
        'Authorization': escavadorApiKey,
        'Content-Type': 'application/json',
      },
    })

    console.log('📡 [Escavador] Status da resposta:', escavadorResponse.status)

    if (!escavadorResponse.ok) {
      const errorText = await escavadorResponse.text()
      console.error('❌ [Escavador] Erro na API:', errorText)
      
      // Log error to system_logs
      await supabase.from('system_logs').insert({
        log_type: 'api_call',
        user_id: userId,
        action: 'escavador_api_error',
        metadata: {
          status: escavadorResponse.status,
          error: errorText,
          document: cleanDocument
        }
      })

      return new Response(
        JSON.stringify({ 
          error: 'Erro ao consultar API Escavador',
          details: errorText,
          status: escavadorResponse.status
        }),
        { status: escavadorResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const escavadorData: EscavadorResponse = await escavadorResponse.json()
    console.log('✅ [Escavador] Resposta recebida:', {
      count: escavadorData.count,
      items: escavadorData.items?.length || 0
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
      console.log('✅ [Escavador] Créditos debitados com sucesso')
    }

    // Record transaction
    console.log('📝 [Escavador] Registrando transação...')
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      transaction_type: 'consumption',
      operation_type: 'consulta_processual_cpf_cnpj',
      credits_amount: -requiredCredits,
      cost_in_reais: 0,
      description: `Consulta processual via Escavador - ${cleanDocument}`
    })

    // Record search
    console.log('🔍 [Escavador] Registrando busca...')
    await supabase.from('user_searches').insert({
      user_id: userId,
      search_type: cleanDocument.length === 11 ? 'cpf' : 'cnpj',
      search_value: cleanDocument,
      credits_consumed: requiredCredits,
      results_count: escavadorData.count || 0,
      from_cache: false,
      api_used: 'escavador'
    })

    // Save processes to database
    if (escavadorData.items && escavadorData.items.length > 0) {
      console.log(`💾 [Escavador] Salvando ${escavadorData.items.length} processos no banco...`)
      
      for (const item of escavadorData.items) {
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

        // Upsert process
        const { error: upsertError } = await supabase
          .from('processes')
          .upsert(processData, { 
            onConflict: 'cnj_number',
            ignoreDuplicates: false 
          })

        if (upsertError) {
          console.error('❌ [Escavador] Erro ao salvar processo:', item.numero_cnj, upsertError)
        } else {
          console.log('✅ [Escavador] Processo salvo:', item.numero_cnj)
        }
      }
    }

    // Log success
    await supabase.from('system_logs').insert({
      log_type: 'api_call',
      user_id: userId,
      action: 'escavador_consulta_sucesso',
      metadata: {
        document: cleanDocument,
        results_count: escavadorData.count,
        credits_consumed: requiredCredits
      }
    })

    console.log('🎉 [Escavador] Consulta finalizada com sucesso!')

    return new Response(
      JSON.stringify({
        success: true,
        provider: 'escavador',
        results_count: escavadorData.count || 0,
        credits_consumed: requiredCredits,
        items: escavadorData.items || [],
        pagination: {
          next: escavadorData.next || null,
          previous: escavadorData.previous || null
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 [Escavador] Erro fatal:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno no servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})