-- ============================================
-- SCRIPT DE VERIFICAÇÃO - GOOGLE OAUTH
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Verificar se a tabela profiles existe
SELECT 
  'profiles' as tabela,
  COUNT(*) as total_registros
FROM profiles;

-- 2. Verificar se a tabela credits_plans existe
SELECT 
  'credits_plans' as tabela,
  COUNT(*) as total_registros
FROM credits_plans;

-- 3. Verificar se o trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 4. Verificar se a função existe
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

-- 5. Verificar estrutura da tabela profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 6. Verificar estrutura da tabela credits_plans
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'credits_plans'
ORDER BY ordinal_position;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- 
-- 1. profiles: deve existir (pode ter 0 registros)
-- 2. credits_plans: deve existir (pode ter 0 registros)
-- 3. trigger: on_auth_user_created deve existir
-- 4. função: handle_new_user deve existir
-- 5. profiles deve ter colunas: id, full_name, user_type, cpf_cnpj, etc.
-- 6. credits_plans deve ter colunas: id, user_id, plan_type, credits_balance, etc.
--
-- Se algum item não existir, execute o SQL de criação novamente.
-- ============================================