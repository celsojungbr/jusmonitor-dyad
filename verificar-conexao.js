// Script para verificar a conexão com o Supabase
// Execute com: node verificar-conexao.js

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://blopdveolbwqajzklnzu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsb3BkdmVvbGJ3cWFqemtsbnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjg5NzIsImV4cCI6MjA3Nzk0NDk3Mn0.D_o4zB9fVanYoOiBO98-ED0G9v8JeUJrLb7JIDNtk5o'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function verificarConexao() {
  console.log('🔍 Verificando conexão com Supabase...')
  console.log('📍 URL:', SUPABASE_URL)
  console.log('🔑 Anon Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...')
  
  try {
    // Tentar buscar usuários
    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Erro ao conectar:', error.message)
      return
    }
    
    console.log('✅ Conexão estabelecida com sucesso!')
    console.log(`📊 Total de perfis no banco: ${count || 0}`)
    
    // Verificar auth.users (se tiver permissão)
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
    
    if (!authError && users) {
      console.log(`👥 Total de usuários: ${users.length}`)
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err)
  }
}

verificarConexao()