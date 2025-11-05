# ⚡ Solução Rápida - Registro de Usuários

## 🎯 Problema

Usuários criados não aparecem no painel do Supabase.

## ✅ Solução (2 minutos)

### **Desabilitar Confirmação de Email**

1. **Acesse o Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/blopdveolbwqajzklnzu/auth/providers
   ```

2. **Clique em "Email"** na lista de providers

3. **Procure por "Confirm email"**

4. **Desabilite** (toggle para OFF)

5. **Clique em "Save"**

**Pronto!** Agora os usuários aparecem imediatamente após o registro.

---

## 🔍 Verificar Usuários Existentes

### Via Dashboard

1. Acesse: https://supabase.com/dashboard/project/blopdveolbwqajzklnzu/auth/users

2. Procure por "All users" ou remova filtros

3. Seu usuário deve aparecer com status "Waiting for verification"

### Confirmar Email Manualmente

**Opção 1 - Via Dashboard:**
1. Encontre o usuário
2. Clique em "..." (três pontinhos)
3. Clique em "Confirm email"

**Opção 2 - Via SQL:**
```sql
-- Confirmar um usuário específico
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'seu@email.com';

-- Confirmar TODOS os usuários
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

---

## 🧪 Testar Novamente

1. **Abra o console do navegador (F12)**

2. **Vá para a aba "Console"**

3. **Acesse:** http://localhost:8080/auth

4. **Crie um novo usuário** (use email diferente)

5. **Observe os logs:**
   ```
   🔵 Iniciando registro de usuário: { email: "...", fullName: "...", userType: "..." }
   ✅ Usuário criado: { userId: "...", email: "...", emailConfirmed: "Não", sessionCreated: "Não" }
   ⚠️ Usuário criado mas precisa confirmar email
   ```

6. **Se aparecer a mensagem:**
   ```
   "Verifique seu email! Enviamos um link de confirmação..."
   ```
   → Confirmação de email está habilitada (volte ao Passo 1)

7. **Se redirecionar para o dashboard:**
   ```
   "Conta criada com sucesso!"
   ```
   → Tudo funcionando! ✅

---

## 📊 Verificar no Banco

Execute este SQL no Supabase SQL Editor:

```sql
-- Ver todos os usuários
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data->>'full_name' as nome
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Ver perfis criados
SELECT 
  p.id,
  p.full_name,
  p.user_type,
  u.email,
  u.email_confirmed_at
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC
LIMIT 5;
```

**Resultado Esperado:**
- ✅ Usuário aparece na primeira query
- ✅ Perfil aparece na segunda query
- ✅ `email_confirmed_at` tem uma data (ou NULL se não confirmado)

---

## 🎉 Checklist Final

- [ ] Desabilitei "Confirm email" no Supabase
- [ ] Confirmei emails existentes (se necessário)
- [ ] Testei criar novo usuário
- [ ] Vi os logs no console (F12)
- [ ] Usuário apareceu no dashboard do Supabase
- [ ] Perfil foi criado automaticamente
- [ ] Consigo fazer login

---

## 📞 Ainda Não Funciona?

Se depois de seguir estes passos ainda não funcionar:

1. **Copie os logs do console** (F12 → Console)
2. **Execute o SQL de verificação** acima
3. **Copie os resultados**
4. **Me envie** essas informações

---

**Tempo:** 2 minutos  
**Dificuldade:** ⭐ Muito Fácil  
**Status:** ✅ Pronto para executar