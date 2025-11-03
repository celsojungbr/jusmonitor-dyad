import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessDetailsRequest {
  cnjNumber: string
  userId: string
}

serve(async (req) => {
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

    const { cnjNumber, userId }: ProcessDetailsRequest = await req.json()

    if (!cnjNumber || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Buscar processo no DataLake
    const { data: process, error: processError } = await supabaseClient
      .from('processes')
      .select('*')
      .eq('cnj_number', cnjNumber)
      .single()

    if (processError && processError.code !== 'PGRST116') {
      throw processError
    }

    let processData = process
    let fromCache = !!process

    // 2. Se não existir ou desatualizado (>24h), chamar APIs
    const isOutdated = process && new Date(process.last_update).getTime() < Date.now() - 24 * 60 * 60 * 1000

    if (!process || isOutdated) {
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

      // Tentar chamar APIs
      for (const apiConfig of apiConfigs) {
        try {
          if (apiConfig.api_name === 'judit') {
            processData = await fetchProcessDetailsFromJudit(cnjNumber, apiConfig.api_key, apiConfig.endpoint_url)
            break
          } else if (apiConfig.api_name === 'escavador') {
            processData = await fetchProcessDetailsFromEscavador(cnjNumber, apiConfig.api_key, apiConfig.endpoint_url)
            break
          }
        } catch (error) {
          console.error(`Error calling ${apiConfig.api_name}:`, error)
          continue
        }
      }

      if (!processData) {
        return new Response(
          JSON.stringify({ error: 'Process not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Salvar/atualizar processo
      const { data: savedProcess } = await supabaseClient
        .from('processes')
        .upsert({
          ...processData,
          last_update: new Date().toISOString()
        }, { onConflict: 'cnj_number' })
        .select()
        .single()

      processData = savedProcess || processData
      fromCache = false
    }

    // 3. Buscar movimentações
    const { data: movements } = await supabaseClient
      .from('process_movements')
      .select('*')
      .eq('process_id', processData.id)
      .order('movement_date', { ascending: false })

    // 4. Buscar anexos
    const { data: attachments } = await supabaseClient
      .from('process_attachments')
      .select('*')
      .eq('process_id', processData.id)
      .order('filing_date', { ascending: false })

    // 5. Verificar se usuário já tem acesso ao processo
    const { data: userProcess } = await supabaseClient
      .from('user_processes')
      .select('*')
      .eq('user_id', userId)
      .eq('process_id', processData.id)
      .single()

    // 6. Se usuário não tem acesso, cobrar créditos (3 créditos por processo)
    const creditCost = 3

    if (!userProcess) {
      // Verificar saldo
      const { data: plan } = await supabaseClient
        .from('credits_plans')
        .select('credits_balance')
        .eq('user_id', userId)
        .single()

      if (!plan || plan.credits_balance < creditCost) {
        return new Response(
          JSON.stringify({
            error: 'Insufficient credits',
            required: creditCost,
            available: plan?.credits_balance || 0
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Deduzir créditos
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
          operation_type: 'Acesso a Processo',
          credits_amount: -creditCost,
          description: `Acesso ao processo ${cnjNumber}`
        })

      // Criar vínculo user_processes
      await supabaseClient
        .from('user_processes')
        .insert({
          user_id: userId,
          process_id: processData.id,
          access_cost_credits: creditCost
        })
    }

    // 7. Retornar dados completos
    return new Response(
      JSON.stringify({
        success: true,
        from_cache: fromCache,
        credits_consumed: userProcess ? 0 : creditCost,
        process: processData,
        movements: movements || [],
        attachments: attachments || []
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in get-process-details:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function fetchProcessDetailsFromJudit(cnjNumber: string, apiKey: string, baseUrl: string) {
  console.log(`[JUDiT] Buscando detalhes do processo: ${cnjNumber}`)

  // Usar endpoint correto para buscar processo por CNJ com cache habilitado
  const endpoint = `${baseUrl}/requests/requests`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      cnj_number: cnjNumber,
      cache: true, // IMPORTANTE: usar cache
      include_movements: true, // Incluir movimentações
      include_documents: true  // Incluir documentos/anexos
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[JUDiT] API error ${response.status}:`, errorText)
    throw new Error(`JUDiT API error: ${response.status}`)
  }

  const data = await response.json()
  console.log(`[JUDiT] Resposta recebida para ${cnjNumber}`)

  // JUDiT pode retornar diferentes estruturas
  const lawsuit = data.lawsuit || data.data || data

  return {
    cnj_number: lawsuit.lawsuit_number || lawsuit.cnj_number || lawsuit.numero_cnj || cnjNumber,
    tribunal: lawsuit.court || lawsuit.tribunal || lawsuit.orgao_julgador || '',
    distribution_date: lawsuit.distribution_date || lawsuit.data_distribuicao || lawsuit.filing_date || null,
    status: lawsuit.status || lawsuit.situacao || lawsuit.lawsuit_status || 'Em andamento',
    case_value: parseFloat(lawsuit.case_value || lawsuit.valor_causa || lawsuit.lawsuit_value || 0),
    judge_name: lawsuit.judge || lawsuit.juiz || lawsuit.judge_name || '',
    court_name: lawsuit.court_name || lawsuit.vara || lawsuit.court || '',
    phase: lawsuit.phase || lawsuit.fase || lawsuit.instance || lawsuit.instancia || '',
    author_names: extractNames(lawsuit.plaintiffs || lawsuit.autores || lawsuit.author_names || []),
    defendant_names: extractNames(lawsuit.defendants || lawsuit.reus || lawsuit.defendant_names || []),
    parties_cpf_cnpj: extractDocuments(lawsuit.parties || lawsuit.partes || [])
  }
}

// Funções auxiliares (compartilhadas)
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

function extractDocuments(parties: any): string[] {
  if (Array.isArray(parties)) {
    return parties
      .map(p => p.document || p.cpf_cnpj || p.documento || '')
      .filter(doc => doc !== '')
  }
  return []
}

async function fetchProcessDetailsFromEscavador(cnjNumber: string, apiKey: string, baseUrl: string) {
  console.log(`[Escavador] Buscando detalhes do processo: ${cnjNumber}`)

  // Usar busca assíncrona (mais econômica)
  const searchEndpoint = `${baseUrl}/v1/pesquisas/processo`

  const searchResponse = await fetch(searchEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      numero_processo: cnjNumber
    })
  })

  if (!searchResponse.ok) {
    const errorText = await searchResponse.text()
    console.error(`[Escavador] API error ${searchResponse.status}:`, errorText)
    throw new Error(`Escavador API error: ${searchResponse.status}`)
  }

  const searchData = await searchResponse.json()
  const searchId = searchData.id || searchData.busca_id || searchData.search_id

  if (!searchId) {
    throw new Error('Escavador: ID de busca não retornado')
  }

  // Aguardar resultado (com retry)
  const maxAttempts = 10
  const retryDelay = 2000

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, retryDelay))

    const resultResponse = await fetch(`${baseUrl}/v1/buscas-assincronas/${searchId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Accept': 'application/json'
      }
    })

    if (!resultResponse.ok) continue

    const resultData = await resultResponse.json()
    const status = resultData.status || resultData.situacao

    if (status === 'completed' || status === 'concluida' || status === 'finalizada') {
      const processo = resultData.processo || resultData.data || resultData

      return {
        cnj_number: processo.numero_processo || processo.cnj || processo.numero_cnj || cnjNumber,
        tribunal: processo.tribunal || processo.court || '',
        distribution_date: processo.data_inicio || processo.data_distribuicao || processo.distribution_date || null,
        status: processo.status || processo.situacao || 'Em andamento',
        case_value: parseFloat(processo.valor || processo.valor_causa || processo.case_value || 0),
        judge_name: processo.juiz || processo.judge || '',
        court_name: processo.comarca || processo.vara || processo.court_name || '',
        phase: processo.instancia || processo.fase || processo.instance || '',
        author_names: extractNames(processo.partes_ativas || processo.authors || processo.plaintiffs || []),
        defendant_names: extractNames(processo.partes_passivas || processo.defendants || []),
        parties_cpf_cnpj: extractDocuments(processo.partes || processo.parties || [])
      }
    } else if (status === 'error' || status === 'erro' || status === 'failed') {
      throw new Error(`Escavador: Busca falhou - ${resultData.erro || resultData.error}`)
    }
  }

  throw new Error('Escavador: Timeout ao aguardar resultado da busca')
}
