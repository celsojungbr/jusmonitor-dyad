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

    // Chamar API /lawsuits (síncrona, retorna status e phase diretamente)
    const requestPayload = {
      search: {
        search_type: searchType,
        search_key: normalizedDoc,
        search_params: {
          masked_response: false
        }
      },
      process_status: true  // ⭐ Obter status e phase dos processos
    }

    console.log('[JUDiT Hot Storage] Chamando API /lawsuits...')

    const lawsuitsResponse = await fetch(
      'https://lawsuits.production.judit.io/lawsuits',
      {
        method: 'POST',
        headers: {
          'api-key': JUDIT_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      }
    )

    if (!lawsuitsResponse.ok) {
      const errorText = await lawsuitsResponse.text()
      console.error('[JUDiT Hot Storage] Erro:', lawsuitsResponse.status, errorText)

      if (lawsuitsResponse.status === 401) {
        return new Response(
          JSON.stringify({ error: 'API Key inválida ou não autorizada' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (lawsuitsResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Sem créditos disponíveis na API JUDiT' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ error: `Erro na API: ${errorText}` }),
        { status: lawsuitsResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const lawsuitsData = await lawsuitsResponse.json()

    console.log('[JUDiT Hot Storage] Resposta recebida:', {
      has_lawsuits: lawsuitsData.has_lawsuits,
      total: lawsuitsData.response_data?.length || 0
    })

    // Verificar se encontrou processos
    if (!lawsuitsData.has_lawsuits || !lawsuitsData.response_data || lawsuitsData.response_data.length === 0) {
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
          message: 'Nenhum processo encontrado no Hot Storage'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const allProcesses = lawsuitsData.response_data

    console.log('[JUDiT Hot Storage] Total de processos encontrados:', allProcesses.length)

    // Logar primeiro processo para verificar status e phase
    if (allProcesses.length > 0) {
      console.log('[JUDiT Hot Storage] === PRIMEIRO PROCESSO ===')
      console.log('[JUDiT Hot Storage] CNJ:', allProcesses[0].code)
      console.log('[JUDiT Hot Storage] Status:', allProcesses[0].status)
      console.log('[JUDiT Hot Storage] Phase:', allProcesses[0].phase)
      console.log('[JUDiT Hot Storage] Parties:', allProcesses[0].parties?.length)
    }

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

    // Persistir processos no banco
    console.log('[JUDiT Hot Storage] Persistindo processos no banco...')

    for (const processData of allProcesses) {
      if (!processData.code) continue

      // LOGGING: Estrutura de cada processo antes de processar
      console.log(`[JUDiT Hot Storage] Processando CNJ ${processData.code}:`, {
        has_status: !!processData.status,
        status_value: processData.status,
        has_phase: !!processData.phase,
        phase_value: processData.phase,
        parties_count: processData.parties?.length || 0
      })

      // Extrair partes E advogados separadamente
      const authors: string[] = []
      const defendants: string[] = []
      const authorLawyers: Array<{name: string, oab?: string}> = []
      const defendantLawyers: Array<{name: string, oab?: string}> = []
      const allDocuments: string[] = []

      for (const party of processData.parties || []) {
        // Capturar documento das PARTES (não advogados)
        if (party.document && party.person_type !== 'Advogado') {
          allDocuments.push(party.document)
        }
        
        // CASO 1: Party é advogado direto (person_type = "Advogado")
        if (party.person_type === 'Advogado') {
          const lawyerInfo = {
            name: party.name,
            oab: party.name.match(/OAB\s*[\d\w\/-]+/i)?.[0]
          }
          
          if (party.side === 'Active') {
            authorLawyers.push(lawyerInfo)
          } else if (party.side === 'Passive') {
            defendantLawyers.push(lawyerInfo)
          }
          continue  // Não adicionar advogado como parte
        }
        
        // CASO 2: Party é parte real (Autor/Réu)
        if (party.person_type === 'Autor') {
          authors.push(party.name)
        } else if (party.person_type === 'Réu') {
          defendants.push(party.name)
        }
        
        // CASO 3: Extrair advogados do array lawyers dentro da party
        if (party.lawyers && party.lawyers.length > 0) {
          for (const lawyer of party.lawyers) {
            const lawyerInfo = {
              name: lawyer.name,
              oab: lawyer.name.match(/OAB\s*[\d\w\/-]+/i)?.[0]
            }
            
            if (party.side === 'Active') {
              authorLawyers.push(lawyerInfo)
            } else if (party.side === 'Passive') {
              defendantLawyers.push(lawyerInfo)
            }
          }
        }
      }

      // Remover duplicatas
      const uniqueAuthors = Array.from(new Set(authors))
      const uniqueDefendants = Array.from(new Set(defendants))
      const uniqueAuthorLawyers = Array.from(
        new Set(authorLawyers.map(l => JSON.stringify(l)))
      ).map(s => JSON.parse(s))
      const uniqueDefendantLawyers = Array.from(
        new Set(defendantLawyers.map(l => JSON.stringify(l)))
      ).map(s => JSON.parse(s))

      // Normalizar documentos e SEMPRE incluir o CPF pesquisado
      const sanitizedDocs = allDocuments
        .map(doc => doc.replace(/\D/g, ''))
        .filter(Boolean)
      const allPartiesDocs = Array.from(new Set([...sanitizedDocs, normalizedDoc]))

      // Upsert no banco
      const { error: upsertError } = await supabase.from('processes').upsert({
        cnj_number: processData.code,
        tribunal: processData.tribunal_acronym || 'Desconhecido',
        court_name: processData.courts?.[0]?.name || null,
        distribution_date: processData.distribution_date || null,
        status: processData.status || null,  // Status real da API
        phase: processData.phase || null,    // Fase real da API
        case_value: processData.amount || null,
        parties_cpf_cnpj: allPartiesDocs.length > 0 ? allPartiesDocs : null,
        author_names: uniqueAuthors.length > 0 ? uniqueAuthors : null,
        defendant_names: uniqueDefendants.length > 0 ? uniqueDefendants : null,
        author_lawyers: uniqueAuthorLawyers.length > 0 ? uniqueAuthorLawyers : null,
        defendant_lawyers: uniqueDefendantLawyers.length > 0 ? uniqueDefendantLawyers : null,
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
        lawsuits: allProcesses,
        from_cache: true,
        provider: 'judit',
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
