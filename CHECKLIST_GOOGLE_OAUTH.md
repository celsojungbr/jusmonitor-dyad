# ✅ Checklist - Google OAuth Setup

## 📋 Pré-Requisitos

- [ ] Conta Google ativa
- [ ] Acesso ao Google Cloud Console
- [ ] Acesso ao Supabase Dashboard
- [ ] Servidor de desenvolvimento rodando

---

## 🔧 Parte 1: Google Cloud Console

### Criar Projeto (se necessário)
- [ ] Acessar https://console.cloud.google.com/
- [ ] Criar novo projeto "JusMonitor"
- [ ] Selecionar o projeto

### Configurar OAuth Consent Screen
- [ ] Menu → APIs & Services → OAuth consent screen
- [ ] User Type: **External**
- [ ] App name: **JusMonitor**
- [ ] User support email: **seu@email.com**
- [ ] Developer contact: **seu@email.com**
- [ ] Salvar e continuar

### Criar OAuth 2.0 Client ID
- [ ] Menu → APIs & Services → Credentials
- [ ] Create Credentials → OAuth client ID
- [ ] Application type: **Web application**
- [ ] Name: **JusMonitor Web Client**

### Adicionar Redirect URI
- [ ] Authorized redirect URIs:
  ```
  https://blopdveolbwqajzklnzu.supabase.co/auth/v1/callback
  ```
- [ ] Criar

### Copiar Credenciais
- [ ] Copiar **Client ID**
- [ ] Copiar **Client Secret**
- [ ] Guardar em local seguro

---

## 🗄️ Parte 2: Supabase Dashboard

### Acessar Configurações
- [ ] Acessar https://supabase.com/dashboard
- [ ] Selecionar projeto JusMonitor
- [ ] Menu → Authentication → Providers

### Configurar Google Provider
- [ ] Encontrar "Google" na lista
- [ ] Clicar para expandir
- [ ] Toggle **Enabled** para ON

### Adicionar Credenciais
- [ ] Colar **Client ID** do Google
- [ ] Colar **Client Secret** do Google
- [ ] Clicar em **Save**

### Verificar Configurações
- [ ] Provider status: **Enabled** ✅
- [ ] Client ID preenchido ✅
- [ ] Client Secret preenchido ✅

---

## 🗃️ Parte 3: Banco de Dados

### Verificar Trigger
- [ ] Supabase → SQL Editor
- [ ] Executar `VERIFICAR_BANCO.sql`
- [ ] Verificar que trigger existe
- [ ] Verificar que função existe

### Verificar Tabelas
- [ ] Tabela `profiles` existe
- [ ] Tabela `credits_plans` existe
- [ ] Colunas corretas em ambas

---

## 🧪 Parte 4: Teste

### Preparar Ambiente
- [ ] Servidor rodando: `npm run dev`
- [ ] Navegador aberto
- [ ] Console do navegador aberto (F12)

### Executar Teste
- [ ] Acessar http://localhost:8080/auth
- [ ] Clicar na aba "Google"
- [ ] Clicar em "Continuar com Google"
- [ ] Selecionar conta Google
- [ ] Autorizar aplicativo

### Verificar Resultado
- [ ] Redirecionado para `/dashboard/consultas`
- [ ] Nome aparece no header
- [ ] Avatar do Google aparece
- [ ] Menu de navegação funciona
- [ ] Sem erros no console

---

## 🔍 Parte 5: Verificação no Banco

### Verificar Usuário
- [ ] Supabase → Authentication → Users
- [ ] Novo usuário aparece
- [ ] Provider: **google**
- [ ] Email confirmado: **true**

### Verificar Perfil
- [ ] Supabase → Table Editor → profiles
- [ ] Novo registro criado
- [ ] `full_name` preenchido
- [ ] `user_type` = **user**
- [ ] `cpf_cnpj` vazio (OK)

### Verificar Créditos
- [ ] Supabase → Table Editor → credits_plans
- [ ] Novo registro criado
- [ ] `plan_type` = **prepaid**
- [ ] `credits_balance` = **0**
- [ ] `credit_cost` = **0.50**

---

## 🎉 Parte 6: Finalização

### Teste Funcionalidades
- [ ] Navegar pelo dashboard
- [ ] Acessar perfil
- [ ] Ver configurações
- [ ] Fazer logout
- [ ] Fazer login novamente

### Documentação
- [ ] Ler `TESTE_GOOGLE_AGORA.md`
- [ ] Ler `docs/GOOGLE_OAUTH_SETUP.md`
- [ ] Guardar credenciais em local seguro

### Próximos Passos
- [ ] Completar perfil (adicionar CPF/CNPJ)
- [ ] Explorar funcionalidades
- [ ] Fazer primeira consulta
- [ ] Configurar monitoramento

---

## 📊 Status Final

### Configuração
- [ ] Google Cloud Console: ✅ Configurado
- [ ] Supabase Provider: ✅ Habilitado
- [ ] Banco de Dados: ✅ Pronto
- [ ] Código: ✅ Implementado

### Teste
- [ ] Login funcionou: ✅
- [ ] Perfil criado: ✅
- [ ] Créditos criados: ✅
- [ ] Dashboard acessível: ✅

### Documentação
- [ ] Setup guide lido: ✅
- [ ] Teste guide lido: ✅
- [ ] Credenciais guardadas: ✅

---

## ⏱️ Tempo Total

- **Configuração**: ~5 minutos
- **Teste**: ~2 minutos
- **Verificação**: ~2 minutos
- **Total**: ~10 minutos

---

## 🆘 Problemas?

Se algo não funcionar:

1. ✅ Verificar redirect URI no Google
2. ✅ Verificar credenciais no Supabase
3. ✅ Verificar logs do console (F12)
4. ✅ Verificar logs do Supabase
5. ✅ Consultar `docs/GOOGLE_OAUTH_SETUP.md`

---

## ✅ PRONTO!

Quando todos os itens estiverem marcados, o Google OAuth está **100% funcional**! 🎊

---

**Data**: ___/___/______  
**Testado por**: _________________  
**Status**: ⬜ Pendente | 🟡 Em Progresso | ✅ Completo