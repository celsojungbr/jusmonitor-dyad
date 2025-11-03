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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se usuário é admin
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single()

    if (!roles) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar configurações das APIs
    const { data: configs, error: configError } = await supabaseClient
      .from('api_configurations')
      .select('*')
      .in('api_name', ['judit', 'escavador'])

    if (configError) throw configError

    const balances: any = {}

    // Consultar saldo JUDiT
    const juditConfig = configs?.find(c => c.api_name === 'judit')
    if (juditConfig) {
      try {
        const juditUrl = `${juditConfig.endpoint_url}/v1/resource/consumption`
        console.log('[JUDiT] Fetching balance from:', juditUrl)
        
        const response = await fetch(juditUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('JUDIT_API_KEY')}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(10000)
        })

        console.log('[JUDiT] Response status:', response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('[JUDiT] Response data:', JSON.stringify(data))
          
          balances.judit = {
            success: true,
            balance: data.remaining_credits || data.credits || 0,
            consumed: data.consumed_credits || 0,
            total: data.total_credits || 0,
            lastCheck: new Date().toISOString()
          }
        } else {
          const errorText = await response.text()
          console.error('[JUDiT] Error response:', errorText)
          
          balances.judit = {
            success: false,
            error: `HTTP ${response.status}: ${errorText.substring(0, 100)}`,
            lastCheck: new Date().toISOString()
          }
        }
      } catch (error) {
        console.error('[JUDiT] Exception:', error)
        
        balances.judit = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          lastCheck: new Date().toISOString()
        }
      }
    }

    // Consultar saldo Escavador
    const escavadorConfig = configs?.find(c => c.api_name === 'escavador')
    if (escavadorConfig) {
      try {
        const escavadorUrl = `${escavadorConfig.endpoint_url}/v1/saldo`
        console.log('[Escavador] Fetching balance from:', escavadorUrl)
        
        const response = await fetch(escavadorUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${Deno.env.get('ESCAVADOR_API_KEY')}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(10000)
        })

        console.log('[Escavador] Response status:', response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('[Escavador] Response data:', JSON.stringify(data))
          
          balances.escavador = {
            success: true,
            balance: data.saldo || data.balance || 0,
            consumed: data.consumido || data.consumed || 0,
            total: data.total || 0,
            lastCheck: new Date().toISOString()
          }
        } else {
          const errorText = await response.text()
          console.error('[Escavador] Error response:', errorText)
          
          balances.escavador = {
            success: false,
            error: `HTTP ${response.status}: ${errorText.substring(0, 100)}`,
            lastCheck: new Date().toISOString()
          }
        }
      } catch (error) {
        console.error('[Escavador] Exception:', error)
        
        balances.escavador = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          lastCheck: new Date().toISOString()
        }
      }
    }

    // Logar ação
    await supabaseClient
      .from('system_logs')
      .insert({
        log_type: 'admin_action',
        user_id: userId,
        action: 'check_api_balance',
        metadata: { balances }
      })

    return new Response(
      JSON.stringify({ success: true, balances }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in check-api-balance:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
