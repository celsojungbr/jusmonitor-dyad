import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Service role para cron job
    )

    // Buscar monitoramentos ativos que precisam ser verificados
    const { data: monitorings } = await supabaseClient
      .from('monitorings')
      .select('*')
      .eq('status', 'active')
      .lte('next_check', new Date().toISOString())

    if (!monitorings || monitorings.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No monitorings to check' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let checkedCount = 0
    let alertsCreated = 0

    for (const monitoring of monitorings) {
      try {
        // Buscar dados atualizados do processo/CPF/CNPJ/OAB
        const { data: apiConfig } = await supabaseClient
          .from('api_configurations')
          .select('*')
          .eq('api_name', 'judit')
          .eq('is_active', true)
          .single()

        if (!apiConfig) continue

        // IMPORTANTE: Esta função é temporária
        // O ideal é usar webhooks/callbacks em vez de polling
        // Ver docs/API_ANALYSIS_AND_PLAN.md - Sprint 2

        let data: any = { has_updates: false, updates: [] }

        // Chamar endpoint correto baseado no tipo de monitoramento
        if (monitoring.monitoring_type === 'cnj') {
          // Buscar atualizações do processo por CNJ
          const response = await fetch(`${apiConfig.endpoint_url}/requests/requests`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiConfig.api_key}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              cnj_number: monitoring.monitoring_value,
              cache: true,
              include_movements: true
            })
          })

          if (!response.ok) {
            console.error(`[JUDiT] API error for monitoring ${monitoring.id}: ${response.status}`)
            continue
          }

          const processData = await response.json()
          const lawsuit = processData.lawsuit || processData.data || processData

          // Verificar se há movimentações novas desde last_check
          const movements = lawsuit.movements || lawsuit.movimentacoes || []
          const lastCheckDate = new Date(monitoring.last_check || 0)

          const newMovements = movements.filter((mov: any) => {
            const movDate = new Date(mov.date || mov.data || mov.movement_date || 0)
            return movDate > lastCheckDate
          })

          if (newMovements.length > 0) {
            data = {
              has_updates: true,
              updates: newMovements.map((mov: any) => ({
                type: 'new_movement',
                data: mov,
                description: mov.description || mov.descricao || mov.text || 'Nova movimentação'
              }))
            }
          }

        } else {
          // Para CPF/CNPJ/OAB, buscar processos novos
          const response = await fetch(`${apiConfig.endpoint_url}/requests/request-document`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiConfig.api_key}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              document: monitoring.monitoring_value,
              document_type: monitoring.monitoring_type === 'cpf' ? 'CPF' : monitoring.monitoring_type === 'cnpj' ? 'CNPJ' : null,
              oab_number: monitoring.monitoring_type === 'oab' ? monitoring.monitoring_value : null,
              cache: true
            })
          })

          if (!response.ok) {
            console.error(`[JUDiT] API error for monitoring ${monitoring.id}: ${response.status}`)
            continue
          }

          const searchData = await response.json()
          const lawsuits = searchData.lawsuits || searchData.data || []

          // Verificar processos novos
          // Isso requer buscar processos já conhecidos do banco
          const { data: knownProcesses } = await supabaseClient
            .from('processes')
            .select('cnj_number')
            .contains('parties_cpf_cnpj', [monitoring.monitoring_value])

          const knownCNJs = new Set(knownProcesses?.map(p => p.cnj_number) || [])

          const newProcesses = lawsuits.filter((lawsuit: any) => {
            const cnj = lawsuit.lawsuit_number || lawsuit.cnj_number || lawsuit.numero_cnj
            return cnj && !knownCNJs.has(cnj)
          })

          if (newProcesses.length > 0) {
            data = {
              has_updates: true,
              updates: newProcesses.map((proc: any) => ({
                type: 'new_process',
                data: proc,
                description: `Novo processo encontrado: ${proc.lawsuit_number || proc.cnj_number || proc.numero_cnj}`
              }))
            }
          }
        }

        // Se houver novidades, criar alertas
        if (data.has_updates && data.updates && data.updates.length > 0) {
          for (const update of data.updates) {
            await supabaseClient
              .from('monitoring_alerts')
              .insert({
                monitoring_id: monitoring.id,
                alert_type: update.type,
                alert_data: update.data,
                is_read: false
              })

            // Criar notificação para o usuário
            await supabaseClient
              .from('notifications')
              .insert({
                user_id: monitoring.user_id,
                notification_type: 'monitoring',
                title: `Novo andamento: ${monitoring.monitoring_value}`,
                content: update.description,
                is_read: false,
                link_to: `/processos/${monitoring.process_id}`
              })

            alertsCreated++
          }

          // Incrementar contador de alertas
          await supabaseClient
            .from('monitorings')
            .update({
              alerts_count: monitoring.alerts_count + data.updates.length
            })
            .eq('id', monitoring.id)
        }

        // Atualizar last_check e next_check
        const nextCheck = new Date()
        if (monitoring.frequency === 'daily') {
          nextCheck.setDate(nextCheck.getDate() + 1)
        } else if (monitoring.frequency === 'weekly') {
          nextCheck.setDate(nextCheck.getDate() + 7)
        }

        await supabaseClient
          .from('monitorings')
          .update({
            last_check: new Date().toISOString(),
            next_check: nextCheck.toISOString()
          })
          .eq('id', monitoring.id)

        checkedCount++

      } catch (error) {
        console.error(`Error checking monitoring ${monitoring.id}:`, error)
        // Marcar como erro
        await supabaseClient
          .from('monitorings')
          .update({ status: 'error' })
          .eq('id', monitoring.id)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: checkedCount,
        alerts_created: alertsCreated
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in check-monitoring:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
