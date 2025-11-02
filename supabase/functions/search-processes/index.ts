import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
  distribution_date: string
  status: string
  case_value: number
  judge_name: string
  court_name: string
  phase: string
  author_names: string[]
  defendant_names: string[]
  parties_cpf_cnpj: string[]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { searchType, searchValue, userId }: SearchRequest = await req.json()

    // Validação de entrada
    if (!searchType || !searchValue || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Verificar saldo de créditos do usuário
    const { data: plan, error: planError } = await supabaseClient
      .from('credits_plans')
      .select('credits_balance')
      .eq('user_id', userId)
      .single()

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: 'User plan not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Custo da consulta por tipo (otimizado com cache)
    // Cache da API JUDiT reduz custo significativamente
    const costMap = {
      cpf: 3,  // Reduzido de 5 para 3
      cnpj: 3, // Reduzido de 5 para 3
      oab: 3,  // Reduzido de 5 para 3
      cnj: 2   // Reduzido de 3 para 2
    }
    const creditCost = costMap[searchType]

    if (plan.credits_balance < creditCost) {
      return new Response(
        JSON.stringify({ error: 'Insufficient credits', required: creditCost, available: plan.credits_balance }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Consultar cache no DataLake (tabela processes)
    let cachedProcesses: Process[] = []

    if (searchType === 'cnj') {
      const { data: cached } = await supabaseClient
        .from('processes')
        .select('*')
        .eq('cnj_number', searchValue)
        .gte('last_update', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // menos de 24h

      if (cached && cached.length > 0) {
        cachedProcesses = cached
      }
    } else {
      // Para CPF/CNPJ/OAB, buscar nos campos JSONB
      const { data: cached } = await supabaseClient
        .from('processes')
        .select('*')
        .contains('parties_cpf_cnpj', [searchValue])
        .gte('last_update', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      if (cached && cached.length > 0) {
        cachedProcesses = cached
      }
    }

    let processes: Process[] = cachedProcesses
    let fromCache = cachedProcesses.length > 0

    // 3. Se não estiver no cache ou desatualizado, chamar APIs
    if (!fromCache) {
      // Obter configuração de APIs
      const { data: apiConfigs } = await supabaseClient
        .from('api_configurations')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true })

      if (!apiConfigs || apiConfigs.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No active API configurations found' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Tentar chamar APIs na ordem de prioridade
      for (const apiConfig of apiConfigs) {
        try {
          if (apiConfig.api_name === 'judit') {
            processes = await callJuditAPI(searchType, searchValue, apiConfig.api_key, apiConfig.endpoint_url)
            break // Se sucesso, sair do loop
          } else if (apiConfig.api_name === 'escavador') {
            processes = await callEscavadorAPI(searchType, searchValue, apiConfig.api_key, apiConfig.endpoint_url)
            break
          }
        } catch (error) {
          console.error(`Error calling ${apiConfig.api_name}:`, error)
          // Continuar para próxima API (fallback)
          continue
        }
      }

      // Se nenhuma API retornou dados
      if (processes.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No processes found', from_cache: false }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 4. Salvar/atualizar processos na tabela processes
      for (const process of processes) {
        await supabaseClient
          .from('processes')
          .upsert({
            cnj_number: process.cnj_number,
            tribunal: process.tribunal,
            distribution_date: process.distribution_date,
            status: process.status,
            case_value: process.case_value,
            judge_name: process.judge_name,
            court_name: process.court_name,
            phase: process.phase,
            author_names: process.author_names,
            defendant_names: process.defendant_names,
            parties_cpf_cnpj: process.parties_cpf_cnpj,
            last_update: new Date().toISOString()
          }, { onConflict: 'cnj_number' })
      }
    }

    // 5. Registrar busca em user_searches
    await supabaseClient
      .from('user_searches')
      .insert({
        user_id: userId,
        search_type: searchType,
        search_value: searchValue,
        credits_consumed: fromCache ? 0 : creditCost,
        results_count: processes.length
      })

    // 6. Deduzir créditos (apenas se não foi cache)
    if (!fromCache) {
      // Atualizar saldo
      await supabaseClient
        .from('credits_plans')
        .update({ credits_balance: plan.credits_balance - creditCost })
        .eq('user_id', userId)

      // Registrar transação
      await supabaseClient
        .from('credit_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'consumption',
          operation_type: `Consulta ${searchType.toUpperCase()}`,
          credits_amount: -creditCost,
          description: `Consulta de ${searchType}: ${searchValue}`
        })
    }

    // 7. Retornar processos
    return new Response(
      JSON.stringify({
        success: true,
        from_cache: fromCache,
        credits_consumed: fromCache ? 0 : creditCost,
        results_count: processes.length,
        processes: processes
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in search-processes:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ============================================
// FUNÇÃO AUXILIAR: Chamar API JUDiT
// ============================================
async function callJuditAPI(
  searchType: string,
  searchValue: string,
  apiKey: string,
  baseUrl: string
): Promise<Process[]> {
  console.log(`[JUDiT] Iniciando busca: ${searchType} = ${searchValue}`)

  let endpoint: string
  let requestBody: any

  // Selecionar endpoint correto baseado no tipo de busca
  if (searchType === 'cnj') {
    // Busca por número CNJ - usar endpoint de requisições
    endpoint = `${baseUrl}/requests/requests`
    requestBody = {
      cnj_number: searchValue,
      cache: true // IMPORTANTE: usar cache quando disponível
    }
  } else if (searchType === 'cpf' || searchType === 'cnpj') {
    // Busca por documento - usar endpoint request-document
    endpoint = `${baseUrl}/requests/request-document`
    requestBody = {
      document: searchValue,
      document_type: searchType === 'cpf' ? 'CPF' : 'CNPJ',
      cache: true
    }
  } else if (searchType === 'oab') {
    // Busca por OAB - geralmente precisa UF também
    // Extrair número e UF se formato "123456/SP"
    const oabMatch = searchValue.match(/^(\d+)\/?([A-Z]{2})?$/)
    const oabNumber = oabMatch ? oabMatch[1] : searchValue
    const oabUF = oabMatch && oabMatch[2] ? oabMatch[2] : 'SP' // Default SP se não especificado

    endpoint = `${baseUrl}/requests/request-document`
    requestBody = {
      oab_number: oabNumber,
      oab_state: oabUF,
      cache: true
    }
  } else {
    throw new Error(`Tipo de busca não suportado pela JUDiT: ${searchType}`)
  }

  console.log(`[JUDiT] Endpoint: ${endpoint}`)
  console.log(`[JUDiT] Request body:`, JSON.stringify(requestBody))

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[JUDiT] API error ${response.status}:`, errorText)
    throw new Error(`JUDiT API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log(`[JUDiT] Resposta recebida:`, JSON.stringify(data).substring(0, 200))

  // JUDiT pode retornar diferentes estruturas dependendo do endpoint
  let lawsuits = []

  if (data.lawsuits) {
    lawsuits = data.lawsuits
  } else if (data.data && Array.isArray(data.data)) {
    lawsuits = data.data
  } else if (Array.isArray(data)) {
    lawsuits = data
  } else if (data.lawsuit) {
    lawsuits = [data.lawsuit]
  }

  console.log(`[JUDiT] Processos encontrados: ${lawsuits.length}`)

  // Transformar resposta da JUDiT para formato padronizado
  return lawsuits.map((proc: any) => ({
    cnj_number: proc.lawsuit_number || proc.cnj_number || proc.numero_cnj || '',
    tribunal: proc.court || proc.tribunal || proc.orgao_julgador || '',
    distribution_date: proc.distribution_date || proc.data_distribuicao || proc.filing_date || null,
    status: proc.status || proc.situacao || proc.lawsuit_status || 'Em andamento',
    case_value: parseFloat(proc.case_value || proc.valor_causa || proc.lawsuit_value || 0),
    judge_name: proc.judge || proc.juiz || proc.judge_name || '',
    court_name: proc.court_name || proc.vara || proc.court || '',
    phase: proc.phase || proc.fase || proc.instance || proc.instancia || '',
    author_names: extractNames(proc.plaintiffs || proc.autores || proc.author_names || []),
    defendant_names: extractNames(proc.defendants || proc.reus || proc.defendant_names || []),
    parties_cpf_cnpj: extractDocuments(proc.parties || proc.partes || [])
  }))
}

// Função auxiliar para extrair nomes de estruturas variadas
function extractNames(parties: any): string[] {
  if (Array.isArray(parties)) {
    return parties.map(p => {
      if (typeof p === 'string') return p
      if (p.name) return p.name
      if (p.nome) return p.nome
      return JSON.stringify(p)
    })
  }
  return []
}

// Função auxiliar para extrair documentos (CPF/CNPJ) de partes
function extractDocuments(parties: any): string[] {
  if (Array.isArray(parties)) {
    return parties
      .map(p => p.document || p.cpf_cnpj || p.documento || '')
      .filter(doc => doc !== '')
  }
  return []
}

// ============================================
// FUNÇÃO AUXILIAR: Chamar API Escavador
// ============================================
async function callEscavadorAPI(
  searchType: string,
  searchValue: string,
  apiKey: string,
  baseUrl: string
): Promise<Process[]> {
  console.log(`[Escavador] Iniciando busca: ${searchType} = ${searchValue}`)

  let endpoint: string
  let method = 'POST'
  let requestBody: any = {}

  // Selecionar endpoint correto baseado no tipo de busca
  // Escavador usa busca assíncrona que é mais econômica
  if (searchType === 'cnj') {
    // Busca por número de processo (assíncrona)
    endpoint = `${baseUrl}/v1/pesquisas/processo`
    requestBody = {
      numero_processo: searchValue
    }
  } else if (searchType === 'cpf' || searchType === 'cnpj') {
    // Busca por CPF/CNPJ (assíncrona)
    endpoint = `${baseUrl}/v1/pesquisas/cpf-cnpj`
    requestBody = {
      cpf_cnpj: searchValue
    }
  } else if (searchType === 'oab') {
    // Busca por OAB (assíncrona)
    // Extrair número e UF se formato "123456/SP"
    const oabMatch = searchValue.match(/^(\d+)\/?([A-Z]{2})?$/)
    const oabNumber = oabMatch ? oabMatch[1] : searchValue
    const oabUF = oabMatch && oabMatch[2] ? oabMatch[2] : 'SP'

    endpoint = `${baseUrl}/v1/pesquisas/oab`
    requestBody = {
      oab: oabNumber,
      uf: oabUF
    }
  } else {
    throw new Error(`Tipo de busca não suportado pelo Escavador: ${searchType}`)
  }

  console.log(`[Escavador] Endpoint: ${endpoint}`)
  console.log(`[Escavador] Request body:`, JSON.stringify(requestBody))

  // Iniciar busca assíncrona
  const searchResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })

  if (!searchResponse.ok) {
    const errorText = await searchResponse.text()
    console.error(`[Escavador] API error ${searchResponse.status}:`, errorText)
    throw new Error(`Escavador API error: ${searchResponse.status} - ${errorText}`)
  }

  const searchData = await searchResponse.json()
  console.log(`[Escavador] Busca iniciada:`, JSON.stringify(searchData))

  // Escavador retorna um ID de busca assíncrona
  const searchId = searchData.id || searchData.busca_id || searchData.search_id

  if (!searchId) {
    console.error(`[Escavador] ID de busca não encontrado na resposta`)
    throw new Error('Escavador: ID de busca não retornado')
  }

  // Aguardar resultado (com retry)
  const maxAttempts = 10
  const retryDelay = 2000 // 2 segundos

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[Escavador] Tentativa ${attempt}/${maxAttempts} - Consultando resultado...`)

    // Aguardar antes de consultar
    await new Promise(resolve => setTimeout(resolve, retryDelay))

    const resultResponse = await fetch(`${baseUrl}/v1/buscas-assincronas/${searchId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Accept': 'application/json'
      }
    })

    if (!resultResponse.ok) {
      console.error(`[Escavador] Erro ao consultar resultado: ${resultResponse.status}`)
      continue
    }

    const resultData = await resultResponse.json()
    const status = resultData.status || resultData.situacao

    console.log(`[Escavador] Status da busca: ${status}`)

    if (status === 'completed' || status === 'concluida' || status === 'finalizada') {
      // Busca concluída, processar resultados
      const processes = resultData.processos || resultData.results || resultData.data || []

      console.log(`[Escavador] Processos encontrados: ${processes.length}`)

      // Transformar resposta do Escavador para formato padronizado
      return processes.map((proc: any) => ({
        cnj_number: proc.numero_processo || proc.cnj || proc.numero_cnj || '',
        tribunal: proc.tribunal || proc.court || '',
        distribution_date: proc.data_inicio || proc.data_distribuicao || proc.distribution_date || null,
        status: proc.status || proc.situacao || 'Em andamento',
        case_value: parseFloat(proc.valor || proc.valor_causa || proc.case_value || 0),
        judge_name: proc.juiz || proc.judge || '',
        court_name: proc.comarca || proc.vara || proc.court_name || '',
        phase: proc.instancia || proc.fase || proc.instance || '',
        author_names: extractNames(proc.partes_ativas || proc.authors || proc.plaintiffs || []),
        defendant_names: extractNames(proc.partes_passivas || proc.defendants || []),
        parties_cpf_cnpj: extractDocuments(proc.partes || proc.parties || [])
      }))
    } else if (status === 'error' || status === 'erro' || status === 'failed') {
      throw new Error(`Escavador: Busca falhou - ${resultData.erro || resultData.error || 'Erro desconhecido'}`)
    }

    // Status ainda é 'pending' ou 'processando', continuar tentando
  }

  // Se chegou aqui, excedeu o número de tentativas
  console.error(`[Escavador] Timeout: busca não concluída após ${maxAttempts} tentativas`)
  throw new Error('Escavador: Timeout ao aguardar resultado da busca')
}
