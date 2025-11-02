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

    // Custo da consulta por tipo
    const costMap = {
      cpf: 5,
      cnpj: 5,
      oab: 5,
      cnj: 3
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
  // Baseado na documentação JUDiT em /docs/API_JUDiT.md
  const endpoint = `${baseUrl}/v1/search`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      search_type: searchType,
      search_value: searchValue
    })
  })

  if (!response.ok) {
    throw new Error(`JUDiT API error: ${response.status}`)
  }

  const data = await response.json()

  // Transformar resposta da JUDiT para formato padronizado
  return data.processes.map((proc: any) => ({
    cnj_number: proc.numero_cnj,
    tribunal: proc.tribunal,
    distribution_date: proc.data_distribuicao,
    status: proc.situacao,
    case_value: proc.valor_causa || 0,
    judge_name: proc.juiz,
    court_name: proc.vara,
    phase: proc.fase,
    author_names: proc.autores || [],
    defendant_names: proc.reus || [],
    parties_cpf_cnpj: proc.documentos_partes || []
  }))
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
  // Baseado na documentação Escavador em /docs/API_Escavador.md
  const endpoint = `${baseUrl}/api/v2/busca`

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json'
    },
    // Query params baseados no tipo de busca
  })

  if (!response.ok) {
    throw new Error(`Escavador API error: ${response.status}`)
  }

  const data = await response.json()

  // Transformar resposta do Escavador para formato padronizado
  return data.results.map((proc: any) => ({
    cnj_number: proc.numero_processo,
    tribunal: proc.tribunal,
    distribution_date: proc.data_inicio,
    status: proc.status,
    case_value: proc.valor || 0,
    judge_name: proc.juiz || '',
    court_name: proc.comarca || '',
    phase: proc.instancia || '',
    author_names: proc.partes_ativas || [],
    defendant_names: proc.partes_passivas || [],
    parties_cpf_cnpj: proc.documentos || []
  }))
}
