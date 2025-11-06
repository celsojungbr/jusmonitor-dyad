// As funções 'serve', 'createClient' e o objeto 'Deno' são globais no ambiente Supabase Edge Functions.
// Não são necessárias importações ou referências de tipos explícitas para eles.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Supabase.createClient é globalmente disponível no ambiente Edge Functions
    const supabaseClient = Supabase.createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { oab, uf, userId } = await req.json()

    // Get API Key from environment variables
    const escavadorApiKey = Deno.env.get('ESCAVADOR_DYAD_API_KEY2'); // Usando a nova chave

    if (!escavadorApiKey) {
      return new Response(
        JSON.stringify({ error: 'ESCAVADOR_DYAD_API_KEY2 not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call Escavador API
    const escavadorResponse = await fetch(
      `https://api.escavador.com/api/v2/advogados/oab/${oab}/${uf}/processos?qo=exact&page=1`,
      {
        headers: {
          'Authorization': `Bearer ${escavadorApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const escavadorData = await escavadorResponse.json()

    if (!escavadorResponse.ok) {
      console.error('Escavador API Error:', escavadorData)
      return new Response(
        JSON.stringify({ error: escavadorData.message || 'Escavador API error' }),
        { status: escavadorResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log the API call
    await supabaseClient.from('system_logs').insert({
      user_id: userId,
      log_type: 'api_call',
      action: 'escavador_processos_oab_sucesso',
      metadata: {
        provider: 'escavador',
        oab,
        uf,
        results_count: escavadorData.items?.length || 0,
        status: escavadorResponse.status,
      }
    })

    return new Response(
      JSON.stringify({ success: true, data: escavadorData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    console.error('Edge Function Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})