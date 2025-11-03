import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  cnjNumber: string
  userId: string
  includeAttachments?: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { cnjNumber, userId, includeAttachments = false }: RequestBody = await req.json()

    console.log(`[PDF Dossier] Generating for ${cnjNumber}`)

    // Verificar créditos do usuário
    const { data: creditsData, error: creditsError } = await supabase
      .from('credits_plans')
      .select('credits_balance, credit_cost')
      .eq('user_id', userId)
      .single()

    if (creditsError || !creditsData) {
      throw new Error('Erro ao verificar créditos')
    }

    const creditCost = 10 // Custo da geração de PDF

    if (creditsData.credits_balance < creditCost) {
      return new Response(
        JSON.stringify({ error: 'Créditos insuficientes', required: creditCost, available: creditsData.credits_balance }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar dados do processo
    const { data: processData, error: processError } = await supabase
      .from('processes')
      .select('*')
      .eq('cnj_number', cnjNumber)
      .single()

    if (processError || !processData) {
      throw new Error('Processo não encontrado')
    }

    // Buscar movimentações
    const { data: movements } = await supabase
      .from('process_movements')
      .select('*')
      .eq('process_id', processData.id)
      .order('movement_date', { ascending: false })

    // Buscar anexos (se solicitado)
    let attachments = []
    if (includeAttachments) {
      const { data: attachmentsData } = await supabase
        .from('process_attachments')
        .select('*')
        .eq('process_id', processData.id)
        .order('filing_date', { ascending: false })
      
      attachments = attachmentsData || []
    }

    // Gerar HTML do dossiê
    const html = generateDossierHTML(processData, movements || [], attachments)

    // Para simplificar, vamos retornar o HTML por enquanto
    // Em produção, usaríamos uma biblioteca como puppeteer para gerar PDF
    // ou enviaríamos para um serviço de geração de PDF

    // Por enquanto, vamos apenas criar um objeto com os dados
    // e retornar uma URL que o frontend pode usar para gerar o PDF
    
    // Deduzir créditos
    await supabase
      .from('credits_plans')
      .update({ credits_balance: creditsData.credits_balance - creditCost })
      .eq('user_id', userId)

    // Registrar transação
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      transaction_type: 'debit',
      credits_amount: creditCost,
      cost_in_reais: creditCost * (creditsData.credit_cost || 1.50),
      operation_type: 'pdf_generation',
      description: `Geração de PDF dossiê: ${cnjNumber}`
    })

    // Log
    await supabase.from('system_logs').insert({
      log_type: 'info',
      action: 'pdf_dossier_generated',
      user_id: userId,
      metadata: { cnj_number: cnjNumber, include_attachments: includeAttachments }
    })

    return new Response(
      JSON.stringify({
        success: true,
        credits_consumed: creditCost,
        pdf_html: html,
        process_data: processData,
        movements_count: movements?.length || 0,
        attachments_count: attachments.length,
        message: 'Dossiê gerado com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[PDF Dossier] Error:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateDossierHTML(process: any, movements: any[], attachments: any[]): string {
  const authorNames = Array.isArray(process.author_names) ? process.author_names : []
  const defendantNames = Array.isArray(process.defendant_names) ? process.defendant_names : []

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Dossiê Processual - ${process.cnj_number}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #0052CC; padding-bottom: 10px; }
    h2 { color: #0052CC; margin-top: 30px; }
    .info-grid { display: grid; grid-template-columns: 200px 1fr; gap: 10px; margin: 20px 0; }
    .label { font-weight: bold; }
    .movement { border-left: 3px solid #0052CC; padding-left: 15px; margin: 15px 0; }
    .movement-date { font-weight: bold; color: #0052CC; }
    .attachment { padding: 10px; background: #f5f5f5; margin: 10px 0; border-radius: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #0052CC; color: white; }
  </style>
</head>
<body>
  <h1>DOSSIÊ PROCESSUAL</h1>
  
  <h2>Dados do Processo</h2>
  <div class="info-grid">
    <div class="label">Número CNJ:</div>
    <div>${process.cnj_number}</div>
    
    <div class="label">Tribunal:</div>
    <div>${process.tribunal || '-'}</div>
    
    <div class="label">Vara/Comarca:</div>
    <div>${process.court_name || '-'}</div>
    
    <div class="label">Status:</div>
    <div>${process.status || '-'}</div>
    
    <div class="label">Fase:</div>
    <div>${process.phase || '-'}</div>
    
    <div class="label">Distribuição:</div>
    <div>${process.distribution_date ? new Date(process.distribution_date).toLocaleDateString('pt-BR') : '-'}</div>
    
    <div class="label">Valor da Causa:</div>
    <div>${process.case_value ? `R$ ${Number(process.case_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}</div>
    
    <div class="label">Juiz:</div>
    <div>${process.judge_name || '-'}</div>
  </div>
  
  <h2>Partes</h2>
  <table>
    <tr>
      <th>Tipo</th>
      <th>Nome</th>
    </tr>
    ${authorNames.map((name: string) => `
      <tr>
        <td>Autor</td>
        <td>${name}</td>
      </tr>
    `).join('')}
    ${defendantNames.map((name: string) => `
      <tr>
        <td>Réu</td>
        <td>${name}</td>
      </tr>
    `).join('')}
  </table>
  
  <h2>Movimentações (${movements.length})</h2>
  ${movements.map(mov => `
    <div class="movement">
      <div class="movement-date">${new Date(mov.movement_date).toLocaleDateString('pt-BR')}</div>
      <div>${mov.description}</div>
      ${mov.movement_type ? `<div style="color: #666; font-size: 0.9em;">Tipo: ${mov.movement_type}</div>` : ''}
    </div>
  `).join('')}
  
  ${attachments.length > 0 ? `
    <h2>Anexos (${attachments.length})</h2>
    ${attachments.map(att => `
      <div class="attachment">
        <strong>${att.attachment_name}</strong><br>
        Tipo: ${att.attachment_type || '-'}<br>
        ${att.filing_date ? `Data: ${new Date(att.filing_date).toLocaleDateString('pt-BR')}<br>` : ''}
        ${att.file_size ? `Tamanho: ${(att.file_size / 1024).toFixed(2)} KB<br>` : ''}
      </div>
    `).join('')}
  ` : ''}
  
  <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 0.9em;">
    <p>Documento gerado em ${new Date().toLocaleString('pt-BR')}</p>
    <p>JusMonitor - Sistema de Consulta Processual</p>
  </div>
</body>
</html>
  `
}
