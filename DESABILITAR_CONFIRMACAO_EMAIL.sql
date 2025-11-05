-- ============================================
-- DESABILITAR CONFIRMAÇÃO DE EMAIL
-- Execute no Supabase SQL Editor
-- ============================================

-- ATENÇÃO: Isso é recomendado apenas para DESENVOLVIMENTO
-- Em PRODUÇÃO, mantenha a confirmação de email habilitada

-- Este script NÃO funciona via SQL
-- Você DEVE fazer isso via Dashboard:
-- 1. Vá em: Authentication → Providers → Email
-- 2. Desabilite "Confirm email"
-- 3. Clique em Save

-- Mas você pode confirmar emails existentes via SQL:

-- 1. Ver usuários não confirmados
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- 2. Confirmar TODOS os usuários não confirmados
UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 3. Confirmar um usuário específico
UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'seu@email.com';

-- 4. Verificar se funcionou
SELECT 
  id,
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Não Confirmado'
    ELSE '✅ Confirmado'
  END as status
FROM auth.users
ORDER BY created_at DESC;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
--
-- Antes:
-- email_confirmed_at: NULL
-- status: ❌ Não Confirmado
--
-- Depois:
-- email_confirmed_at: 2025-01-02 20:45:00
-- status: ✅ Confirmado
--
-- ============================================