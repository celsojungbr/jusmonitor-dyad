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

    const { attachmentId, userId } = await req.json()

    if (!attachmentId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Buscar anexo
    const { data: attachment, error: attachmentError } = await supabaseClient
      .from('process_attachments')
      .select('*')
      .eq('id', attachmentId)
      .single()

    if (attachmentError || !attachment) {
      return new Response(
        JSON.stringify({ error: 'Attachment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const creditCost = attachment.download_cost_credits || 2

    // 2. Verificar saldo de créditos
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

    // 3. Buscar processo relacionado ao anexo
    const { data: process } = await supabaseClient
      .from('processes')
      .select('cnj_number')
      .eq('id', attachment.process_id)
      .single()

    if (!process) {
      return new Response(
        JSON.stringify({ error: 'Process not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Obter URL do anexo via API JUDiT
    const { data: apiConfig } = await supabaseClient
      .from('api_configurations')
      .select('*')
      .eq('api_name', 'judit')
      .eq('is_active', true)
      .single()

    if (!apiConfig) {
      return new Response(
        JSON.stringify({ error: 'JUDiT API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[JUDiT] Solicitando download de anexo: ${attachment.attachment_name}`)

    // Endpoint correto para transferência de arquivos
    // Ver: https://docs.judit.io/file-transfer/file-transfer
    const response = await fetch(`${apiConfig.endpoint_url}/file-transfer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiConfig.api_key}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        cnj_number: process.cnj_number,
        document_id: attachmentId,
        document_name: attachment.attachment_name,
        action: 'download' // ou 'get_url' dependendo da API
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[JUDiT] API error ${response.status}:`, errorText)
      throw new Error(`JUDiT API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`[JUDiT] URL de download obtida`)

    // URL pode estar em diferentes campos
    const downloadUrl = data.download_url || data.url || data.file_url || data.link

    if (!downloadUrl) {
      throw new Error('Download URL not found in API response')
    }

    // 5. Deduzir créditos
    await supabaseClient
      .from('credits_plans')
      .update({ credits_balance: plan.credits_balance - creditCost })
      .eq('user_id', userId)

    // 6. Registrar transação
    await supabaseClient
      .from('credit_transactions')
      .insert({
        user_id: userId,
        transaction_type: 'consumption',
        operation_type: 'Download de Anexo',
        credits_amount: -creditCost,
        description: `Download de ${attachment.attachment_name}`
      })

    // 7. Retornar URL para download
    return new Response(
      JSON.stringify({
        success: true,
        download_url: downloadUrl,
        credits_consumed: creditCost,
        attachment_name: attachment.attachment_name,
        file_size: attachment.file_size,
        attachment_type: attachment.attachment_type
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in download-attachments:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
