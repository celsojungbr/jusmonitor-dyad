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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function fetchProcessDetailsFromJudit(cnjNumber: string, apiKey: string, baseUrl: string) {
  const response = await fetch(`${baseUrl}/v1/process/${cnjNumber}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) throw new Error(`JUDiT API error: ${response.status}`)

  const data = await response.json()

  return {
    cnj_number: data.numero_cnj,
    tribunal: data.tribunal,
    distribution_date: data.data_distribuicao,
    status: data.situacao,
    case_value: data.valor_causa || 0,
    judge_name: data.juiz,
    court_name: data.vara,
    phase: data.fase,
    author_names: data.autores || [],
    defendant_names: data.reus || [],
    parties_cpf_cnpj: data.documentos_partes || []
  }
}

async function fetchProcessDetailsFromEscavador(cnjNumber: string, apiKey: string, baseUrl: string) {
  const response = await fetch(`${baseUrl}/api/v2/processos/${cnjNumber}`, {
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) throw new Error(`Escavador API error: ${response.status}`)

  const data = await response.json()

  return {
    cnj_number: data.numero_processo,
    tribunal: data.tribunal,
    distribution_date: data.data_inicio,
    status: data.status,
    case_value: data.valor || 0,
    judge_name: data.juiz || '',
    court_name: data.comarca || '',
    phase: data.instancia || '',
    author_names: data.partes_ativas || [],
    defendant_names: data.partes_passivas || [],
    parties_cpf_cnpj: data.documentos || []
  }
}
