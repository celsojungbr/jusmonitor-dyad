import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  searchType: 'cpf' | 'cnpj' | 'oab' | 'nome'
  searchValue: string
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

    const { searchType, searchValue, userId }: RequestBody = await req.json()

    console.log(`[Diarios Oficiais] Searching for ${searchType}: ${searchValue}`)

    // Verificar cache (1 hora)
    const cacheExpiration = new Date(Date.now() - 60 * 60 * 1000)
    const { data: cachedData } = await supabase
      .from('diarios_oficiais_cache')
      .select('*')
      .eq('search_term', searchValue)
      .eq('search_type', searchType)
      .gte('last_update', cacheExpiration.toISOString())
      .maybeSingle()

    if (cachedData) {
      console.log('[Diarios Oficiais] Cache hit!')
      
      // Registrar busca (GRATUITO)
      await supabase.from('user_searches').insert({
        user_id: userId,
        search_type: searchType,
        search_value: searchValue,
        credits_consumed: 0,
        results_count: cachedData.results_count,
        from_cache: true,
        api_used: 'escavador'
      })

      return new Response(
        JSON.stringify({
          success: true,
          from_cache: true,
          credits_consumed: 0,
          source: 'diarios_oficiais',
          results_count: cachedData.results_count,
          results: cachedData.results
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar configuração da API Escavador
    const { data: apiConfig } = await supabase
      .from('api_configurations')
      .select('api_key, endpoint_url')
      .eq('api_name', 'escavador')
      .eq('is_active', true)
      .order('priority')
      .limit(1)
      .maybeSingle()

    if (!apiConfig) {
      throw new Error('Configuração da API Escavador não encontrada')
    }

    const startTime = Date.now()

    // Chamar API Escavador - Diários Oficiais (GRATUITO)
    // Endpoint: GET /v1/diarios-oficiais
    const queryParams = new URLSearchParams()
    queryParams.append('termo', searchValue)
    
    // Mapear tipo de busca para parâmetros da API
    if (searchType === 'cpf' || searchType === 'cnpj') {
      queryParams.append('tipo_documento', searchType)
    } else if (searchType === 'oab') {
      queryParams.append('numero_oab', searchValue)
    }

    const response = await fetch(
      `${apiConfig.endpoint_url}/v1/diarios-oficiais?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Token ${apiConfig.api_key}`,
          'Content-Type': 'application/json',
        }
      }
    )

    const responseTime = Date.now() - startTime

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Diarios Oficiais] API Error:', errorText)
      
      // Se der erro, retornar vazio (não cobrar)
      return new Response(
        JSON.stringify({
          success: true,
          from_cache: false,
          credits_consumed: 0,
          source: 'diarios_oficiais',
          results_count: 0,
          results: [],
          error: 'Nenhum resultado encontrado nos diários oficiais'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiData = await response.json()
    console.log('[Diarios Oficiais] API response received')

    // Processar resultados
    const results = apiData.results || apiData.data || []
    const resultsCount = results.length

    // Extrair processos mencionados nos diários
    const processesMentioned = results
      .flatMap((item: any) => item.processos_mencionados || [])
      .filter((cnj: string) => cnj && cnj.length > 0)

    // Salvar no cache
    await supabase
      .from('diarios_oficiais_cache')
      .upsert({
        search_term: searchValue,
        search_type: searchType,
        results: results,
        results_count: resultsCount,
        last_update: new Date().toISOString()
      }, { onConflict: 'search_term,search_type' })

    // Registrar busca (GRATUITO - 0 créditos)
    await supabase.from('user_searches').insert({
      user_id: userId,
      search_type: searchType,
      search_value: searchValue,
      credits_consumed: 0,
      results_count: resultsCount,
      from_cache: false,
      api_used: 'escavador',
      response_time_ms: responseTime
    })

    return new Response(
      JSON.stringify({
        success: true,
        from_cache: false,
        credits_consumed: 0, // GRATUITO!
        source: 'diarios_oficiais',
        results_count: resultsCount,
        results: results,
        processes_mentioned: processesMentioned
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Diarios Oficiais] Error:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
