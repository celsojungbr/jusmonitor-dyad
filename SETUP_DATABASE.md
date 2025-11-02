# 🗄️ Setup do Banco de Dados JusMonitor

Este documento contém as instruções para configurar o banco de dados do JusMonitor no Supabase.

## 📋 Pré-requisitos

- Acesso ao dashboard do Supabase: https://supabase.com/dashboard
- Project ID: `mklfiunuhaaunytvtnfo`

## 🚀 Aplicar Migrations

### Opção 1: Via SQL Editor (Recomendado)

1. Acesse o dashboard do Supabase
2. Entre no projeto: https://supabase.com/dashboard/project/mklfiunuhaaunytvtnfo
3. Navegue até: **SQL Editor** (ícone de terminal no menu lateral)
4. Clique em **New Query**

#### Passo 1: Criar Schema Completo
Copie todo o conteúdo do arquivo:
```
supabase/migrations/20250102000000_create_complete_schema.sql
```

Cole no SQL Editor e clique em **Run** (ou pressione `Ctrl+Enter`)

Aguarde a execução (pode levar 30-60 segundos). Você deverá ver:
- ✅ 17 tabelas criadas
- ✅ Enums, índices e triggers configurados
- ✅ Funções de helper criadas
- ✅ Dados iniciais inseridos

#### Passo 2: Habilitar RLS
Copie todo o conteúdo do arquivo:
```
supabase/migrations/20250102000001_enable_rls.sql
```

Cole no SQL Editor e clique em **Run**

Aguarde a execução. Você deverá ver:
- ✅ RLS habilitado em todas as tabelas
- ✅ Políticas de segurança criadas
- ✅ Funções auxiliares de RLS configuradas

### Opção 2: Via Supabase CLI (Avançado)

Se tiver o Supabase CLI instalado:

```bash
# Instalar CLI (se necessário)
npm install -g supabase

# Fazer login
supabase login

# Linkar projeto
supabase link --project-ref mklfiunuhaaunytvtnfo

# Aplicar migrations
supabase db push
```

## ✅ Verificar Instalação

Após aplicar as migrations, verifique se está tudo correto:

### 1. Verificar Tabelas
Execute no SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Você deve ver 17 tabelas:
- api_configurations
- credit_transactions
- credits_plans
- credentials_vault
- edge_function_config
- messages
- monitoring_alerts
- monitorings
- notifications
- process_attachments
- process_movements
- processes
- profiles
- system_logs
- user_processes
- user_searches

### 2. Verificar RLS
Execute:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;
```

Deve retornar todas as 17 tabelas com `rowsecurity = true`

### 3. Verificar Dados Iniciais
Execute:

```sql
SELECT * FROM api_configurations;
SELECT * FROM edge_function_config;
```

Você deve ver:
- 2 registros em `api_configurations` (judit e escavador)
- 3 registros em `edge_function_config` (search-processes, get-process-details, download-attachments)

## 🔑 Criar Usuário Admin (IMPORTANTE)

Após aplicar as migrations, você precisa criar um usuário admin:

### Via Dashboard Supabase

1. Vá em **Authentication** → **Users**
2. Clique em **Add user** → **Create new user**
3. Preencha:
   - Email: seu-email@example.com
   - Password: (senha forte)
   - Auto Confirm User: ✅ (marque esta opção)
4. Clique em **Create user**

### Promover para Admin

Após criar o usuário, promova-o para admin:

```sql
-- Substitua 'seu-email@example.com' pelo email do usuário criado
UPDATE profiles
SET user_type = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'seu-email@example.com'
);
```

## 🔐 Configurar APIs (Admin Only)

Após criar o usuário admin e fazer login:

1. Acesse o painel admin: `/admin/apis`
2. Configure as API Keys:
   - **JUDiT**: Insira sua API Key e endpoint
   - **Escavador**: Insira sua API Key e endpoint
3. Teste as conexões usando o botão "Testar"
4. Configure prioridades e fallbacks

## 📊 Schema Visual

```
┌─────────────────┐
│   auth.users    │ (Supabase Auth)
└────────┬────────┘
         │
         ├─────> profiles (user_type, cpf_cnpj, etc.)
         │           │
         │           ├─────> credits_plans
         │           ├─────> user_searches
         │           ├─────> user_processes ──────> processes (DataLake)
         │           ├─────> monitorings             │
         │           ├─────> credentials_vault       ├──> process_movements
         │           ├─────> credit_transactions     └──> process_attachments
         │           ├─────> notifications
         │           └─────> messages
         │
         └─────> system_logs
         └─────> api_configurations (admin)
         └─────> edge_function_config (admin)
```

## 🆘 Troubleshooting

### Erro: "permission denied for schema public"
**Solução**: Você não tem permissões. Use o dashboard do Supabase ou contate o owner do projeto.

### Erro: "relation already exists"
**Solução**: As tabelas já existem. Se quiser resetar:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Depois rode as migrations novamente
```
⚠️ **ATENÇÃO**: Isso apaga TODOS os dados!

### Erro: "function already exists"
**Solução**: Normal se rodar a migration 2x. Ignore ou use `DROP FUNCTION` antes.

### RLS bloqueando acesso
**Solução**: Verifique se o usuário está autenticado e se tem o `user_type` correto.

## 📝 Próximos Passos

Após configurar o banco:

1. ✅ Configure as API Keys via painel admin
2. ✅ Teste as edge functions
3. ✅ Crie usuários de teste
4. ✅ Faça uma consulta de teste
5. ✅ Verifique se os créditos foram debitados corretamente

## 🔗 Links Úteis

- Dashboard Supabase: https://supabase.com/dashboard/project/mklfiunuhaaunytvtnfo
- SQL Editor: https://supabase.com/dashboard/project/mklfiunuhaaunytvtnfo/editor
- Auth Users: https://supabase.com/dashboard/project/mklfiunuhaaunytvtnfo/auth/users
- Table Editor: https://supabase.com/dashboard/project/mklfiunuhaaunytvtnfo/editor

---

**Criado em**: 2025-01-02
**Versão do Schema**: 1.0.0
