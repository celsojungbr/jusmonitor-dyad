-- ============================================
-- VERIFICAR USUÁRIOS NO BANCO DE DADOS
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Verificar todos os usuários (incluindo não confirmados)
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  raw_user_meta_data->>'full_name' as nome,
  raw_user_meta_data->>'user_type' as tipo
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 2. Verificar perfis criados
SELECT 
  p.id,
  p.full_name,
  p.user_type,
  p.cpf_cnpj,
  p.created_at,
  u.email,
  u.email_confirmed_at
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC
LIMIT 10;

-- 3. Verificar planos de créditos criados
SELECT 
  cp.id,
  cp.user_id,
  cp.plan_type,
  cp.credits_balance,
  cp.created_at,
  u.email
FROM credits_plans cp
LEFT JOIN auth.users u ON u.id = cp.user_id
ORDER BY cp.created_at DESC
LIMIT 10;

-- 4. Verificar se o trigger está funcionando
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 5. Contar usuários por status
SELECT 
  CASE 
    WHEN email_confirmed_at IS NULL THEN 'Não Confirmado'
    ELSE 'Confirmado'
  END as status,
  COUNT(*) as total
FROM auth.users
GROUP BY status;

-- ============================================
-- INTERPRETAÇÃO DOS RESULTADOS:
-- ============================================
--
-- Query 1: Mostra TODOS os usuários
-- - Se aparecer seu email: usuário foi criado ✅
-- - Se email_confirmed_at é NULL: precisa confirmar email ⚠️
-- - Se email_confirmed_at tem data: email confirmado ✅
--
-- Query 2: Mostra perfis criados
-- - Se aparecer: trigger funcionou ✅
-- - Se não aparecer: trigger não funcionou ❌
--
-- Query 3: Mostra planos de créditos
-- - Se aparecer: trigger funcionou completamente ✅
-- - Se não aparecer: trigger falhou parcialmente ❌
--
-- Query 4: Verifica se trigger existe
-- - Se aparecer: trigger está configurado ✅
-- - Se não aparecer: trigger não existe ❌
--
-- Query 5: Resumo de usuários
-- - Mostra quantos confirmados vs não confirmados
--
-- ============================================