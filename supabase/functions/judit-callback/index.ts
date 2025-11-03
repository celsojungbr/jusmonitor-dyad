import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { validateJuditCallbackComplete } from '../_shared/callback-validator.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-judit-signature',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()
  let callbackLogId: string | null = null

  try {
    console.log('[JUDiT Callback] Recebendo callback...')

    // Criar cliente Supabase com SERVICE_ROLE para bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Service role para callbacks
    )

    // 1. Ler body e headers
    const body = await req.text()
    const signature = req.headers.get('X-JUDiT-Signature')

    console.log('[JUDiT Callback] Body recebido:', body.substring(0, 200))
    console.log('[JUDiT Callback] Signature:', signature ? 'presente' : 'ausente')

    // Parse JSON
    let callbackData: any
    try {
      callbackData = JSON.parse(body)
    } catch (error) {
      console.error('[JUDiT Callback] Erro ao parsear JSON:', error)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Validar assinatura
    const secret = Deno.env.get('JUDIT_CALLBACK_SECRET') ?? Deno.env.get('JUDIT_API_KEY') ?? ''

    const validation = await validateJuditCallbackComplete(
      body,
      signature,
      callbackData.timestamp || Date.now(),
      secret
    )

    // 3. Criar log do callback (para auditoria)
    const { data: logData } = await supabaseClient
      .from('callback_logs')
      .insert({
        api_provider: 'judit',
        tracking_id: callbackData.tracking_id || callbackData.id,
        event_type: callbackData.event || callbackData.type || 'unknown',
        payload: callbackData,
        signature: signature,
        is_valid: validation.isValid,
        processing_status: 'pending'
      })
      .select('id')
      .single()

    callbackLogId = logData?.id

    // 4. Se inválido, retornar 403
    if (!validation.isValid) {
      console.error('[JUDiT Callback] Validação falhou:', validation.error)

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
    const eventType = callbackData.event || callbackData.type
    const trackingId = callbackData.tracking_id || callbackData.id

    console.log(`[JUDiT Callback] Processando evento: ${eventType}, tracking_id: ${trackingId}`)

    // Buscar monitoramento relacionado OU busca assíncrona
    const { data: monitoring } = await supabaseClient
      .from('monitorings')
      .select('*')
      .eq('tracking_id', trackingId)
      .single()

    const { data: asyncSearch } = await supabaseClient
      .from('async_searches')
      .select('*')
      .eq('request_id', trackingId)
      .single()

    if (!monitoring && !asyncSearch) {
      console.warn(`[JUDiT Callback] Nem monitoramento nem busca assíncrona encontrado para request_id: ${trackingId}`)

      await supabaseClient
        .from('callback_logs')
        .update({
          processing_status: 'failed',
          error_message: 'Monitoring or async search not found',
          processed_at: new Date().toISOString()
        })
        .eq('id', callbackLogId)

      return new Response(
        JSON.stringify({ error: 'Monitoring or async search not found', tracking_id: trackingId }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Se for busca assíncrona, processar de forma diferente
    if (asyncSearch) {
      console.log(`[JUDiT Callback] Processando busca assíncrona: ${asyncSearch.id}`)
      
      const processes: any[] = []
      const data = callbackData.data || callbackData
      
      // Extrair processos
      if (data.processes && Array.isArray(data.processes)) {
        for (const proc of data.processes) {
          processes.push({
            cnj_number: proc.process_number || proc.cnj_number,
            tribunal: proc.court || proc.tribunal || 'Desconhecido',
            court_name: proc.court_name,
            distribution_date: proc.distribution_date,
            judge_name: proc.judge_name,
            case_value: proc.case_value,
            status: proc.status,
            phase: proc.phase,
            author_names: proc.plaintiffs || [],
            defendant_names: proc.defendants || [],
            parties_cpf_cnpj: [asyncSearch.search_value],
            source_api: 'judit',
            last_searched_by: asyncSearch.user_id
          })
        }
      } else if (data.process_number || data.cnj_number) {
        // Único processo
        processes.push({
          cnj_number: data.process_number || data.cnj_number,
          tribunal: data.court || data.tribunal || 'Desconhecido',
          court_name: data.court_name,
          distribution_date: data.distribution_date,
          judge_name: data.judge_name,
          case_value: data.case_value,
          status: data.status,
          phase: data.phase,
          author_names: data.plaintiffs || [],
          defendant_names: data.defendants || [],
          parties_cpf_cnpj: [asyncSearch.search_value],
          source_api: 'judit',
          last_searched_by: asyncSearch.user_id
        })
      }

      // Salvar processos
      if (processes.length > 0) {
        await supabaseClient
          .from('processes')
          .upsert(processes, { onConflict: 'cnj_number' })
      }

      // Atualizar busca assíncrona como completa
      await supabaseClient
        .from('async_searches')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          results_count: processes.length
        })
        .eq('id', asyncSearch.id)

      // Registrar na tabela user_searches
      await supabaseClient.from('user_searches').insert({
        user_id: asyncSearch.user_id,
        search_type: asyncSearch.search_type,
        search_value: asyncSearch.search_value,
        credits_consumed: 0, // Já foi deduzido antes
        results_count: processes.length,
        from_cache: false,
        api_used: 'judit'
      })

      // Criar notificação para o usuário
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: asyncSearch.user_id,
          notification_type: 'system',
          title: 'Busca completa finalizada',
          content: `Sua busca por ${asyncSearch.search_value} foi concluída. Encontrados ${processes.length} processo(s).`,
          is_read: false,
          link_to: '/dashboard/consultas'
        })

      // Atualizar log como completo
      const processingTime = Date.now() - startTime
      if (callbackLogId) {
        await supabaseClient
          .from('callback_logs')
          .update({
            processing_status: 'completed',
            processing_time_ms: processingTime,
            processed_at: new Date().toISOString()
          })
          .eq('id', callbackLogId)
      }

      console.log(`[JUDiT Callback] Busca assíncrona processada. Processos: ${processes.length}`)

      return new Response(
        JSON.stringify({
          success: true,
          type: 'async_search',
          processes_found: processes.length,
          processing_time_ms: processingTime
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
    if (eventType === 'lawsuit.new_movement' || eventType === 'new_movement') {
      // Nova movimentação em processo
      const lawsuitData = callbackData.data || callbackData.lawsuit || callbackData
      const movement = lawsuitData.movement || callbackData.movement

      if (movement) {
        console.log(`[JUDiT Callback] Nova movimentação: ${movement.description || movement.descricao}`)

        // Criar alerta
        await supabaseClient
          .from('monitoring_alerts')
          .insert({
            monitoring_id: monitoring.id,
            alert_type: 'new_movement',
            alert_data: movement,
            is_read: false
          })

        // Criar notificação para o usuário
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: monitoring.user_id,
            notification_type: 'monitoring',
            title: `Nova movimentação: ${monitoring.monitoring_value}`,
            content: movement.description || movement.descricao || 'Nova movimentação processual',
            is_read: false,
            link_to: monitoring.process_id ? `/processos/${monitoring.process_id}` : null
          })

        alertsCreated++
      }

    } else if (eventType === 'tracking.new_lawsuit' || eventType === 'new_lawsuit' || eventType === 'lawsuit.found') {
      // Novo processo encontrado
      const lawsuit = callbackData.data || callbackData.lawsuit || callbackData

      console.log(`[JUDiT Callback] Novo processo: ${lawsuit.lawsuit_number || lawsuit.cnj_number}`)

      // Criar alerta
      await supabaseClient
        .from('monitoring_alerts')
        .insert({
          monitoring_id: monitoring.id,
          alert_type: 'new_process',
          alert_data: lawsuit,
          is_read: false
        })

      // Criar notificação
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: monitoring.user_id,
          notification_type: 'monitoring',
          title: `Novo processo encontrado`,
          content: `Processo ${lawsuit.lawsuit_number || lawsuit.cnj_number || 'sem número'} encontrado para ${monitoring.monitoring_value}`,
          is_read: false
        })

      alertsCreated++

      // Salvar processo no DataLake
      if (lawsuit.lawsuit_number || lawsuit.cnj_number) {
        await supabaseClient
          .from('processes')
          .upsert({
            cnj_number: lawsuit.lawsuit_number || lawsuit.cnj_number,
            tribunal: lawsuit.court || lawsuit.tribunal || '',
            distribution_date: lawsuit.distribution_date || lawsuit.data_distribuicao || null,
            status: lawsuit.status || lawsuit.situacao || 'Em andamento',
            case_value: parseFloat(lawsuit.case_value || lawsuit.valor_causa || 0),
            judge_name: lawsuit.judge || lawsuit.juiz || '',
            court_name: lawsuit.court_name || lawsuit.vara || '',
            phase: lawsuit.phase || lawsuit.fase || '',
            author_names: lawsuit.plaintiffs || lawsuit.autores || [],
            defendant_names: lawsuit.defendants || lawsuit.reus || [],
            parties_cpf_cnpj: lawsuit.parties_cpf_cnpj || [],
            last_update: new Date().toISOString()
          }, { onConflict: 'cnj_number' })
      }

    } else if (eventType === 'lawsuit.status_change' || eventType === 'status_change') {
      // Mudança de status
      const lawsuit = callbackData.data || callbackData.lawsuit || callbackData

      console.log(`[JUDiT Callback] Mudança de status: ${lawsuit.status || lawsuit.situacao}`)

      await supabaseClient
        .from('monitoring_alerts')
        .insert({
          monitoring_id: monitoring.id,
          alert_type: 'status_change',
          alert_data: lawsuit,
          is_read: false
        })

      await supabaseClient
        .from('notifications')
        .insert({
          user_id: monitoring.user_id,
          notification_type: 'monitoring',
          title: `Mudança de status`,
          content: `Status alterado para: ${lawsuit.status || lawsuit.situacao}`,
          is_read: false,
          link_to: monitoring.process_id ? `/processos/${monitoring.process_id}` : null
        })

      alertsCreated++

    } else {
      // Evento genérico/desconhecido
      console.log(`[JUDiT Callback] Evento genérico: ${eventType}`)

      await supabaseClient
        .from('monitoring_alerts')
        .insert({
          monitoring_id: monitoring.id,
          alert_type: eventType,
          alert_data: callbackData.data || callbackData,
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

    // Atualizar contador de alertas no monitoramento
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

    console.log(`[JUDiT Callback] Processamento completo em ${processingTime}ms. Alertas criados: ${alertsCreated}`)

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
    console.error('[JUDiT Callback] Erro no processamento:', error)

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
          error_message: error instanceof Error ? error.message : 'Unknown error',
          processing_time_ms: Date.now() - startTime,
          processed_at: new Date().toISOString()
        })
        .eq('id', callbackLogId)
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
