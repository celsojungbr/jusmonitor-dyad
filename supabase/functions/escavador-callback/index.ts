import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { validateEscavadorCallbackComplete } from '../_shared/callback-validator.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()
  let callbackLogId: string | null = null

  try {
    console.log('[Escavador Callback] Recebendo callback...')

    // Criar cliente Supabase com SERVICE_ROLE
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // 1. Ler body
    const body = await req.text()
    console.log('[Escavador Callback] Body recebido:', body.substring(0, 200))

    // Parse JSON
    let callbackData: any
    try {
      callbackData = JSON.parse(body)
    } catch (error) {
      console.error('[Escavador Callback] Erro ao parsear JSON:', error)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Validar token
    const expectedToken = Deno.env.get('ESCAVADOR_CALLBACK_TOKEN') ?? Deno.env.get('ESCAVADOR_API_KEY') ?? ''
    const receivedToken = callbackData.token

    const validation = validateEscavadorCallbackComplete(
      receivedToken,
      callbackData.timestamp || callbackData.data_hora || Date.now(),
      expectedToken
    )

    // 3. Criar log do callback
    const { data: logData } = await supabaseClient
      .from('callback_logs')
      .insert({
        api_provider: 'escavador',
        tracking_id: callbackData.monitoramento_id || callbackData.id,
        event_type: callbackData.tipo || callbackData.type || callbackData.evento || 'unknown',
        payload: callbackData,
        is_valid: validation.isValid,
        processing_status: 'pending'
      })
      .select('id')
      .single()

    callbackLogId = logData?.id

    // 4. Se inválido, retornar 403
    if (!validation.isValid) {
      console.error('[Escavador Callback] Validação falhou:', validation.error)

      await supabaseClient
        .from('callback_logs')
        .update({
          processing_status: 'failed',
          error_message: validation.error,
          processed_at: new Date().toISOString()
        })
        .eq('id', callbackLogId)

      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Atualizar log para "processing"
    if (callbackLogId) {
      await supabaseClient
        .from('callback_logs')
        .update({ processing_status: 'processing' })
        .eq('id', callbackLogId)
    }

    // 6. Processar evento
    const eventType = callbackData.tipo || callbackData.type || callbackData.evento
    const monitoramentoId = callbackData.monitoramento_id || callbackData.id

    console.log(`[Escavador Callback] Processando evento: ${eventType}, monitoramento_id: ${monitoramentoId}`)

    // Buscar monitoramento relacionado
    // Escavador pode usar número do processo ou ID do monitoramento
    let monitoring: any = null

    if (monitoramentoId) {
      const { data } = await supabaseClient
        .from('monitorings')
        .select('*')
        .eq('tracking_id', monitoramentoId)
        .single()

      monitoring = data
    }

    // Se não encontrou por tracking_id, buscar por número do processo
    if (!monitoring && callbackData.numero_processo) {
      const { data } = await supabaseClient
        .from('monitorings')
        .select('*')
        .eq('monitoring_value', callbackData.numero_processo)
        .eq('monitoring_type', 'cnj')
        .eq('status', 'active')
        .limit(1)
        .single()

      monitoring = data
    }

    if (!monitoring) {
      console.warn(`[Escavador Callback] Monitoramento não encontrado`)

      await supabaseClient
        .from('callback_logs')
        .update({
          processing_status: 'failed',
          error_message: 'Monitoring not found',
          processed_at: new Date().toISOString()
        })
        .eq('id', callbackLogId)

      return new Response(
        JSON.stringify({ error: 'Monitoring not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Atualizar log com monitoring_id
    if (callbackLogId) {
      await supabaseClient
        .from('callback_logs')
        .update({ monitoring_id: monitoring.id })
        .eq('id', callbackLogId)
    }

    let alertsCreated = 0

    // Processar baseado no tipo de evento
    // Ver: https://api.escavador.com/v1/docs/#callback

    if (eventType === 'novo_andamento' || eventType === 'new_movement') {
      // Novo andamento no site do tribunal
      const andamento = callbackData.andamento || callbackData.movement

      console.log(`[Escavador Callback] Novo andamento: ${andamento?.descricao || andamento?.description}`)

      await supabaseClient
        .from('monitoring_alerts')
        .insert({
          monitoring_id: monitoring.id,
          alert_type: 'new_movement',
          alert_data: andamento,
          is_read: false
        })

      await supabaseClient
        .from('notifications')
        .insert({
          user_id: monitoring.user_id,
          notification_type: 'monitoring',
          title: `Novo andamento: ${callbackData.numero_processo || monitoring.monitoring_value}`,
          content: andamento?.descricao || andamento?.description || 'Novo andamento processual',
          is_read: false,
          link_to: monitoring.process_id ? `/processos/${monitoring.process_id}` : null
        })

      alertsCreated++

    } else if (eventType === 'novo_processo' || eventType === 'processo_encontrado') {
      // Novo processo encontrado
      const processo = callbackData.processo || callbackData.process

      console.log(`[Escavador Callback] Novo processo: ${processo?.numero_processo || callbackData.numero_processo}`)

      await supabaseClient
        .from('monitoring_alerts')
        .insert({
          monitoring_id: monitoring.id,
          alert_type: 'new_process',
          alert_data: processo || callbackData,
          is_read: false
        })

      await supabaseClient
        .from('notifications')
        .insert({
          user_id: monitoring.user_id,
          notification_type: 'monitoring',
          title: `Novo processo encontrado`,
          content: `Processo ${processo?.numero_processo || callbackData.numero_processo || 'sem número'} encontrado`,
          is_read: false
        })

      alertsCreated++

      // Salvar no DataLake
      if (processo?.numero_processo || callbackData.numero_processo) {
        await supabaseClient
          .from('processes')
          .upsert({
            cnj_number: processo?.numero_processo || callbackData.numero_processo,
            tribunal: processo?.tribunal || callbackData.tribunal || '',
            distribution_date: processo?.data_inicio || null,
            status: processo?.status || 'Em andamento',
            case_value: parseFloat(processo?.valor || 0),
            judge_name: processo?.juiz || '',
            court_name: processo?.comarca || '',
            phase: processo?.instancia || '',
            author_names: processo?.partes_ativas || [],
            defendant_names: processo?.partes_passivas || [],
            parties_cpf_cnpj: [],
            last_update: new Date().toISOString()
          }, { onConflict: 'cnj_number' })
      }

    } else if (eventType === 'processo_arquivado') {
      // Processo arquivado
      console.log(`[Escavador Callback] Processo arquivado: ${callbackData.numero_processo}`)

      await supabaseClient
        .from('monitoring_alerts')
        .insert({
          monitoring_id: monitoring.id,
          alert_type: 'process_archived',
          alert_data: callbackData,
          is_read: false
        })

      await supabaseClient
        .from('notifications')
        .insert({
          user_id: monitoring.user_id,
          notification_type: 'monitoring',
          title: `Processo arquivado`,
          content: `O processo ${callbackData.numero_processo} foi arquivado`,
          is_read: false,
          link_to: monitoring.process_id ? `/processos/${monitoring.process_id}` : null
        })

      alertsCreated++

    } else if (eventType === 'segredo_de_justica') {
      // Processo entrou ou saiu de segredo de justiça
      const status = callbackData.em_segredo_de_justica ? 'entrou em' : 'saiu de'

      console.log(`[Escavador Callback] Processo ${status} segredo de justiça`)

      await supabaseClient
        .from('monitoring_alerts')
        .insert({
          monitoring_id: monitoring.id,
          alert_type: 'confidentiality_change',
          alert_data: callbackData,
          is_read: false
        })

      await supabaseClient
        .from('notifications')
        .insert({
          user_id: monitoring.user_id,
          notification_type: 'monitoring',
          title: `Segredo de justiça`,
          content: `Processo ${status} segredo de justiça`,
          is_read: false,
          link_to: monitoring.process_id ? `/processos/${monitoring.process_id}` : null
        })

      alertsCreated++

    } else if (eventType === 'nova_publicacao_diario') {
      // Nova publicação em diário oficial
      const publicacao = callbackData.publicacao || callbackData

      console.log(`[Escavador Callback] Nova publicação em diário oficial`)

      await supabaseClient
        .from('monitoring_alerts')
        .insert({
          monitoring_id: monitoring.id,
          alert_type: 'official_gazette',
          alert_data: publicacao,
          is_read: false
        })

      await supabaseClient
        .from('notifications')
        .insert({
          user_id: monitoring.user_id,
          notification_type: 'monitoring',
          title: `Nova publicação em diário oficial`,
          content: publicacao.texto?.substring(0, 200) || 'Nova publicação encontrada',
          is_read: false
        })

      alertsCreated++

    } else if (eventType === 'novo_envolvido') {
      // Novo envolvido no processo
      const envolvido = callbackData.envolvido || callbackData.involved

      console.log(`[Escavador Callback] Novo envolvido: ${envolvido?.nome}`)

      await supabaseClient
        .from('monitoring_alerts')
        .insert({
          monitoring_id: monitoring.id,
          alert_type: 'new_party',
          alert_data: envolvido || callbackData,
          is_read: false
        })

      await supabaseClient
        .from('notifications')
        .insert({
          user_id: monitoring.user_id,
          notification_type: 'monitoring',
          title: `Novo envolvido no processo`,
          content: `${envolvido?.nome || 'Pessoa'} adicionada ao processo`,
          is_read: false,
          link_to: monitoring.process_id ? `/processos/${monitoring.process_id}` : null
        })

      alertsCreated++

    } else {
      // Evento genérico/desconhecido
      console.log(`[Escavador Callback] Evento genérico: ${eventType}`)

      await supabaseClient
        .from('monitoring_alerts')
        .insert({
          monitoring_id: monitoring.id,
          alert_type: eventType || 'generic',
          alert_data: callbackData,
          is_read: false
        })

      await supabaseClient
        .from('notifications')
        .insert({
          user_id: monitoring.user_id,
          notification_type: 'monitoring',
          title: `Atualização de monitoramento`,
          content: `Evento: ${eventType}`,
          is_read: false
        })

      alertsCreated++
    }

    // Atualizar contador de alertas
    await supabaseClient
      .from('monitorings')
      .update({
        alerts_count: monitoring.alerts_count + alertsCreated,
        last_check: new Date().toISOString()
      })
      .eq('id', monitoring.id)

    // Atualizar log como completo
    const processingTime = Date.now() - startTime

    if (callbackLogId) {
      await supabaseClient
        .from('callback_logs')
        .update({
          processing_status: 'completed',
          alerts_created: alertsCreated,
          processing_time_ms: processingTime,
          processed_at: new Date().toISOString()
        })
        .eq('id', callbackLogId)
    }

    console.log(`[Escavador Callback] Processamento completo em ${processingTime}ms. Alertas criados: ${alertsCreated}`)

    // Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        event_type: eventType,
        alerts_created: alertsCreated,
        processing_time_ms: processingTime
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Escavador Callback] Erro no processamento:', error)

    // Atualizar log como falho
    if (callbackLogId) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      )

      await supabaseClient
        .from('callback_logs')
        .update({
          processing_status: 'failed',
          error_message: error.message,
          processing_time_ms: Date.now() - startTime,
          processed_at: new Date().toISOString()
        })
        .eq('id', callbackLogId)
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
