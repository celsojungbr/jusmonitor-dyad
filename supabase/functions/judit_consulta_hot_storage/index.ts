import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  userId: string
  document: string
}

interface JuditParty {
  name: string
  side: 'Active' | 'Passive' | 'Interested' | 'Unknown'
  person_type: string
  document?: string
  document_type?: 'CPF' | 'CNPJ'
  lawyers?: Array<{
    name: string
    side: string
    person_type: string
  }>
}

interface JuditResponseData {
  code: string
  tribunal_acronym: string
  distribution_date?: string
  phase?: string
  status?: string
  amount?: number
  parties: JuditParty[]
  courts?: Array<{ name: string }>
}

interface JuditPageResponse {
  request_id: string
  response_id: string
  response_type: string
  response_data: JuditResponseData
  request_status: string
}

interface JuditResponsesResult {
  request_status: string
  page: number
  page_count: number
  all_count: number
  all_pages_count: number
  page_data: JuditPageResponse[]
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const startTime = Date.now()
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

    // Normalizar documento (apenas números)
    const normalizedDoc = document.replace(/\D/g, '')
    
    // Validar tipo de documento
    let searchType: 'cpf' | 'cnpj' | 'oab'
    
    if (normalizedDoc.length === 11) {
      searchType = 'cpf'
    } else if (normalizedDoc.length === 14) {
      searchType = 'cnpj'
    } else if (normalizedDoc.length >= 6 && normalizedDoc.length <= 10) {
      searchType = 'oab'
    } else {
      return new Response(
        JSON.stringify({ error: 'Documento inválido. Deve ser CPF (11 dígitos), CNPJ (14 dígitos) ou OAB (6-10 dígitos)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[JUDiT Hot Storage] Iniciando busca:', searchType, normalizedDoc)

    const JUDIT_API_KEY = Deno.env.get('JUDIT_API_KEY')
    if (!JUDIT_API_KEY) {
      console.error('[JUDiT Hot Storage] JUDIT_API_KEY não configurada')
      return new Response(
        JSON.stringify({ error: 'JUDIT_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PASSO 1: Criar request na JUDiT
    const requestPayload = {
      search: {
        search_type: searchType,
        search_key: normalizedDoc,
        search_params: {
          masked_response: false
        }
      }
    }

    console.log('[JUDiT Hot Storage] Criando request na JUDiT...')

    const createRequestResponse = await fetch(
      'https://requests.prod.judit.io/requests',
      {
        method: 'POST',
        headers: {
          'api-key': JUDIT_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      }
    )

    if (!createRequestResponse.ok) {
      const errorText = await createRequestResponse.text()
      console.error('[JUDiT Hot Storage] Erro ao criar request:', createRequestResponse.status, errorText)

      if (createRequestResponse.status === 401) {
        return new Response(
          JSON.stringify({ error: 'API Key inválida ou não autorizada' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (createRequestResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Sem créditos disponíveis na API JUDiT' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ error: `Erro ao criar request: ${errorText}` }),
        { status: createRequestResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const createRequestData = await createRequestResponse.json()
    const requestId = createRequestData.request_id

    console.log('[JUDiT Hot Storage] Request ID criado:', requestId)

    // PASSO 2: Polling do status (máximo 60 segundos, check a cada 2 segundos)
    const maxAttempts = 30 // 30 attempts x 2 seconds = 60 seconds
    const pollInterval = 2000
    let currentAttempt = 0
    let requestStatus = 'pending'

    while (currentAttempt < maxAttempts && requestStatus !== 'completed') {
      currentAttempt++
      console.log(`[JUDiT Hot Storage] Polling status (tentativa ${currentAttempt}/${maxAttempts}):`, requestStatus)

      await new Promise(resolve => setTimeout(resolve, pollInterval))

      const statusResponse = await fetch(
        `https://requests.prod.judit.io/requests/${requestId}`,
        {
          headers: {
            'api-key': JUDIT_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      )

      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        requestStatus = statusData.status
      }
    }

    if (requestStatus !== 'completed') {
      console.error('[JUDiT Hot Storage] Timeout: status não completou em 60 segundos')
      return new Response(
        JSON.stringify({ 
          error: 'Timeout', 
          message: 'A API JUDiT está demorando mais que o esperado. A consulta pode estar sendo processada.',
          request_id: requestId,
          status: requestStatus
        }),
        { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[JUDiT Hot Storage] Status completed! Buscando resultados...')

    // PASSO 3: Buscar resultados paginados
    let allProcesses: JuditPageResponse[] = []
    let currentPage = 1
    const pageSize = 100
    let allPagesCount = 1

    // Buscar primeira página para saber quantas páginas existem
    const firstPageResponse = await fetch(
      `https://requests.prod.judit.io/responses/?request_id=${requestId}&page=${currentPage}&page_size=${pageSize}`,
      {
        headers: {
          'api-key': JUDIT_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!firstPageResponse.ok) {
      const errorText = await firstPageResponse.text()
      console.error('[JUDiT Hot Storage] Erro ao buscar resultados:', firstPageResponse.status, errorText)

      if (firstPageResponse.status === 404) {
        // Nenhum processo encontrado
        console.log('[JUDiT Hot Storage] Nenhum processo encontrado')

        await supabase.from('user_searches').insert({
          user_id: userId,
          search_type: searchType,
          search_value: normalizedDoc,
          credits_consumed: 0,
          results_count: 0,
          from_cache: true,
          api_used: 'judit'
        })

        return new Response(
          JSON.stringify({
            success: true,
            results_count: 0,
            lawsuits: [],
            from_cache: true,
            provider: 'judit',
            request_id: requestId,
            message: 'Nenhum processo encontrado no Hot Storage'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ error: `Erro ao buscar resultados: ${errorText}` }),
        { status: firstPageResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const firstPageData: JuditResponsesResult = await firstPageResponse.json()
    allPagesCount = firstPageData.all_pages_count || 1
    allProcesses.push(...firstPageData.page_data)

    console.log('[JUDiT Hot Storage] Total de páginas:', allPagesCount)
    console.log('[JUDiT Hot Storage] Processando página 1 de', allPagesCount)

    // Buscar páginas restantes
    for (let page = 2; page <= allPagesCount; page++) {
      console.log('[JUDiT Hot Storage] Processando página', page, 'de', allPagesCount)

      const pageResponse = await fetch(
        `https://requests.prod.judit.io/responses/?request_id=${requestId}&page=${page}&page_size=${pageSize}`,
        {
          headers: {
            'api-key': JUDIT_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      )

      if (pageResponse.ok) {
        const pageData: JuditResponsesResult = await pageResponse.json()
        allProcesses.push(...pageData.page_data)
      }
    }

    console.log('[JUDiT Hot Storage] Total de processos encontrados:', allProcesses.length)

    // PASSO 4: Registrar a busca no histórico
    await supabase.from('user_searches').insert({
      user_id: userId,
      search_type: searchType,
      search_value: normalizedDoc,
      credits_consumed: 0,
      results_count: allProcesses.length,
      from_cache: true,
      api_used: 'judit'
    })

    // PASSO 5: Persistir processos no banco
    console.log('[JUDiT Hot Storage] Persistindo processos no banco...')

    for (const processItem of allProcesses) {
      const processData = processItem.response_data

      if (!processData.code) continue

      // Extrair partes (authors, defendants, documentos)
      const authors: string[] = []
      const defendants: string[] = []
      const allDocuments: string[] = []

      for (const party of processData.parties || []) {
        // Adicionar documento se existir
        if (party.document) {
          allDocuments.push(party.document)
        }

        // Separar por lado e tipo
        if (party.side === 'Active' && party.person_type === 'Autor') {
          authors.push(party.name)
        } else if (party.side === 'Passive' && party.person_type === 'Réu') {
          defendants.push(party.name)
        }
      }

      // Normalizar todos os documentos (apenas dígitos)
      const sanitizedDocs = allDocuments
        .map(doc => doc.replace(/\D/g, ''))
        .filter(Boolean)

      // SEMPRE incluir o documento pesquisado
      const allPartiesDocs = Array.from(new Set([...sanitizedDocs, normalizedDoc]))

      // Upsert no banco
      const { error: upsertError } = await supabase.from('processes').upsert({
        cnj_number: processData.code,
        tribunal: processData.tribunal_acronym || 'Desconhecido',
        court_name: processData.courts?.[0]?.name || null,
        distribution_date: processData.distribution_date || null,
        status: processData.status || null,
        phase: processData.phase || null,
        case_value: processData.amount || null,
        parties_cpf_cnpj: allPartiesDocs.length > 0 ? allPartiesDocs : null,
        author_names: authors.length > 0 ? authors : null,
        defendant_names: defendants.length > 0 ? defendants : null,
        last_searched_by: userId,
        source_api: 'judit',
        last_update: new Date().toISOString()
      }, {
        onConflict: 'cnj_number',
        ignoreDuplicates: false
      })

      if (upsertError) {
        console.error(`[JUDiT Hot Storage] Erro ao salvar processo ${processData.code}:`, upsertError)
      }
    }

    console.log('[JUDiT Hot Storage] Busca concluída com sucesso')

    const executionTime = Date.now() - startTime

    return new Response(
      JSON.stringify({
        success: true,
        results_count: allProcesses.length,
        lawsuits: allProcesses.map(p => p.response_data),
        from_cache: true,
        provider: 'judit',
        request_id: requestId,
        all_pages_count: allPagesCount,
        credits_consumed: 0,
        execution_time_ms: executionTime,
        message: `${allProcesses.length} processo(s) encontrado(s) no Hot Storage`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[JUDiT Hot Storage] Erro:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
