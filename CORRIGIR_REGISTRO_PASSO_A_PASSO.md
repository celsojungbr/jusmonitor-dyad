# 🔧 Corrigir Registro - Passo a Passo

## 🎯 Objetivo

Fazer com que usuários criados apareçam no painel do Supabase.

---

## 📍 PASSO 1: Verificar Configuração de Email (2 min)

### 1.1 Acesse o Supabase Dashboard

```
https://supabase.com/dashboard/project/blopdveolbwqajzklnzu/auth/providers
```

### 1.2 Vá em "Email" Provider

- Clique em "Email" na lista de providers
- Procure por: **"Confirm email"**

### 1.3 Verifique o Status

**Se estiver HABILITADO (ON):**
```
✅ Confirm email: ON
```
→ Usuários precisam confirmar email antes de aparecer

**Se estiver DESABILITADO (OFF):**
```
❌ Confirm email: OFF
```
→ Usuários aparecem imediatamente

### 1.4 Decisão

**Para DESENVOLVIMENTO (Recomendado):**
- ✅ Desabilite "Confirm email"
- Isso permite testar sem precisar confirmar email

**Para PRODUÇÃO:**
- ✅ Mantenha "Confirm email" habilitado
- Mais seguro, mas precisa confirmar email

### 1.5 Como Desabilitar (Desenvolvimento)

1. Clique em "Email" provider
2. Procure "Confirm email"
3. Toggle para **OFF**
4. Clique em **Save**

---

## 📍 PASSO 2: Verificar Usuários Existentes (2 min)

### 2.1 Acesse Lista de Usuários

```
https://supabase.com/dashboard/project/blopdveolbwqajzklnzu/auth/users
```

### 2.2 Remova Filtros

- Procure por um dropdown ou filtro
- Selecione **"All users"** (não "Confirmed only")

### 2.3 Procure Seu Usuário

- Use a busca (🔍) para procurar seu email
- Verifique a coluna "Status"

**Possíveis Status:**
- ✅ **Confirmed** - Email confirmado, tudo OK
- ⚠️ **Waiting for verification** - Precisa confirmar email
- ❌ **Não aparece** - Usuário não foi criado

### 2.4 Se Encontrou o Usuário

**Status: "Waiting for verification"**

Opção A - Confirmar Manualmente:
1. Clique nos 3 pontinhos (...) ao lado do usuário
2. Clique em "Confirm email"
3. Pronto! Usuário confirmado

Opção B - Desabilitar confirmação (ver Passo 1.5)

---

## 📍 PASSO 3: Executar SQL de Verificação (3 min)

### 3.1 Acesse SQL Editor

```
https://supabase.com/dashboard/project/blopdveolbwqajzklnzu/sql/new
```

### 3.2 Cole o SQL

Copie todo o conteúdo de `VERIFICAR_USUARIOS.sql` e cole no editor.

### 3.3 Execute

- Clique em **Run** (ou Ctrl+Enter)
- Aguarde os resultados

### 3.4 Analise os Resultados

**Query 1 - Todos os Usuários:**
```sql
-- Se aparecer seu email aqui: ✅ Usuário foi criado
-- Se email_confirmed_at é NULL: ⚠️ Precisa confirmar
-- Se não aparecer: ❌ Usuário não foi criado
```

**Query 2 - Perfis:**
```sql
-- Se aparecer: ✅ Trigger funcionou
-- Se não aparecer: ❌ Trigger não funcionou
```

**Query 3 - Planos de Créditos:**
```sql
-- Se aparecer: ✅ Tudo funcionou
-- Se não aparecer: ❌ Problema no trigger
```

---

## 📍 PASSO 4: Testar Novamente com Logs (3 min)

### 4.1 Abra o Console do Navegador

- Pressione **F12**
- Vá para a aba **Console**
- Limpe o console (ícone 🚫)

### 4.2 Tente Criar Novo Usuário

1. Vá para: http://localhost:8080/auth
2. Preencha o formulário de registro
3. Use um **email diferente** (ex: teste2@email.com)
4. Clique em "Criar Conta"

### 4.3 Observe os Logs

Você deve ver logs assim:

```
🔵 Iniciando registro de usuário: { email: "...", fullName: "...", userType: "..." }
✅ Usuário criado com sucesso: { userId: "...", email: "...", confirmed: "Não", session: "Não criada" }
```

**Se aparecer:**
```
⚠️ Usuário criado mas precisa confirmar email
```
→ Confirmação de email está habilitada (ver Passo 1)

**Se aparecer:**
```
❌ Erro no registro: ...
```
→ Copie o erro completo e me envie

### 4.4 Verifique no Supabase

- Volte para: Authentication → Users
- Atualize a página (F5)
- Procure pelo novo email
- Deve aparecer agora!

---

## 📍 PASSO 5: Confirmar Email Manualmente (Se Necessário)

### 5.1 Se Usuário Está "Waiting for verification"

**Opção A - Via Dashboard:**
1. Authentication → Users
2. Encontre o usuário
3. Clique em "..." → "Confirm email"

**Opção B - Via SQL:**
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'seu@email.com';
```

### 5.2 Verifique Perfil e Créditos

Execute novamente as queries 2 e 3 do `VERIFICAR_USUARIOS.sql`

---

## ✅ Checklist Final

Depois de seguir todos os passos:

- [ ] Confirmação de email está desabilitada (desenvolvimento)
- [ ] Consegui ver usuários no Supabase Dashboard
- [ ] Executei o SQL de verificação
- [ ] Usuários aparecem na query 1
- [ ] Perfis aparecem na query 2
- [ ] Planos aparecem na query 3
- [ ] Testei criar novo usuário
- [ ] Vi os logs no console
- [ ] Novo usuário apareceu no dashboard
- [ ] Consigo fazer login com o novo usuário

---

## 🐛 Problemas Comuns

### Problema 1: Usuário não aparece em lugar nenhum

**Causa:** Erro no registro

**Solução:**
1. Verifique logs do console (F12)
2. Procure por erros em vermelho
3. Me envie o erro completo

### Problema 2: Usuário aparece mas perfil não

**Causa:** Trigger não funcionou

**Solução:**
1. Execute o SQL do trigger novamente (já foi executado)
2. Crie o perfil manualmente via SQL:
```sql
INSERT INTO profiles (id, full_name, user_type, cpf_cnpj)
VALUES (
  'user-id-aqui',
  'Nome do Usuário',
  'user',
  ''
);
```

### Problema 3: Usuário aparece mas não consigo fazer login

**Causa:** Email não confirmado

**Solução:**
1. Confirme o email manualmente (Passo 5)
2. Ou desabilite confirmação de email (Passo 1)

---

## 📊 Resultado Esperado

Depois de seguir todos os passos:

**No Supabase Dashboard:**
```
Authentication → Users
✅ Seu usuário aparece
✅ Status: Confirmed
✅ Email confirmado
```

**No SQL:**
```
Query 1: ✅ Usuário aparece
Query 2: ✅ Perfil aparece
Query 3: ✅ Plano aparece
```

**No Aplicativo:**
```
✅ Consegue fazer login
✅ Redireciona para dashboard
✅ Nome aparece no header
```

---

## 🆘 Precisa de Ajuda?

Se depois de seguir todos os passos ainda não funcionar:

1. **Copie os resultados do SQL** (todas as 5 queries)
2. **Copie os logs do console** (F12)
3. **Tire um screenshot** do painel de usuários
4. **Me envie** essas informações

Com isso posso identificar exatamente o problema!

---

**Tempo Total:** ~10 minutos  
**Dificuldade:** Fácil  
**Status:** 🔧 Pronto para executar