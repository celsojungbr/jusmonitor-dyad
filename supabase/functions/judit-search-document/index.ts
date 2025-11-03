import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  userId: string
  document: string
}

interface JuditLawsuit {
  cnj?: string
  number?: string
  court?: string
  state?: string
  distribuition_date?: string
  last_movement_date?: string
  status?: string
  parties?: Array<{
    name?: string
    type?: string
    document?: string
  }>
  lawsuit_class?: string
  lawsuit_area?: string
  lawsuit_value?: number
  movements_count?: number
}

interface JuditResponse {
  request_id?: string
  status?: string
  lawsuits?: JuditLawsuit[]
  total_lawsuits?: number
  message?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, document }: RequestBody = await req.json()

    if (!userId || !document) {
      return new Response(
        JSON.stringify({ error: 'userId e document são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Normalizar documento (apenas dígitos)
    const normalizedDoc = document.replace(/\D/g, '')
    
    if (normalizedDoc.length !== 11 && normalizedDoc.length !== 14) {
      return new Response(
        JSON.stringify({ error: 'Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const docType = normalizedDoc.length === 11 ? 'cpf' : 'cnpj'
    console.log(`[JUDiT Document] Iniciando busca ${docType.toUpperCase()}: ${normalizedDoc}`)

    const juditApiKey = Deno.env.get('JUDIT_API_KEY')
    if (!juditApiKey) {
      throw new Error('JUDIT_API_KEY não configurada')
    }

    // Endpoint JUDiT para consulta por documento
    const juditUrl = 'https://api.judit.io/v1/request/document'
    
    console.log('[JUDiT Document] URL da requisição:', juditUrl)
    console.log('[JUDiT Document] Documento:', normalizedDoc)

    // Fazer requisição à JUDiT com timeout de 30 segundos
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    let response: Response
    try {
      response = await fetch(juditUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${juditApiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          document: normalizedDoc
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      console.log(`[JUDiT Document] Status da API: ${response.status}`)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        console.error('[JUDiT Document] Timeout após 30 segundos')
        return new Response(
          JSON.stringify({ error: 'Timeout: A API JUDiT não respondeu a tempo' }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      throw fetchError
    }

    // Tratamento de erros específicos
    if (response.status === 401) {
      console.error('[JUDiT Document] Erro de autenticação (401)')
      return new Response(
        JSON.stringify({ error: 'Erro de autenticação na API JUDiT' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (response.status === 402) {
      console.error('[JUDiT Document] Sem saldo de créditos (402)')
      return new Response(
        JSON.stringify({ error: 'Você não possui saldo em crédito da API JUDiT.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (response.status === 422) {
      const errorJson = await response.json().catch(() => null)
      console.log('[JUDiT Document] 422 recebido:', errorJson)

      // Registrar busca sem resultados
      await supabase.from('user_searches').insert({
        user_id: userId,
        search_type: docType,
        search_value: normalizedDoc,
        credits_consumed: 0,
        results_count: 0,
        from_cache: false,
        api_used: 'judit'
      })

      return new Response(
        JSON.stringify({
          results_count: 0,
          lawsuits: [],
          from_cache: false,
          credits_consumed: 0,
          provider: 'judit',
          message: 'Parâmetros inválidos para a API JUDiT. Verifique o documento enviado.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (response.status === 404) {
      console.log('[JUDiT Document] Nenhum resultado encontrado (404)')
      
      // Registrar busca sem resultados
      await supabase.from('user_searches').insert({
        user_id: userId,
        search_type: docType,
        search_value: normalizedDoc,
        credits_consumed: 0,
        results_count: 0,
        from_cache: false,
        api_used: 'judit'
      })

      return new Response(
        JSON.stringify({
          results_count: 0,
          lawsuits: [],
          from_cache: false,
          credits_consumed: 0,
          provider: 'judit',
          message: 'Nenhum processo encontrado'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[JUDiT Document] Erro ${response.status}:`, errorText.substring(0, 200))
      return new Response(
        JSON.stringify({ error: `Erro na API JUDiT: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sucesso (200 ou 202 - requisição assíncrona)
    const data: JuditResponse = await response.json()
    
    // Se for assíncrono (status 202), retornar request_id para polling
    if (response.status === 202) {
      console.log('[JUDiT Document] Requisição assíncrona criada:', data.request_id)
      
      // Registrar busca assíncrona
      await supabase.from('async_searches').insert({
        user_id: userId,
        search_type: docType,
        search_value: normalizedDoc,
        request_id: data.request_id || '',
        provider: 'judit',
        status: 'processing'
      })

      return new Response(
        JSON.stringify({
          async: true,
          request_id: data.request_id,
          status: 'processing',
          provider: 'judit',
          message: 'Busca em andamento. Use o request_id para consultar o status.'
        }),
        { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Resposta síncrona (200)
    const lawsuits = data.lawsuits || []
    const resultsCount = lawsuits.length

    console.log(`[JUDiT Document] Encontrados ${resultsCount} processos`)

    // Registrar busca
    await supabase.from('user_searches').insert({
      user_id: userId,
      search_type: docType,
      search_value: normalizedDoc,
      credits_consumed: 0,
      results_count: resultsCount,
      from_cache: false,
      api_used: 'judit'
    })

    // Persistir processos encontrados
    if (lawsuits.length > 0) {
      console.log(`[JUDiT Document] Persistindo ${lawsuits.length} processos...`)
      
      for (const lawsuit of lawsuits) {
        try {
          const cnjNumber = lawsuit.cnj || lawsuit.number || ''
          if (!cnjNumber) continue

          // Extrair nomes das partes
          const authors = lawsuit.parties?.filter(p => p.type?.toLowerCase().includes('autor') || p.type?.toLowerCase().includes('requerente'))
            .map(p => p.name).filter(Boolean) as string[] || []
          
          const defendants = lawsuit.parties?.filter(p => p.type?.toLowerCase().includes('réu') || p.type?.toLowerCase().includes('requerido'))
            .map(p => p.name).filter(Boolean) as string[] || []

          await supabase.from('processes').upsert({
            cnj_number: cnjNumber,
            tribunal: lawsuit.court || lawsuit.state || 'Desconhecido',
            court_name: lawsuit.court || null,
            distribution_date: lawsuit.distribuition_date || null,
            status: lawsuit.status || 'Encontrado (JUDiT)',
            parties_cpf_cnpj: [normalizedDoc],
            author_names: authors.length > 0 ? authors : null,
            defendant_names: defendants.length > 0 ? defendants : null,
            case_value: lawsuit.lawsuit_value || null,
            last_searched_by: userId,
            source_api: 'judit',
            last_update: new Date().toISOString()
          }, {
            onConflict: 'cnj_number'
          })
        } catch (err) {
          console.error('[JUDiT Document] Erro ao persistir processo:', err)
        }
      }
    }

    return new Response(
      JSON.stringify({
        results_count: resultsCount,
        lawsuits,
        total_lawsuits: data.total_lawsuits,
        from_cache: false,
        credits_consumed: 0,
        provider: 'judit',
        message: resultsCount > 0 
          ? `${resultsCount} processo(s) encontrado(s)` 
          : 'Nenhum processo encontrado'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[JUDiT Document] Erro:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
