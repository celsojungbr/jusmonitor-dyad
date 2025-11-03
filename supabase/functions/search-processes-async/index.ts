import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchRequest {
  searchType: 'cpf' | 'cnpj' | 'oab' | 'cnj'
  searchValue: string
  userId: string
}

interface Process {
  cnj_number: string
  tribunal: string
  court_name?: string
  distribution_date?: string
  judge_name?: string
  case_value?: number
  status?: string
  phase?: string
  author_names?: string[]
  defendant_names?: string[]
  parties_cpf_cnpj?: string[]
  source_api: 'judit' | 'escavador'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { searchType, searchValue, userId } = await req.json() as SearchRequest

    console.log(`[Async Search] Tipo: ${searchType}, Valor: ${searchValue}, User: ${userId}`)

    if (!searchType || !searchValue || !userId) {
      throw new Error('Missing required parameters')
    }

    // Verificar créditos do usuário
    const { data: creditsPlan, error: creditsError } = await supabase
      .from('credits_plans')
      .select('credits_balance, credit_cost')
      .eq('user_id', userId)
      .single()

    if (creditsError || !creditsPlan) {
      throw new Error('Não foi possível verificar saldo de créditos')
    }

    const creditCost = 3 // Custo da busca completa
    if (creditsPlan.credits_balance < creditCost) {
      throw new Error(`Créditos insuficientes. Necessário: ${creditCost}, Disponível: ${creditsPlan.credits_balance}`)
    }

    // Chamar JUDiT com cache habilitado
    const juditApiKey = Deno.env.get('JUDIT_API_KEY')
    if (!juditApiKey) {
      throw new Error('JUDIT_API_KEY não configurada')
    }

    const baseUrl = 'https://api.judit.io'
    
    // Mapear tipo de busca para endpoint JUDiT
    let endpoint: string
    let requestBody: any = { cache: true } // Sempre com cache habilitado

    if (searchType === 'cnj') {
      endpoint = `${baseUrl}/v1/request-process`
      requestBody.process_number = searchValue
    } else if (searchType === 'cpf') {
      endpoint = `${baseUrl}/v1/request-document`
      requestBody.document = searchValue
      requestBody.document_type = 'cpf'
    } else if (searchType === 'cnpj') {
      endpoint = `${baseUrl}/v1/request-document`
      requestBody.document = searchValue
      requestBody.document_type = 'cnpj'
    } else if (searchType === 'oab') {
      endpoint = `${baseUrl}/v1/request-oab`
      const oabMatch = searchValue.match(/^(\d+)\/?([A-Z]{2})?$/)
      requestBody.oab_number = oabMatch ? oabMatch[1] : searchValue
      requestBody.oab_state = oabMatch && oabMatch[2] ? oabMatch[2] : 'SP'
    } else {
      throw new Error(`Tipo de busca não suportado: ${searchType}`)
    }

    console.log(`[Async Search] Chamando JUDiT: ${endpoint}`)
    console.log(`[Async Search] Body:`, JSON.stringify(requestBody))

    const juditResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${juditApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!juditResponse.ok) {
      const errorText = await juditResponse.text()
      console.error('[Async Search] Erro JUDiT:', juditResponse.status, errorText)
      throw new Error(`Erro ao chamar JUDiT: ${juditResponse.status}`)
    }

    const juditData = await juditResponse.json()
    console.log('[Async Search] Resposta JUDiT:', JSON.stringify(juditData).substring(0, 500))

    // Verificar se retornou request_id (assíncrono) ou dados diretos (cache hit)
    if (juditData.request_id) {
      // Busca ASSÍNCRONA - vai demorar
      console.log('[Async Search] Busca assíncrona iniciada, request_id:', juditData.request_id)

      // Deduzir créditos AGORA
      await supabase
        .from('credits_plans')
        .update({ credits_balance: creditsPlan.credits_balance - creditCost })
        .eq('user_id', userId)

      // Registrar transação
      await supabase.from('credit_transactions').insert({
        user_id: userId,
        transaction_type: 'consume',
        credits_amount: creditCost,
        cost_in_reais: creditCost * creditsPlan.credit_cost,
        description: `Busca completa: ${searchType} ${searchValue}`,
        operation_type: 'search_async'
      })

      // Criar registro de busca assíncrona
      const { data: asyncSearch, error: asyncError } = await supabase
        .from('async_searches')
        .insert({
          user_id: userId,
          search_type: searchType,
          search_value: searchValue,
          request_id: juditData.request_id,
          provider: 'judit',
          status: 'processing'
        })
        .select()
        .single()

      if (asyncError) {
        console.error('[Async Search] Erro ao criar registro assíncrono:', asyncError)
      }

      return new Response(
        JSON.stringify({
          status: 'processing',
          request_id: juditData.request_id,
          async_search_id: asyncSearch?.id,
          credits_consumed: creditCost,
          estimated_time_minutes: 3,
          message: 'Busca iniciada. Aguarde 2-5 minutos para conclusão.',
          search_type: 'complete'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 202 // Accepted
        }
      )
    } else {
      // Cache HIT - dados retornados imediatamente
      console.log('[Async Search] Cache hit! Dados retornados imediatamente')

      const processes: Process[] = []
      
      // Extrair processos da resposta
      if (juditData.processes && Array.isArray(juditData.processes)) {
        for (const proc of juditData.processes) {
          processes.push({
            cnj_number: proc.process_number || proc.cnj_number,
            tribunal: proc.court || proc.tribunal || 'Desconhecido',
            court_name: proc.court_name,
            distribution_date: proc.distribution_date,
            judge_name: proc.judge_name,
            case_value: proc.case_value,
            status: proc.status,
            phase: proc.phase,
            author_names: proc.plaintiffs || [],
            defendant_names: proc.defendants || [],
            parties_cpf_cnpj: [searchValue],
            source_api: 'judit'
          })
        }
      }

      // Salvar no cache
      if (processes.length > 0) {
        await supabase
          .from('processes')
          .upsert(
            processes.map(p => ({ ...p, last_searched_by: userId })),
            { onConflict: 'cnj_number' }
          )
      }

      // Deduzir créditos
      await supabase
        .from('credits_plans')
        .update({ credits_balance: creditsPlan.credits_balance - creditCost })
        .eq('user_id', userId)

      await supabase.from('credit_transactions').insert({
        user_id: userId,
        transaction_type: 'consume',
        credits_amount: creditCost,
        cost_in_reais: creditCost * creditsPlan.credit_cost,
        description: `Busca completa (cache): ${searchType} ${searchValue}`,
        operation_type: 'search_complete'
      })

      // Registrar busca
      await supabase.from('user_searches').insert({
        user_id: userId,
        search_type: searchType,
        search_value: searchValue,
        credits_consumed: creditCost,
        results_count: processes.length,
        from_cache: true,
        api_used: 'judit'
      })

      return new Response(
        JSON.stringify({
          status: 'completed',
          processes,
          credits_consumed: creditCost,
          results_count: processes.length,
          from_cache: true,
          search_type: 'complete',
          message: `Encontrados ${processes.length} processos (cache)`
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

  } catch (error: any) {
    console.error('[Async Search] Erro:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao realizar busca completa',
        status: 'error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})