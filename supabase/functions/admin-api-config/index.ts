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

    const { action, configId, apiName, apiKey, endpointUrl, isActive, priority, rateLimit, timeout, fallbackApi, userId } = await req.json()

    if (!action || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se usuário é admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('user_type')
      .eq('id', userId)
      .single()

    if (!profile || profile.user_type !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ======== LIST - Listar todas as configurações ========
    if (action === 'list') {
      const { data, error } = await supabaseClient
        .from('api_configurations')
        .select('*')
        .order('priority', { ascending: true })

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, configurations: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ======== GET - Obter configuração específica ========
    if (action === 'get') {
      if (!configId && !apiName) {
        return new Response(
          JSON.stringify({ error: 'Missing configId or apiName' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      let query = supabaseClient.from('api_configurations').select('*')

      if (configId) {
        query = query.eq('id', configId)
      } else if (apiName) {
        query = query.eq('api_name', apiName)
      }

      const { data, error } = await query.single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, configuration: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ======== UPDATE - Atualizar configuração ========
    if (action === 'update') {
      if (!configId && !apiName) {
        return new Response(
          JSON.stringify({ error: 'Missing configId or apiName' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const updateData: any = {}

      if (apiKey) updateData.api_key = apiKey
      if (endpointUrl) updateData.endpoint_url = endpointUrl
      if (isActive !== undefined) updateData.is_active = isActive
      if (priority !== undefined) updateData.priority = priority
      if (rateLimit !== undefined) updateData.rate_limit = rateLimit
      if (timeout !== undefined) updateData.timeout = timeout
      if (fallbackApi !== undefined) updateData.fallback_api = fallbackApi

      let query = supabaseClient.from('api_configurations').update(updateData)

      if (configId) {
        query = query.eq('id', configId)
      } else if (apiName) {
        query = query.eq('api_name', apiName)
      }

      const { data, error } = await query.select().single()

      if (error) throw error

      // Logar ação admin
      await supabaseClient
        .from('system_logs')
        .insert({
          log_type: 'admin_action',
          user_id: userId,
          action: 'update_api_config',
          metadata: {
            config_id: data.id,
            api_name: data.api_name,
            changes: updateData
          }
        })

      return new Response(
        JSON.stringify({ success: true, configuration: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ======== TEST - Testar conexão com API ========
    if (action === 'test') {
      if (!apiName && !configId) {
        return new Response(
          JSON.stringify({ error: 'Missing apiName or configId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Obter config
      let query = supabaseClient.from('api_configurations').select('*')

      if (configId) {
        query = query.eq('id', configId)
      } else if (apiName) {
        query = query.eq('api_name', apiName)
      }

      const { data: config, error } = await query.single()

      if (error) throw error

      // Testar conexão
      const startTime = Date.now()

      try {
        const testEndpoint = config.api_name === 'judit'
          ? `${config.endpoint_url}/v1/health`
          : `${config.endpoint_url}/api/health`

        const response = await fetch(testEndpoint, {
          method: 'GET',
          headers: {
            'Authorization': config.api_name === 'judit'
              ? `Bearer ${config.api_key}`
              : `Token ${config.api_key}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(config.timeout || 30000)
        })

        const latency = Date.now() - startTime

        // Atualizar last_health_check
        await supabaseClient
          .from('api_configurations')
          .update({ last_health_check: new Date().toISOString() })
          .eq('id', config.id)

        return new Response(
          JSON.stringify({
            success: true,
            status: response.ok ? 'healthy' : 'error',
            status_code: response.status,
            latency_ms: latency,
            message: response.ok ? 'API is responding' : 'API returned error'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      } catch (error) {
        const latency = Date.now() - startTime

        return new Response(
          JSON.stringify({
            success: false,
            status: 'unreachable',
            latency_ms: latency,
            message: error.message
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // ======== UPDATE_EDGE_FUNCTION - Atualizar configuração de edge function ========
    if (action === 'update_edge_function') {
      const { functionName, enabledApis, apiPriority, fallbackEnabled } = await req.json()

      if (!functionName) {
        return new Response(
          JSON.stringify({ error: 'Missing functionName' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const updateData: any = {}

      if (enabledApis) updateData.enabled_apis = enabledApis
      if (apiPriority) updateData.api_priority = apiPriority
      if (fallbackEnabled !== undefined) updateData.fallback_enabled = fallbackEnabled

      const { data, error } = await supabaseClient
        .from('edge_function_config')
        .update(updateData)
        .eq('function_name', functionName)
        .select()
        .single()

      if (error) throw error

      // Logar ação
      await supabaseClient
        .from('system_logs')
        .insert({
          log_type: 'admin_action',
          user_id: userId,
          action: 'update_edge_function_config',
          metadata: {
            function_name: functionName,
            changes: updateData
          }
        })

      return new Response(
        JSON.stringify({ success: true, configuration: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ======== LIST_EDGE_FUNCTIONS - Listar configs de edge functions ========
    if (action === 'list_edge_functions') {
      const { data, error } = await supabaseClient
        .from('edge_function_config')
        .select('*')
        .order('function_name', { ascending: true })

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, configurations: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in admin-api-config:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
