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

        // Fazer chamada à API para verificar novidades
        const response = await fetch(`${apiConfig.endpoint_url}/v1/monitoring/check`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiConfig.api_key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: monitoring.monitoring_type,
            value: monitoring.monitoring_value,
            last_check: monitoring.last_check
          })
        })

        if (!response.ok) {
          console.error(`API error for monitoring ${monitoring.id}`)
          continue
        }

        const data = await response.json()

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
