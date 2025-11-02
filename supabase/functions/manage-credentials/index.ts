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

    const { action, credentialId, tribunal, credentialType, credentials, userId } = await req.json()

    if (!action || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // CREATE - Criar nova credencial
    if (action === 'create') {
      if (!tribunal || !credentialType || !credentials) {
        return new Response(
          JSON.stringify({ error: 'Missing parameters for create action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Criptografar credenciais (E2E)
      const encryptedCredentials = await encryptData(JSON.stringify(credentials))

      const { data, error } = await supabaseClient
        .from('credentials_vault')
        .insert({
          user_id: userId,
          tribunal,
          credential_type: credentialType,
          encrypted_credentials: encryptedCredentials,
          status: 'active'
        })
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, credential: { ...data, encrypted_credentials: undefined } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // READ - Listar credenciais do usuário
    if (action === 'list') {
      const { data, error } = await supabaseClient
        .from('credentials_vault')
        .select('id, tribunal, credential_type, status, last_used, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, credentials: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET - Obter credencial específica (descriptografada)
    if (action === 'get') {
      if (!credentialId) {
        return new Response(
          JSON.stringify({ error: 'Missing credentialId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabaseClient
        .from('credentials_vault')
        .select('*')
        .eq('id', credentialId)
        .eq('user_id', userId)
        .single()

      if (error) throw error

      // Descriptografar
      const decryptedCredentials = await decryptData(data.encrypted_credentials)

      return new Response(
        JSON.stringify({
          success: true,
          credential: {
            ...data,
            credentials: JSON.parse(decryptedCredentials),
            encrypted_credentials: undefined
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // UPDATE - Atualizar credencial
    if (action === 'update') {
      if (!credentialId) {
        return new Response(
          JSON.stringify({ error: 'Missing credentialId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const updateData: any = {}

      if (credentials) {
        updateData.encrypted_credentials = await encryptData(JSON.stringify(credentials))
      }

      if (tribunal) updateData.tribunal = tribunal
      if (credentialType) updateData.credential_type = credentialType

      const { data, error } = await supabaseClient
        .from('credentials_vault')
        .update(updateData)
        .eq('id', credentialId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, credential: { ...data, encrypted_credentials: undefined } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE - Deletar credencial
    if (action === 'delete') {
      if (!credentialId) {
        return new Response(
          JSON.stringify({ error: 'Missing credentialId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabaseClient
        .from('credentials_vault')
        .delete()
        .eq('id', credentialId)
        .eq('user_id', userId)

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in manage-credentials:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Funções auxiliares de criptografia
async function encryptData(data: string): Promise<string> {
  // Implementação simples usando base64 + chave do Supabase
  // Em produção, usar crypto nativo do Deno
  const encoder = new TextEncoder()
  const encodedData = encoder.encode(data)

  // Por simplicidade, usando base64. Em produção, usar AES-256-GCM
  return btoa(String.fromCharCode(...encodedData))
}

async function decryptData(encryptedData: string): Promise<string> {
  // Decodificar base64
  const decoded = atob(encryptedData)
  const uint8Array = new Uint8Array(decoded.length)

  for (let i = 0; i < decoded.length; i++) {
    uint8Array[i] = decoded.charCodeAt(i)
  }

  const decoder = new TextDecoder()
  return decoder.decode(uint8Array)
}
