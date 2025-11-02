# 🔐 Configuração e Testes de APIs - JusMonitor

Este guia explica como configurar as secrets das APIs e executar os testes.

## 📋 Status Atual

### ✅ Criado:
- Scripts de teste para API JUDiT (`.ts` e `.mjs`)
- Scripts de teste para API Escavador (`.ts` e `.mjs`)
- Script master para executar todos os testes
- Documentação completa

### ⚠️ Necessário:
- Configurar as secrets `JUDIT_API_KEY` e `ESCAVADOR_API_KEY`
- Executar os testes com as APIs reais

## 🔑 Como Configurar as Secrets

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/mklfiunuhaaunytvtnfo
2. Vá em **Settings** → **Edge Functions** → **Secrets**
3. Adicione as seguintes secrets:
   ```
   JUDIT_API_KEY = sua-chave-judit-aqui
   ESCAVADOR_API_KEY = sua-chave-escavador-aqui
   ```
4. Clique em **Save**

### Opção 2: Via Supabase CLI

```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Login no Supabase
supabase login

# Link com o projeto
supabase link --project-ref mklfiunuhaaunytvtnfo

# Configurar secrets
supabase secrets set JUDIT_API_KEY=sua-chave-judit
supabase secrets set ESCAVADOR_API_KEY=sua-chave-escavador

# Verificar secrets configuradas
supabase secrets list
```

### Opção 3: Para Testes Locais (Desenvolvimento)

```bash
# Criar arquivo .env.local (NÃO COMMITAR)
cat > .env.local << EOF
JUDIT_API_KEY=sua-chave-judit
ESCAVADOR_API_KEY=sua-chave-escavador
EOF

# Carregar variáveis e executar teste
export $(cat .env.local | xargs) && node test-judit-api.mjs
```

## 🚀 Como Executar os Testes

### Método 1: Testes Locais com Node.js

```bash
# Configurar as variáveis de ambiente
export JUDIT_API_KEY=sua-chave-judit
export ESCAVADOR_API_KEY=sua-chave-escavador

# Testar apenas JUDiT
node test-judit-api.mjs

# Testar apenas Escavador
node test-escavador-api.mjs

# Ver resultados
cat test-results-judit-*.json | jq .
cat test-results-escavador-*.json | jq .
```

### Método 2: Testes via Edge Functions (Produção)

As edge functions já estão configuradas para usar as secrets automaticamente quando deployadas no Supabase.

```bash
# Deploy das edge functions
supabase functions deploy create-monitoring
supabase functions deploy check-monitoring
supabase functions deploy search-processes
supabase functions deploy get-process-details

# Testar edge function
curl -X POST \
  https://mklfiunuhaaunytvtnfo.supabase.co/functions/v1/search-processes \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "searchType": "cpf",
    "searchValue": "12345678900",
    "userId": "user-id-here"
  }'
```

## 📊 Interpretando os Resultados

### Cenários Esperados:

#### ✅ Sucesso (Status 200)
```json
{
  "test": "Busca por CPF",
  "success": true,
  "status": 200,
  "latency": 1234,
  "data": {
    "lawsuits": [...],
    "total": 5
  }
}
```
**Ação**: API está funcionando corretamente. Endpoints estão corretos.

#### ❌ Não Autorizado (Status 401)
```json
{
  "test": "Busca por CPF",
  "success": false,
  "status": 401,
  "error": "Unauthorized"
}
```
**Causa**: API key inválida ou expirada
**Solução**: Verificar se a chave está correta no dashboard da API

#### ❌ Endpoint Não Encontrado (Status 404)
```json
{
  "test": "Busca por CPF",
  "success": false,
  "status": 404,
  "error": "Not Found"
}
```
**Causa**: Endpoint mudou ou está incorreto
**Solução**: Consultar documentação oficial da API para endpoint correto

#### ❌ Rate Limit (Status 429)
```json
{
  "test": "Busca por CPF",
  "success": false,
  "status": 429,
  "error": "Too Many Requests"
}
```
**Causa**: Muitas requisições em curto período
**Solução**: Aguardar alguns minutos antes de testar novamente

#### ❌ Créditos Insuficientes (Status 402/403)
```json
{
  "test": "Busca por CPF",
  "success": false,
  "status": 402,
  "error": "Payment Required"
}
```
**Causa**: Saldo de créditos da API esgotado
**Solução**: Recarregar créditos no painel da API

#### ❌ Erro de Rede
```json
{
  "test": "Busca por CPF",
  "success": false,
  "error": "fetch failed"
}
```
**Causa**: API fora do ar ou problemas de conectividade
**Solução**: Verificar status da API ou tentar novamente mais tarde

## 📝 Próximos Passos Após os Testes

### 1. Analisar Resultados
```bash
# Ver resumo consolidado
cat test-results-*.json | jq '.summary'

# Ver endpoints que funcionaram
cat test-results-*.json | jq '.tests[] | select(.success==true) | .test'

# Ver endpoints que falharam
cat test-results-*.json | jq '.tests[] | select(.success==false) | {test, status, error}'
```

### 2. Atualizar Edge Functions

Com base nos resultados, atualizar os endpoints nas edge functions:

```typescript
// Em: supabase/functions/search-processes/index.ts

// ❌ ANTES (endpoint incorreto)
const response = await fetch(`${apiConfig.endpoint_url}/v1/search`, ...)

// ✅ DEPOIS (endpoint correto baseado nos testes)
const response = await fetch(`${apiConfig.endpoint_url}/v1/requests/request-document`, ...)
```

### 3. Commitar Correções

```bash
# Adicionar arquivos modificados
git add supabase/functions/

# Criar commit
git commit -m "fix: Corrigir endpoints das APIs baseado em testes reais"

# Push para branch
git push -u origin claude/test-real-apis-011CUjHCPNwAtVgpaUsdc9Ah
```

## 🔒 Segurança

### ⚠️ IMPORTANTE:

1. **NUNCA** commite secrets no git
2. **SEMPRE** use `.env.local` (já está no .gitignore)
3. **SEMPRE** use secrets do Supabase em produção
4. **NUNCA** exponha API keys em logs ou código frontend

### Arquivos a Ignorar:

```bash
# Adicionar ao .gitignore se não estiver
echo ".env.local" >> .gitignore
echo "test-results-*.json" >> .gitignore
```

## 📚 Documentação das APIs

### JUDiT
- **Dashboard**: https://app.judit.io (verificar URL correta)
- **Documentação**: Solicitar acesso ao suporte
- **Base URL**: https://api.judit.io

### Escavador
- **Dashboard**: https://www.escavador.com/api
- **Documentação**: https://api.escavador.com/docs
- **Base URL**: https://api.escavador.com

## 🐛 Troubleshooting

### Problema: "API key não encontrada"
```bash
# Verificar se variável está exportada
echo $JUDIT_API_KEY
echo $ESCAVADOR_API_KEY

# Se vazio, exportar novamente
export JUDIT_API_KEY=sua-chave
export ESCAVADOR_API_KEY=sua-chave
```

### Problema: "Node.js não suporta fetch"
```bash
# Verificar versão do Node.js (precisa ser 18+)
node --version

# Se for menor que 18, atualizar Node.js
# ou usar Deno (quando disponível)
```

### Problema: "Erro ao salvar resultados JSON"
```bash
# Verificar permissões de escrita
ls -la .

# Se necessário, dar permissões
chmod +w .
```

### Problema: "Todos os testes falhando"
```bash
# Verificar conectividade
ping api.judit.io
ping api.escavador.com

# Testar manualmente com curl
curl -H "Authorization: Bearer $JUDIT_API_KEY" https://api.judit.io/v1/health
```

## 📞 Suporte

Se precisar de ajuda:

1. **Verificar logs detalhados** nos arquivos JSON gerados
2. **Consultar documentação** oficial das APIs
3. **Verificar status** das APIs (status pages)
4. **Contatar suporte** das APIs se necessário

---

**Última atualização**: 2025-11-02
**Versão**: 1.0
**Autor**: Claude Agent
