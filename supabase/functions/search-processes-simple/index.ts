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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { searchType, searchValue, userId } = await req.json() as SearchRequest

    console.log(`[Simple Search] Tipo: ${searchType}, Valor: ${searchValue}, User: ${userId}`)

    if (!searchType || !searchValue || !userId) {
      throw new Error('Missing required parameters')
    }

    // PASSO 1: Buscar no cache local primeiro (últimas 24h)
    console.log('[Simple Search] Verificando cache local...')
    
    // Buscar processos onde o CPF/CNPJ está no array parties_cpf_cnpj
    const { data: cachedProcesses, error: cacheError } = await supabase
      .from('processes')
      .select('*')
      .contains('parties_cpf_cnpj', [searchValue])
      .gte('last_update', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (cacheError) {
      console.log('[Simple Search] Erro ao buscar cache (ignorando):', cacheError.message)
    }

    if (cachedProcesses && cachedProcesses.length > 0) {
      console.log(`[Simple Search] Encontrados ${cachedProcesses.length} processos no cache`)
      
      // Registrar busca gratuita
      await supabase.from('user_searches').insert({
        user_id: userId,
        search_type: searchType,
        search_value: searchValue,
        credits_consumed: 0,
        results_count: cachedProcesses.length,
        from_cache: true
      })

      return new Response(
        JSON.stringify({
          processes: cachedProcesses,
          from_cache: true,
          credits_consumed: 0,
          results_count: cachedProcesses.length,
          search_type: 'simple'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // PASSO 2: Buscar nos Diários Oficiais do Escavador (GRATUITO)
    console.log('[Simple Search] Buscando em Diários Oficiais (gratuito)...')
    
    const escavadorToken = Deno.env.get('ESCAVADOR_API_KEY')
    if (!escavadorToken) {
      throw new Error('ESCAVADOR_API_KEY não configurada')
    }

    // Construir query baseado no tipo
    let qo = 'cpf'
    if (searchType === 'cnpj') qo = 'cnpj'
    else if (searchType === 'oab') qo = 'oab'
    else if (searchType === 'cnj') qo = 'nome' // Se buscar por CNJ, usar como nome

    const queryParams = new URLSearchParams({
      q: searchValue,
      qo: qo
    })

    const diariosUrl = `https://api.escavador.com/v1/diarios-oficiais?${queryParams.toString()}`
    console.log('[Simple Search] URL:', diariosUrl)

    const diariosResponse = await fetch(diariosUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${escavadorToken}`,
        'Accept': 'application/json'
      }
    })

    // Tratar 404 como "sem resultados" em vez de erro
    if (!diariosResponse.ok) {
      const errorText = await diariosResponse.text()
      console.log(`[Simple Search] Status ${diariosResponse.status} da API Escavador:`, errorText.substring(0, 200))
      
      if (diariosResponse.status === 404) {
        // 404 = sem resultados, não é erro
        console.log('[Simple Search] Nenhum resultado encontrado nos diários oficiais')
        
        await supabase.from('user_searches').insert({
          user_id: userId,
          search_type: searchType,
          search_value: searchValue,
          credits_consumed: 0,
          results_count: 0,
          from_cache: false,
          api_used: 'escavador'
        })

        return new Response(
          JSON.stringify({
            processes: [],
            from_cache: false,
            credits_consumed: 0,
            results_count: 0,
            search_type: 'simple',
            message: 'Nenhum processo encontrado nos diários oficiais'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        )
      }
      
      throw new Error(`Erro ao buscar diários oficiais: ${diariosResponse.status}`)
    }

    const diariosData = await diariosResponse.json()
    console.log('[Simple Search] Resposta dos diários:', JSON.stringify(diariosData).substring(0, 500))

    const processes: Process[] = []
    
    // Extrair processos dos diários oficiais
    if (diariosData.data && Array.isArray(diariosData.data)) {
      for (const item of diariosData.data) {
        // Tentar extrair números CNJ do conteúdo
        const content = item.conteudo || item.content || ''
        const cnjPattern = /\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}/g
        const cnjNumbers = content.match(cnjPattern)

        if (cnjNumbers && cnjNumbers.length > 0) {
          for (const cnjNumber of cnjNumbers) {
            processes.push({
              cnj_number: cnjNumber,
              tribunal: item.tribunal || 'Desconhecido',
              court_name: item.orgao || null,
              distribution_date: item.data_publicacao || null,
              status: 'Encontrado em Diário Oficial',
              source_api: 'escavador',
              author_names: [],
              defendant_names: [],
              parties_cpf_cnpj: [searchValue]
            })
          }
        }
      }
    }

    console.log(`[Simple Search] Encontrados ${processes.length} processos nos diários`)

    // Salvar processos no cache se encontrou algo
    if (processes.length > 0) {
      const { error: insertError } = await supabase
        .from('processes')
        .upsert(
          processes.map(p => ({
            ...p,
            last_searched_by: userId
          })),
          { onConflict: 'cnj_number' }
        )

      if (insertError) {
        console.error('[Simple Search] Erro ao salvar no cache:', insertError)
      }
    }

    // Registrar busca gratuita
    await supabase.from('user_searches').insert({
      user_id: userId,
      search_type: searchType,
      search_value: searchValue,
      credits_consumed: 0,
      results_count: processes.length,
      from_cache: false,
      api_used: 'escavador'
    })

    return new Response(
      JSON.stringify({
        processes,
        from_cache: false,
        credits_consumed: 0,
        results_count: processes.length,
        search_type: 'simple',
        message: processes.length > 0 
          ? `Encontrados ${processes.length} processos nos diários oficiais` 
          : 'Nenhum processo encontrado nos diários oficiais'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('[Simple Search] Erro:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao realizar busca simples',
        processes: [],
        from_cache: false,
        credits_consumed: 0,
        results_count: 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})