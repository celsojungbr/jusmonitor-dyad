import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY') ?? ''
const LOVABLE_API_URL = 'https://api.lovable.app/v1/chat/completions'

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

    const { processId, userMessage, userId } = await req.json()

    if (!processId || !userMessage || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Custo: 15 créditos por análise IA
    const creditCost = 15

    // 1. Verificar saldo
    const { data: plan } = await supabaseClient
      .from('credits_plans')
      .select('credits_balance')
      .eq('user_id', userId)
      .single()

    if (!plan || plan.credits_balance < creditCost) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient credits',
          required: creditCost,
          available: plan?.credits_balance || 0
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Obter dados completos do processo
    const { data: process } = await supabaseClient
      .from('processes')
      .select('*')
      .eq('id', processId)
      .single()

    if (!process) {
      return new Response(
        JSON.stringify({ error: 'Process not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Obter movimentações
    const { data: movements } = await supabaseClient
      .from('process_movements')
      .select('*')
      .eq('process_id', processId)
      .order('movement_date', { ascending: false })
      .limit(10) // Últimas 10 movimentações

    // 4. Montar contexto para IA
    const context = `
PROCESSO JUDICIAL - CNJ: ${process.cnj_number}

INFORMAÇÕES BÁSICAS:
- Tribunal: ${process.tribunal}
- Data de Distribuição: ${process.distribution_date}
- Status: ${process.status}
- Valor da Causa: R$ ${process.case_value?.toLocaleString('pt-BR') || 'Não informado'}
- Juiz: ${process.judge_name || 'Não informado'}
- Vara/Comarca: ${process.court_name || 'Não informado'}
- Fase: ${process.phase || 'Não informado'}

PARTES:
- Autores: ${process.author_names?.join(', ') || 'Não informado'}
- Réus: ${process.defendant_names?.join(', ') || 'Não informado'}

ÚLTIMAS MOVIMENTAÇÕES:
${movements?.map(m => `- ${m.movement_date}: ${m.description}`).join('\n') || 'Nenhuma movimentação registrada'}
`

    const systemPrompt = `Você é um assistente jurídico especializado em processos judiciais brasileiros.
Você tem acesso aos dados completos de um processo judicial e deve responder perguntas de forma clara, precisa e profissional.
Use linguagem técnica quando apropriado, mas explique termos complexos quando necessário.
Baseie suas respostas APENAS nos dados fornecidos. Se não souber algo, diga claramente.
Não invente informações que não estejam no contexto fornecido.`

    // 5. Chamar Lovable AI
    const aiResponse = await fetch(LOVABLE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp', // Model recomendado no plano
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: context },
          { role: 'user', content: userMessage }
        ],
        stream: false,
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!aiResponse.ok) {
      throw new Error(`Lovable AI error: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    const assistantMessage = aiData.choices[0].message.content

    // 6. Deduzir créditos
    await supabaseClient
      .from('credits_plans')
      .update({ credits_balance: plan.credits_balance - creditCost })
      .eq('user_id', userId)

    // 7. Registrar transação
    await supabaseClient
      .from('credit_transactions')
      .insert({
        user_id: userId,
        transaction_type: 'consumption',
        operation_type: 'Análise IA',
        credits_amount: -creditCost,
        description: `Chat IA sobre processo ${process.cnj_number}`
      })

    // 8. Logar uso da IA
    await supabaseClient
      .from('system_logs')
      .insert({
        log_type: 'user_action',
        user_id: userId,
        action: 'ai_chat_process',
        metadata: {
          process_id: processId,
          cnj_number: process.cnj_number,
          user_message: userMessage.substring(0, 100),
          credits_consumed: creditCost
        }
      })

    // 9. Retornar resposta
    return new Response(
      JSON.stringify({
        success: true,
        message: assistantMessage,
        credits_consumed: creditCost
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in ai-chat-process:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
