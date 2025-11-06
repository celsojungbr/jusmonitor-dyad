/**
 * Escavador - Consulta CPF/CNPJ
 * Body esperado: { document: string, userId: string }
 *
 * Fluxo:
 * 1) Valida Authorization header (apenas presença do token)
 * 2) Valida CPF/CNPJ
 * 3) Lê custo em créditos de pricing_config (operation_name='consulta') ou usa 8 por padrão
 * 4) Valida saldo do usuário
 * 5) Chama API do Escavador com ESCAVADOR_API_KEY
 * 6) Normaliza itens e grava (opcionalmente) processos no DataLake
 * 7) Registra user_searches e debita créditos em credits_plans + credit_transactions
 * 8) Retorna { success, results_count, items, provider: 'escavador' }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    ...init,
  })
}

function onlyDigits(value: string): string {
  return (value || '').replace(/\D/g, '')
}

function isCpf(doc: string): boolean {
  return /^\d{11}$/.test(doc)
}

function isCnpj(doc: string): boolean {
  return /^\d{14}$/.test(doc)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Autenticação manual (verify_jwt=false por padrão)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase env variables')
      return jsonResponse({ error: 'Server misconfiguration: SUPABASE envs missing' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const body = await req.json().catch(() => null) as { document?: string; userId?: string } | null
    if (!body || !body.document || !body.userId) {
      return jsonResponse({ error: 'Parâmetros ausentes: document e userId são obrigatórios' }, { status: 400 })
    }

    const doc = onlyDigits(body.document)
    const userId = body.userId
    const searchType = isCpf(doc) ? 'cpf' : isCnpj(doc) ? 'cnpj' : null
    if (!searchType) {
      return jsonResponse({ error: 'Documento inválido. Informe um CPF (11 dígitos) ou CNPJ (14 dígitos).' }, { status: 400 })
    }

    // Buscar custo em créditos da operação "consulta"
    let creditsCost = 8
    {
      const { data: pricing } = await supabase
        .from('pricing_config')
        .select('credits_cost,is_active')
        .eq('operation_name', 'consulta')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()

      if (pricing?.credits_cost && typeof pricing.credits_cost === 'number') {
        creditsCost = pricing.credits_cost
      }
    }

    // Verificar saldo do usuário
    const { data: plan, error: planError } = await supabase
      .from('credits_plans')
      .select('credits_balance, credit_cost')
      .eq('user_id', userId)
      .single()

    if (planError) {
      console.error('Erro ao buscar plano do usuário:', planError.message)
      return jsonResponse({ error: 'Plano de créditos não encontrado' }, { status: 404 })
    }

    if ((plan?.credits_balance ?? 0) < creditsCost) {
      return jsonResponse(
        { error: 'Créditos insuficientes', required: creditsCost, available: plan?.credits_balance ?? 0 },
        { status: 402 }
      )
    }

    // Ler secret da Escavador
    const escavadorApiKey = Deno.env.get('ESCAVADOR_API_KEY')
    if (!escavadorApiKey) {
      console.error('ESCAVADOR_API_KEY não configurada nos secrets do Supabase')
      return jsonResponse({ error: 'ESCAVADOR_API_KEY não configurada' }, { status: 500 })
    }

    // Opcional: buscar endpoint da tabela api_configuration; senão usar um default
    let endpointUrl: string | null = null
    {
      const { data: cfg } = await supabase
        .from('api_configuration')
        .select('endpoint_url,is_active')
        .eq('api_name', 'escavador')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()
      endpointUrl = cfg?.endpoint_url ?? null
    }
    // Fallback genérico (ajuste se necessário no painel Admin APIs)
    if (!endpointUrl) {
      // Endpoint fictício — você pode configurar o URL correto em api_configuration
      endpointUrl = 'https://api.escavador.com/v2/processes/search'
    }

    // Chamada à API Escavador
    const url = `${endpointUrl}?document=${doc}`
    const apiResp = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${escavadorApiKey}`,
        'Accept': 'application/json',
      }
    })

    if (!apiResp.ok) {
      const errText = await apiResp.text().catch(() => '')
      console.error('Erro Escavador:', apiResp.status, errText)
      return jsonResponse(
        { error: `Escavador API error (${apiResp.status})`, details: errText },
        { status: 502 }
      )
    }

    const raw = await apiResp.json().catch(() => ({}))

    // Normalização de items para o frontend atual (Consultas.ts espera "items" com campos específicos)
    const normalizeItem = (x: any) => {
      // Tenta mapear campos comuns; se não existirem mantém mínimos
      const numero_cnj = x.numero_cnj ?? x.cnj ?? x.cnj_number ?? x.numero ?? null
      const fonteSigla = x.fontes?.[0]?.sigla ?? x.tribunal?.sigla ?? x.tribunal ?? null
      const fonteNome = x.fontes?.[0]?.nome ?? x.court_name ?? null
      const statusPredito = x.fontes?.[0]?.status_predito ?? x.status ?? x.capa?.situacao ?? null
      const dataInicio = x.data_inicio ?? x.distribution_date ?? null
      const tituloAtivo = x.titulo_polo_ativo ?? (Array.isArray(x.autores) ? x.autores[0] : null) ?? null
      const tituloPassivo = x.titulo_polo_passivo ?? (Array.isArray(x.reus) ? x.reus[0] : null) ?? null

      return {
        numero_cnj,
        data_inicio: dataInicio,
        titulo_polo_ativo: tituloAtivo ?? undefined,
        titulo_polo_passivo: tituloPassivo ?? undefined,
        fontes: [
          {
            sigla: fonteSigla ?? 'Desconhecido',
            nome: fonteNome ?? undefined,
            status_predito: statusPredito ?? undefined,
            capa: {
              situacao: statusPredito ?? undefined
            }
          }
        ]
      }
    }

    let items: any[] = []
    if (Array.isArray(raw?.items)) {
      items = raw.items.map(normalizeItem)
    } else if (Array.isArray(raw?.processes)) {
      items = raw.processes.map(normalizeItem)
    } else if (Array.isArray(raw?.results)) {
      items = raw.results.map(normalizeItem)
    } else if (raw && typeof raw === 'object') {
      const possible = raw?.data ?? raw?.result ?? raw?.list
      if (Array.isArray(possible)) items = possible.map(normalizeItem)
    }

    const resultsCount = items.length

    // Gravar user_searches
    await supabase
      .from('user_searches')
      .insert({
        user_id: userId,
        search_type: searchType,
        search_value: doc,
        credits_consumed: creditsCost,
        results_count: resultsCount,
        from_cache: false,
        api_used: 'escavador'
      })

    // Debitar créditos
    const newBalance = (plan?.credits_balance ?? 0) - creditsCost
    await supabase
      .from('credits_plans')
      .update({ credits_balance: newBalance })
      .eq('user_id', userId)

    // Registrar transação de consumo
    const reaisCost = creditsCost * (plan?.credit_cost ?? 1.0)
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        transaction_type: 'consumption',
        operation_type: 'consulta',
        credits_amount: creditsCost,
        cost_in_reais: reaisCost,
        description: `Consulta processual (${searchType.toUpperCase()}) via Escavador`
      })

    // Opcional: persistir processos básicos no DataLake (para histórico posterior)
    if (resultsCount > 0) {
      for (const item of items.slice(0, 200)) { // evita inserir demais
        const cnjNumber = item.numero_cnj
        if (!cnjNumber) continue

        // Verifica se já existe
        const { data: existing } = await supabase
          .from('processes')
          .select('id')
          .eq('cnj_number', cnjNumber)
          .limit(1)
          .maybeSingle()

        const payload: any = {
          cnj_number: cnjNumber,
          tribunal: item.fontes?.[0]?.sigla ?? 'Desconhecido',
          court_name: item.fontes?.[0]?.nome ?? null,
          distribution_date: item.data_inicio ?? null,
          status: item.fontes?.[0]?.status_predito ?? item.fontes?.[0]?.capa?.situacao ?? null,
          author_names: item.titulo_polo_ativo ? [String(item.titulo_polo_ativo)] : [],
          defendant_names: item.titulo_polo_passivo ? [String(item.titulo_polo_passivo)] : [],
          parties_cpf_cnpj: [doc],
          last_update: new Date().toISOString(),
        }

        if (existing?.id) {
          await supabase
            .from('processes')
            .update(payload)
            .eq('id', existing.id)
        } else {
          await supabase
            .from('processes')
            .insert(payload)
        }
      }
    }

    return jsonResponse({
      success: true,
      provider: 'escavador',
      results_count: resultsCount,
      items,
    }, { status: 200 })
  } catch (err) {
    console.error('Unhandled error in escavador_consulta_CPF_CNPJ:', err)
    const msg = err instanceof Error ? err.message : String(err)
    return jsonResponse({ error: msg }, { status: 500 })
  }
})