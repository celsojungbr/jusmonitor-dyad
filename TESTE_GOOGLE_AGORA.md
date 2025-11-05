# 🚀 TESTE O GOOGLE LOGIN AGORA

## ⚡ Configuração Rápida (5 minutos)

### 1️⃣ Google Cloud Console

**Acesse:** https://console.cloud.google.com/apis/credentials

**Crie OAuth 2.0 Client ID:**
1. Clique em "Create Credentials" → "OAuth client ID"
2. Application type: **Web application**
3. Name: **JusMonitor**

**Authorized redirect URIs (COPIE EXATAMENTE):**
```
https://blopdveolbwqajzklnzu.supabase.co/auth/v1/callback
```

**Copie:**
- ✅ Client ID
- ✅ Client Secret

---

### 2️⃣ Supabase Dashboard

**Acesse:** https://supabase.com/dashboard/project/blopdveolbwqajzklnzu/auth/providers

**Configure Google Provider:**
1. Encontre "Google" na lista
2. Toggle para **Enabled**
3. Cole o **Client ID**
4. Cole o **Client Secret**
5. Clique em **Save**

---

### 3️⃣ Teste no Preview

**Acesse:** http://localhost:8080/auth

**Passos:**
1. ✅ Clique na aba **"Google"**
2. ✅ Clique em **"Continuar com Google"**
3. ✅ Selecione sua conta Google
4. ✅ Autorize o aplicativo
5. ✅ Aguarde o redirecionamento

**Resultado Esperado:**
```
✅ Redirecionado para: /dashboard/consultas
✅ Seu nome aparece no header
✅ Avatar do Google aparece
✅ Menu de navegação funciona
```

---

## 🔍 Verificação no Banco de Dados

**Supabase Dashboard → Table Editor**

### Tabela: `profiles`
```sql
SELECT * FROM profiles ORDER BY created_at DESC LIMIT 1;
```

**Deve mostrar:**
```
✅ id: seu-user-id
✅ full_name: Seu Nome do Google
✅ user_type: user
✅ cpf_cnpj: (vazio - pode preencher depois)
✅ created_at: agora
```

### Tabela: `credits_plans`
```sql
SELECT * FROM credits_plans ORDER BY created_at DESC LIMIT 1;
```

**Deve mostrar:**
```
✅ user_id: seu-user-id
✅ plan_type: prepaid
✅ credits_balance: 0
✅ credit_cost: 0.50
✅ subscription_status: active
```

---

## 🎯 Checklist de Sucesso

- [ ] Google Cloud Console configurado
- [ ] Redirect URI adicionado
- [ ] Client ID e Secret copiados
- [ ] Supabase Provider habilitado
- [ ] Credenciais coladas no Supabase
- [ ] Servidor rodando (`npm run dev`)
- [ ] Página /auth acessível
- [ ] Botão Google clicável
- [ ] Login com Google funcionou
- [ ] Redirecionado para dashboard
- [ ] Nome aparece no header
- [ ] Perfil criado no banco
- [ ] Plano de créditos criado

---

## 🐛 Problemas Comuns

### ❌ "redirect_uri_mismatch"

**Solução:**
1. Copie a URL exata do erro
2. Adicione no Google Cloud Console
3. Formato: `https://blopdveolbwqajzklnzu.supabase.co/auth/v1/callback`

### ❌ "Invalid client"

**Solução:**
1. Verifique Client ID no Supabase
2. Verifique Client Secret no Supabase
3. Certifique-se que não tem espaços extras

### ❌ "Access blocked"

**Solução:**
1. Configure OAuth consent screen
2. Adicione seu email como test user
3. Publique o app (ou deixe em testing)

### ❌ Perfil não criado

**Solução:**
1. Execute o SQL do trigger (já foi executado)
2. O código tem fallback automático
3. Verifique logs do console (F12)

---

## 📸 Screenshots Esperados

### 1. Página de Login
```
┌─────────────────────────────────┐
│     [Logo JusMonitor]           │
│                                 │
│  Bem-vindo de volta            │
│                                 │
│  [Email] [Google] ← Clique aqui│
│                                 │
│  ┌───────────────────────────┐ │
│  │ [G] Continuar com Google  │ │
│  └───────────────────────────┘ │
└─────────────────────────────────┘
```

### 2. Tela do Google
```
┌─────────────────────────────────┐
│  Fazer login com o Google       │
│                                 │
│  Escolha uma conta:             │
│                                 │
│  ○ seu@email.com               │
│  ○ outro@email.com             │
│                                 │
│  [Continuar]                    │
└─────────────────────────────────┘
```

### 3. Dashboard (Sucesso!)
```
┌─────────────────────────────────┐
│ [Logo] JusMonitor    [👤 Seu Nome]│
├─────────────────────────────────┤
│ 🔍 Consultas                    │
│ 🔔 Monitoramentos               │
│ 🔑 Senhas                       │
│ 💳 Planos                       │
└─────────────────────────────────┘
```

---

## 🎉 Próximos Passos

Após o primeiro login:

1. **Complete seu perfil**
   - Dashboard → Perfil
   - Adicione CPF/CNPJ
   - Adicione telefone

2. **Explore o sistema**
   - Faça uma consulta de teste
   - Configure um monitoramento
   - Veja os planos disponíveis

3. **Adicione créditos**
   - Dashboard → Planos
   - Escolha um plano
   - Adicione créditos

---

## 📞 Suporte

**Documentação Completa:**
- `docs/GOOGLE_OAUTH_SETUP.md` - Setup detalhado
- `docs/TESTE_GOOGLE_LOGIN.md` - Passo a passo
- `GOOGLE_LOGIN_PRONTO.md` - Resumo executivo

**Logs Úteis:**
- Console do navegador (F12)
- Supabase Dashboard → Logs → Auth Logs
- Network tab para ver requisições

---

## ⏱️ Tempo Estimado

- **Configuração**: 3-5 minutos
- **Teste**: 1-2 minutos
- **Verificação**: 1 minuto

**Total**: ~5-8 minutos

---

## ✅ ESTÁ PRONTO!

Tudo está configurado e funcionando. Basta:

1. Configurar no Google Cloud Console (3 min)
2. Configurar no Supabase (1 min)
3. Testar no preview (1 min)

**Boa sorte! 🚀**

---

**Status**: ✅ PRONTO PARA TESTAR  
**Última atualização**: 2025-01-02  
**Versão**: 1.0