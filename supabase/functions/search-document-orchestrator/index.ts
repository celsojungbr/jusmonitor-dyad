import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { userId, document } = await req.json()

    if (!userId || !document) {
      throw new Error('userId e document são obrigatórios')
    }

    console.log('[Orchestrator] Documento recebido:', document)
    console.log('[Orchestrator] Consultando configuração para feature: busca-processual-cpf-cnpj')

    // Query edge_function_config to find active provider
    const { data: configs, error: configError } = await supabase
      .from('edge_function_config')
      .select('function_name, enabled_apis, api_priority, status')
      .eq('feature_id', 'busca-processual-cpf-cnpj')
      .eq('status', 'active')

    if (configError) {
      console.error('[Orchestrator] Erro ao consultar configurações:', configError)
      throw new Error('Erro ao consultar configurações do sistema')
    }

    console.log('[Orchestrator] Configurações encontradas:', configs)

    if (!configs || configs.length === 0) {
      console.error('[Orchestrator] Nenhuma API ativa configurada')
      return new Response(
        JSON.stringify({
          error: 'Nenhum provedor de busca configurado',
          message: 'Configure pelo menos uma API no painel administrativo'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Select the first active configuration (can be enhanced with priority logic)
    const activeConfig = configs[0]
    const functionName = activeConfig.function_name
    const apiPriority = activeConfig.api_priority as string[]

    console.log('[Orchestrator] Provider selecionado:', apiPriority[0])
    console.log('[Orchestrator] Chamando edge function:', functionName)

    // Call the appropriate edge function
    const { data: result, error: invokeError } = await supabase.functions.invoke(
      functionName,
      {
        body: { userId, document }
      }
    )

    if (invokeError) {
      console.error('[Orchestrator] Erro ao chamar função:', invokeError)
      
      // Se for timeout, retornar mensagem mais clara
      if (result?.error === 'Timeout') {
        return new Response(
          JSON.stringify({
            error: 'Timeout na API',
            message: result.message || 'A API demorou mais que o esperado',
            provider: apiPriority[0],
            request_id: result.request_id
          }),
          {
            status: 504,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      
      throw invokeError
    }

    console.log('[Orchestrator] Resposta recebida:', {
      success: result?.success !== false,
      resultsCount: result?.results_count || 0
    })

    // Add provider metadata to response
    const provider = functionName === 'judit_consulta_hot_storage' 
      ? 'judit_hot_storage'
      : functionName === 'judit-search-document'
      ? 'judit_direct'
      : 'escavador'

    return new Response(
      JSON.stringify({
        ...result,
        provider
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('[Orchestrator] Erro:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro interno do servidor'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
