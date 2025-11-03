const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { requestId } = await req.json()
    
    if (!requestId) {
      throw new Error('Request ID é obrigatório')
    }

    console.log('[Check JUDiT Status] Verificando request:', requestId)

    const JUDIT_API_KEY = Deno.env.get('JUDIT_API_KEY')
    
    if (!JUDIT_API_KEY) {
      throw new Error('JUDIT_API_KEY não configurada')
    }
    
    // Consultar status do request
    const statusResponse = await fetch(
      `https://requests.prod.judit.io/requests/${requestId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${JUDIT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text()
      console.error('[Check JUDiT Status] Erro na API:', errorText)
      throw new Error(`Erro ao consultar status: ${statusResponse.status}`)
    }

    const statusData = await statusResponse.json()
    console.log('[Check JUDiT Status] Status obtido:', statusData.status)
    
    // Se completado, buscar resultados
    let results = null
    let resultsCount = 0
    
    if (statusData.status === 'completed') {
      console.log('[Check JUDiT Status] Buscando resultados...')
      const responsesUrl = `https://requests.prod.judit.io/responses/?request_id=${requestId}&page=1&page_size=100`
      const responsesResponse = await fetch(responsesUrl, {
        headers: {
          'Authorization': `Bearer ${JUDIT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      if (responsesResponse.ok) {
        results = await responsesResponse.json()
        resultsCount = results?.count || 0
        console.log('[Check JUDiT Status] Resultados encontrados:', resultsCount)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        request_id: requestId,
        status: statusData.status,
        created_at: statusData.created_at,
        completed_at: statusData.completed_at,
        results_count: resultsCount,
        results: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Check JUDiT Status] Erro:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
