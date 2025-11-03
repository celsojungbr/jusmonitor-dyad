import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  cnjNumber: string
  userId: string
}

async function captureAttachmentsBackground(
  cnjNumber: string,
  userId: string,
  jobId: string,
  supabase: any,
  apiConfig: any
) {
  try {
    console.log(`[Capture Attachments] Background job started for ${cnjNumber}`)

    // Atualizar status do job
    await supabase
      .from('attachment_capture_jobs')
      .update({
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', jobId)

    // Buscar o processo
    const { data: processData } = await supabase
      .from('processes')
      .select('id')
      .eq('cnj_number', cnjNumber)
      .maybeSingle()

    if (!processData) {
      throw new Error('Processo não encontrado')
    }

    // Buscar lista de anexos via API
    // Usando endpoint JUDiT para obter lista de documentos
    const response = await fetch(`${apiConfig.endpoint_url}/requests/request-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiConfig.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cnj_number: cnjNumber,
        get_attachments: true
      })
    })

    if (!response.ok) {
      throw new Error(`Erro ao buscar anexos: ${response.status}`)
    }

    const data = await response.json()
    const attachments = data.attachments || data.documents || []

    console.log(`[Capture Attachments] Found ${attachments.length} attachments`)

    // Atualizar total de anexos
    await supabase
      .from('attachment_capture_jobs')
      .update({ total_attachments: attachments.length })
      .eq('id', jobId)

    let capturedCount = 0

    // Para cada anexo, salvar metadados (não baixar ainda)
    for (const attachment of attachments) {
      try {
        // Verificar se já existe
        const { data: existing } = await supabase
          .from('process_attachments')
          .select('id')
          .eq('process_id', processData.id)
          .eq('attachment_name', attachment.name || attachment.filename)
          .maybeSingle()

        if (!existing) {
          await supabase.from('process_attachments').insert({
            process_id: processData.id,
            attachment_name: attachment.name || attachment.filename,
            attachment_type: attachment.type || 'document',
            file_size: attachment.size,
            filing_date: attachment.date,
            download_cost_credits: 2
          })
        }

        capturedCount++

        // Atualizar progresso a cada 10 anexos
        if (capturedCount % 10 === 0) {
          await supabase
            .from('attachment_capture_jobs')
            .update({ captured_attachments: capturedCount })
            .eq('id', jobId)
        }
      } catch (error) {
        console.error(`[Capture Attachments] Error processing attachment:`, error)
      }
    }

    // Finalizar job
    await supabase
      .from('attachment_capture_jobs')
      .update({
        status: 'completed',
        captured_attachments: capturedCount,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)

    // Criar notificação para o usuário
    await supabase.from('notifications').insert({
      user_id: userId,
      notification_type: 'system',
      title: 'Captura de anexos concluída',
      content: `${capturedCount} anexos foram capturados do processo ${cnjNumber}`,
      link_to: `/dashboard/processo/${cnjNumber}`
    })

    console.log(`[Capture Attachments] Background job completed: ${capturedCount}/${attachments.length}`)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Capture Attachments] Background job error:', errorMessage)
    
    await supabase
      .from('attachment_capture_jobs')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { cnjNumber, userId }: RequestBody = await req.json()

    console.log(`[Capture Attachments] Request for ${cnjNumber}`)

    // Buscar configuração da API JUDiT
    const { data: apiConfig } = await supabase
      .from('api_configurations')
      .select('api_key, endpoint_url')
      .eq('api_name', 'judit')
      .eq('is_active', true)
      .order('priority')
      .limit(1)
      .maybeSingle()

    if (!apiConfig) {
      throw new Error('Configuração da API JUDiT não encontrada')
    }

    // Verificar se já existe um job em andamento
    const { data: existingJob } = await supabase
      .from('attachment_capture_jobs')
      .select('id, status')
      .eq('cnj_number', cnjNumber)
      .in('status', ['pending', 'processing'])
      .maybeSingle()

    if (existingJob) {
      return new Response(
        JSON.stringify({
          success: true,
          job_id: existingJob.id,
          status: existingJob.status,
          message: 'Já existe um job de captura em andamento para este processo'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar job
    const { data: newJob } = await supabase
      .from('attachment_capture_jobs')
      .insert({
        cnj_number: cnjNumber,
        user_id: userId,
        status: 'pending'
      })
      .select()
      .single()

    // Iniciar processamento em background (não bloquear resposta)
    // Nota: Deno Deploy não suporta waitUntil, então vamos usar setTimeout
    setTimeout(() => {
      captureAttachmentsBackground(cnjNumber, userId, newJob.id, supabase, apiConfig)
    }, 0)

    return new Response(
      JSON.stringify({
        success: true,
        job_id: newJob.id,
        status: 'pending',
        estimated_time: '30 minutos a 48 horas',
        message: 'Captura de anexos iniciada. Você será notificado quando concluir.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Capture Attachments] Error:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
