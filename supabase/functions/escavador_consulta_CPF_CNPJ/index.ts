import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  userId: string
  document: string
}

interface EscavadorProcess {
  numero_cnj: string
  titulo_polo_ativo?: string
  titulo_polo_passivo?: string
  ano_inicio?: number
  data_inicio?: string
  estado_origem?: {
    nome?: string
    sigla?: string
  }
  data_ultima_movimentacao?: string
  quantidade_movimentacoes?: number
  fontes?: Array<{
    id?: number
    nome?: string
    sigla?: string
    status_predito?: string
    tribunal?: {
      sigla?: string
      nome?: string
    }
    capa?: {
      classe?: string
      area?: string
      situacao?: string
      valor_causa?: {
        valor_formatado?: string
      }
    }
  }>
}

interface EscavadorResponse {
  envolvido_encontrado?: {
    nome?: string
    tipo_pessoa?: string
    quantidade_processos?: number
  }
  items?: EscavadorProcess[]
  links?: {
    next?: string
  }
  paginator?: {
    per_page?: number
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, document }: RequestBody = await req.json()

    if (!userId || !document) {
      return new Response(
        JSON.stringify({ error: 'userId e document são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Normalizar documento (apenas dígitos)
    const normalizedDoc = document.replace(/\D/g, '')
    
    if (normalizedDoc.length !== 11 && normalizedDoc.length !== 14) {
      return new Response(
        JSON.stringify({ error: 'Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const docType = normalizedDoc.length === 11 ? 'cpf' : 'cnpj'
    console.log(`[Escavador CPF/CNPJ] Iniciando busca ${docType.toUpperCase()}: ${normalizedDoc}`)

    // Montar URL do Escavador v2
    const escavadorUrl = new URL('https://api.escavador.com/api/v2/envolvido/processos')
    escavadorUrl.searchParams.append(docType, normalizedDoc)
    escavadorUrl.searchParams.append('order', 'desc')
    escavadorUrl.searchParams.append('limit', '100')
    escavadorUrl.searchParams.append('status', 'ATIVO')

    console.log(`[Escavador CPF/CNPJ] URL: ${escavadorUrl.toString()}`)

    const escavadorApiKey = Deno.env.get('ESCAVADOR_API_KEY')
    if (!escavadorApiKey) {
      throw new Error('ESCAVADOR_API_KEY não configurada')
    }

    // Fazer requisição ao Escavador v2
    const response = await fetch(escavadorUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${escavadorApiKey}`,
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    console.log(`[Escavador CPF/CNPJ] Status da API: ${response.status}`)

    // Tratamento de erros específicos
    if (response.status === 401) {
      console.error('[Escavador CPF/CNPJ] Erro de autenticação (401)')
      return new Response(
        JSON.stringify({ error: 'Unauthenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (response.status === 402) {
      console.error('[Escavador CPF/CNPJ] Sem saldo de créditos (402)')
      return new Response(
        JSON.stringify({ error: 'Você não possui saldo em crédito da API.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (response.status === 404) {
      console.log('[Escavador CPF/CNPJ] Nenhum resultado encontrado (404)')
      
      // Registrar busca sem resultados
      await supabase.from('user_searches').insert({
        user_id: userId,
        search_type: docType,
        search_value: normalizedDoc,
        credits_consumed: 0,
        results_count: 0,
        from_cache: false,
        api_used: 'escavador'
      })

      return new Response(
        JSON.stringify({
          results_count: 0,
          items: [],
          envolvido_encontrado: null,
          from_cache: false,
          credits_consumed: 0,
          provider: 'escavador_v2',
          message: 'Nenhum processo encontrado'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Escavador CPF/CNPJ] Erro ${response.status}:`, errorText.substring(0, 200))
      return new Response(
        JSON.stringify({ error: `Erro na API Escavador: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sucesso (200)
    const data: EscavadorResponse = await response.json()
    const items = data.items || []
    const resultsCount = items.length

    console.log(`[Escavador CPF/CNPJ] Encontrados ${resultsCount} processos`)

    // Registrar busca
    await supabase.from('user_searches').insert({
      user_id: userId,
      search_type: docType,
      search_value: normalizedDoc,
      credits_consumed: 0,
      results_count: resultsCount,
      from_cache: false,
      api_used: 'escavador'
    })

    // Opcional: persistir processos encontrados
    if (items.length > 0) {
      console.log(`[Escavador CPF/CNPJ] Persistindo ${items.length} processos...`)
      
      for (const item of items) {
        try {
          const fonte = item.fontes?.[0]
          const tribunal = fonte?.sigla || fonte?.tribunal?.sigla || 'Desconhecido'
          const courtName = fonte?.nome || fonte?.tribunal?.nome || null
          
          await supabase.from('processes').upsert({
            cnj_number: item.numero_cnj,
            tribunal,
            court_name: courtName,
            distribution_date: item.data_inicio || null,
            status: fonte?.status_predito || fonte?.capa?.situacao || 'Encontrado (Escavador v2)',
            parties_cpf_cnpj: [normalizedDoc],
            author_names: item.titulo_polo_ativo ? [item.titulo_polo_ativo] : null,
            defendant_names: item.titulo_polo_passivo ? [item.titulo_polo_passivo] : null,
            last_searched_by: userId,
            source_api: 'escavador',
            last_update: new Date().toISOString()
          }, {
            onConflict: 'cnj_number'
          })
        } catch (err) {
          console.error('[Escavador CPF/CNPJ] Erro ao persistir processo:', err)
        }
      }
    }

    return new Response(
      JSON.stringify({
        results_count: resultsCount,
        items,
        envolvido_encontrado: data.envolvido_encontrado,
        from_cache: false,
        credits_consumed: 0,
        provider: 'escavador_v2',
        message: resultsCount > 0 
          ? `${resultsCount} processo(s) encontrado(s)` 
          : 'Nenhum processo encontrado'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Escavador CPF/CNPJ] Erro:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
