import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  documentType: 'cpf' | 'cnpj'
  document: string
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

    const { documentType, document, userId }: RequestBody = await req.json()

    console.log(`[Registration Data] Searching for ${documentType}: ${document}`)

    // Verificar créditos do usuário
    const { data: creditsData, error: creditsError } = await supabase
      .from('credits_plans')
      .select('credits_balance, credit_cost')
      .eq('user_id', userId)
      .single()

    if (creditsError || !creditsData) {
      throw new Error('Erro ao verificar créditos')
    }

    const creditCost = 5 // Custo da consulta cadastral

    if (creditsData.credits_balance < creditCost) {
      return new Response(
        JSON.stringify({ error: 'Créditos insuficientes', required: creditCost, available: creditsData.credits_balance }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar cache (7 dias)
    const cacheExpiration = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const { data: cachedData } = await supabase
      .from('registration_data')
      .select('*')
      .eq('document', document)
      .gte('last_update', cacheExpiration.toISOString())
      .maybeSingle()

    if (cachedData) {
      console.log('[Registration Data] Cache hit!')
      
      // Registrar busca (sem consumir créditos)
      await supabase.from('user_searches').insert({
        user_id: userId,
        search_type: documentType,
        search_value: document,
        credits_consumed: 0,
        results_count: 1,
        from_cache: true,
        api_used: 'judit'
      })

      return new Response(
        JSON.stringify({
          success: true,
          from_cache: true,
          credits_consumed: 0,
          data: {
            name: cachedData.full_name,
            document: cachedData.document,
            document_type: cachedData.document_type,
            addresses: cachedData.addresses,
            contacts: cachedData.contacts,
            registration_status: cachedData.registration_status,
            additional_data: cachedData.additional_data,
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

    // Chamar API JUDiT
    const response = await fetch(`${apiConfig.endpoint_url}/registration-data/registration-data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiConfig.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ document })
    })

    const responseTime = Date.now() - startTime

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Registration Data] API Error:', errorText)
      throw new Error(`Erro na API JUDiT: ${response.status}`)
    }

    const apiData = await response.json()
    console.log('[Registration Data] API response received')

    // Salvar no cache
    const { data: savedData } = await supabase
      .from('registration_data')
      .upsert({
        document,
        document_type: documentType,
        full_name: apiData.name || apiData.full_name,
        addresses: apiData.addresses || [],
        contacts: apiData.contacts || [],
        registration_status: apiData.registration_status || apiData.status,
        additional_data: apiData,
        last_update: new Date().toISOString()
      }, { onConflict: 'document' })
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
      operation_type: 'registration_data_search',
      description: `Consulta cadastral: ${document}`
    })

    // Registrar busca
    await supabase.from('user_searches').insert({
      user_id: userId,
      search_type: documentType,
      search_value: document,
      credits_consumed: creditCost,
      results_count: 1,
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
          name: savedData.full_name,
          document: savedData.document,
          document_type: savedData.document_type,
          addresses: savedData.addresses,
          contacts: savedData.contacts,
          registration_status: savedData.registration_status,
          additional_data: savedData.additional_data,
          last_update: savedData.last_update
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Registration Data] Error:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
