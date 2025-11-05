# Configuração do Google OAuth - JusMonitor

## ✅ Checklist de Configuração

### 1. Configuração no Google Cloud Console

1. **Acesse o Google Cloud Console**
   - Vá para: https://console.cloud.google.com/

2. **Crie um novo projeto (se necessário)**
   - Nome: JusMonitor
   - Organização: Sua organização

3. **Ative a Google+ API**
   - Menu → APIs & Services → Library
   - Busque por "Google+ API"
   - Clique em "Enable"

4. **Configure a tela de consentimento OAuth**
   - Menu → APIs & Services → OAuth consent screen
   - Tipo de usuário: External
   - Nome do aplicativo: JusMonitor
   - Email de suporte: seu@email.com
   - Domínios autorizados: 
     - `localhost` (desenvolvimento)
     - `seu-dominio.com` (produção)
   - Email do desenvolvedor: seu@email.com

5. **Crie credenciais OAuth 2.0**
   - Menu → APIs & Services → Credentials
   - Clique em "Create Credentials" → "OAuth client ID"
   - Tipo de aplicativo: Web application
   - Nome: JusMonitor Web Client
   
   **URIs de redirecionamento autorizados:**
   ```
   # Desenvolvimento
   http://localhost:8080/auth/callback
   
   # Supabase (IMPORTANTE!)
   https://blopdveolbwqajzklnzu.supabase.co/auth/v1/callback
   
   # Produção (quando tiver)
   https://seu-dominio.com/auth/callback
   ```

6. **Copie as credenciais**
   - Client ID: `seu-client-id.apps.googleusercontent.com`
   - Client Secret: `seu-client-secret`

### 2. Configuração no Supabase

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto: JusMonitor

2. **Configure o Google Provider**
   - Menu → Authentication → Providers
   - Encontre "Google" na lista
   - Clique em "Enable"

3. **Adicione as credenciais**
   - **Client ID**: Cole o Client ID do Google
   - **Client Secret**: Cole o Client Secret do Google
   
4. **Configure as URLs de redirecionamento**
   - **Site URL**: `http://localhost:8080` (desenvolvimento)
   - **Redirect URLs**: 
     ```
     http://localhost:8080/auth/callback
     http://localhost:8080/dashboard/consultas
     ```

5. **Salve as configurações**

### 3. Variáveis de Ambiente

Certifique-se que seu `.env` tem:

```env
VITE_SUPABASE_URL=https://blopdveolbwqajzklnzu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=seu_anon_key_aqui
```

### 4. Teste a Configuração

1. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

2. **Acesse a página de login**
   - Vá para: http://localhost:8080/auth

3. **Clique na aba "Google"**

4. **Clique em "Continuar com Google"**

5. **Selecione sua conta Google**

6. **Autorize o aplicativo**

7. **Verifique se foi redirecionado para o dashboard**

## 🔍 Verificação Pós-Login

Após fazer login com Google, verifique:

### No Supabase Dashboard

1. **Authentication → Users**
   - ✅ Novo usuário aparece na lista
   - ✅ Provider: google
   - ✅ Email confirmado

2. **Table Editor → profiles**
   - ✅ Perfil criado automaticamente
   - ✅ `full_name` preenchido com nome do Google
   - ✅ `user_type` = 'user'
   - ✅ `cpf_cnpj` vazio (será preenchido depois)

3. **Table Editor → credits_plans**
   - ✅ Plano de créditos criado
   - ✅ `plan_type` = 'prepaid'
   - ✅ `credits_balance` = 0
   - ✅ `credit_cost` = 0.50

### No Aplicativo

1. **Dashboard carregou corretamente**
   - ✅ Nome do usuário aparece no header
   - ✅ Avatar do Google aparece (se disponível)
   - ✅ Menu de navegação funciona

2. **Perfil do usuário**
   - ✅ Acesse: Dashboard → Perfil
   - ✅ Nome está correto
   - ✅ Email está correto
   - ✅ Tipo de usuário: "Usuário"

## 🐛 Troubleshooting

### Erro: "redirect_uri_mismatch"

**Causa**: URL de redirecionamento não está configurada no Google Cloud Console

**Solução**:
1. Vá para Google Cloud Console → Credentials
2. Edite o OAuth 2.0 Client ID
3. Adicione a URL exata que aparece no erro
4. Salve e tente novamente

### Erro: "Invalid client"

**Causa**: Client ID ou Client Secret incorretos

**Solução**:
1. Verifique as credenciais no Google Cloud Console
2. Copie novamente o Client ID e Client Secret
3. Cole no Supabase Dashboard → Authentication → Providers → Google
4. Salve e tente novamente

### Erro: "Access blocked: This app's request is invalid"

**Causa**: Tela de consentimento OAuth não configurada

**Solução**:
1. Vá para Google Cloud Console → OAuth consent screen
2. Complete todas as informações obrigatórias
3. Adicione os escopos necessários:
   - `email`
   - `profile`
   - `openid`
4. Salve e tente novamente

### Perfil não foi criado automaticamente

**Causa**: Trigger do banco de dados não está funcionando

**Solução**:
1. Execute o SQL fornecido para criar o trigger
2. Ou crie o perfil manualmente via código (já implementado no OAuthCallback)

### Usuário não é redirecionado após login

**Causa**: URL de redirecionamento incorreta

**Solução**:
1. Verifique se `/auth/callback` está configurado nas rotas
2. Verifique se o componente `OAuthCallback` existe
3. Verifique os logs do console para erros

## 📝 URLs Importantes

### Desenvolvimento
- **App**: http://localhost:8080
- **Login**: http://localhost:8080/auth
- **Callback**: http://localhost:8080/auth/callback
- **Dashboard**: http://localhost:8080/dashboard/consultas

### Supabase
- **Auth Callback**: https://blopdveolbwqajzklnzu.supabase.co/auth/v1/callback
- **Dashboard**: https://supabase.com/dashboard/project/blopdveolbwqajzklnzu

### Google Cloud
- **Console**: https://console.cloud.google.com/
- **Credentials**: https://console.cloud.google.com/apis/credentials

## ✅ Checklist Final

Antes de criar o primeiro usuário, verifique:

- [ ] Google Cloud Console configurado
- [ ] OAuth 2.0 Client ID criado
- [ ] URIs de redirecionamento configurados
- [ ] Supabase Provider habilitado
- [ ] Client ID e Secret configurados no Supabase
- [ ] Trigger do banco de dados criado
- [ ] Componente OAuthCallback criado
- [ ] Rota `/auth/callback` adicionada
- [ ] Servidor de desenvolvimento rodando
- [ ] Página de login acessível

## 🎉 Pronto para Testar!

Agora você pode:

1. Acessar http://localhost:8080/auth
2. Clicar na aba "Google"
3. Clicar em "Continuar com Google"
4. Fazer login com sua conta Google
5. Ser redirecionado para o dashboard

O perfil e plano de créditos serão criados automaticamente! 🚀

---

**Última atualização**: 2025-01-02  
**Versão**: 1.0  
**Status**: ✅ Pronto para uso