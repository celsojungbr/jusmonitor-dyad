# 🧪 Guia de Testes de APIs - JusMonitor

## 📝 Resumo

Este documento descreve o sistema de testes criado para validar as integrações com as APIs JUDiT e Escavador usando as secrets já configuradas no projeto.

## 🎯 Objetivo

Testar os endpoints reais das APIs JUDiT e Escavador para:

1. ✅ Validar que as API keys estão funcionando
2. ✅ Identificar endpoints corretos (vs. genéricos usados atualmente)
3. ✅ Medir latência e performance
4. ✅ Detectar erros e limitações
5. ✅ Gerar relatórios detalhados em JSON

## 📦 Arquivos Criados

### Scripts de Teste

1. **`test-judit-api.ts`** - Teste Deno para API JUDiT
   - 9 testes cobrindo principais endpoints
   - Suporta execução via Deno runtime

2. **`test-judit-api.mjs`** - Teste Node.js para API JUDiT
   - Mesmos testes em formato Node.js ESM
   - Compatível com Node.js 18+

3. **`test-escavador-api.ts`** - Teste Deno para API Escavador
   - 10 testes cobrindo principais endpoints
   - Inclui busca assíncrona, callbacks, monitoramentos

4. **`test-escavador-api.mjs`** - Teste Node.js para API Escavador
   - Mesmos testes em formato Node.js ESM
   - Compatível com Node.js 18+

5. **`test-all-apis.ts`** - Script master Deno
   - Executa todos os testes em sequência
   - Gera relatório consolidado

6. **`run-tests.sh`** - Script Bash auxiliar
   - Interface amigável com cores
   - Validação de pré-requisitos
   - Suporte a execução seletiva

### Documentação

7. **`TEST_APIS_README.md`** - README dos scripts de teste
   - Descrição de cada script
   - Como executar
   - Interpretação de resultados

8. **`SETUP_API_TESTING.md`** - Guia de configuração
   - Como configurar secrets
   - Troubleshooting completo
   - Próximos passos

9. **`API_TESTING_GUIDE.md`** (este arquivo)
   - Visão geral do sistema de testes
   - Estrutura de endpoints testados

## 🔬 Endpoints Testados

### API JUDiT

| # | Endpoint | Método | Descrição |
|---|----------|--------|-----------|
| 1 | `/v1/health` | GET | Health check |
| 2 | `/v1/requests/request-document` | POST | Busca por CPF/CNPJ |
| 3 | `/v1/requests/request-document` | POST | Busca por CNPJ |
| 4 | `/v1/requests/requests` | POST | Busca por CNJ |
| 5 | `/v1/requests/name` | POST | Busca por nome |
| 6 | `/v1/registration-data/registration-data` | POST | Dados cadastrais |
| 7 | `/v1/tracking/tracking` | POST | Criar tracking |
| 8 | `/v1/criminal-consultation/warrant` | POST | Consulta penal |
| 9 | `/v1/resource/consumption` | GET | Consumo de créditos |

### API Escavador

| # | Endpoint | Método | Descrição |
|---|----------|--------|-----------|
| 1 | `/v1/saldo` | GET | Consultar saldo |
| 2 | `/v1/busca` | POST | Busca geral |
| 3 | `/v1/pesquisas/cpf-cnpj` | POST | Pesquisa por CPF |
| 4 | `/v1/pesquisas/oab` | POST | Pesquisa por OAB |
| 5 | `/v1/pesquisas/processo` | POST | Pesquisa assíncrona |
| 6 | `/v1/tribunais` | GET | Listar tribunais |
| 7 | `/v1/busca-assincrona` | POST | Busca assíncrona |
| 8 | `/v1/callbacks` | GET | Listar callbacks |
| 9 | `/v1/monitoramentos` | GET | Listar monitoramentos |
| 10 | `/v1/diarios-oficiais/origens` | GET | Diários oficiais |

## 🚀 Como Usar

### Passo 1: Configurar Secrets

#### Opção A: Via Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/mklfiunuhaaunytvtnfo
2. **Settings** → **Edge Functions** → **Secrets**
3. Adicione:
   ```
   JUDIT_API_KEY = sua-chave
   ESCAVADOR_API_KEY = sua-chave
   ```

#### Opção B: Localmente (Desenvolvimento)

```bash
# Criar arquivo .env.local
cat > .env.local << EOF
JUDIT_API_KEY=sua-chave-judit
ESCAVADOR_API_KEY=sua-chave-escavador
EOF

# Carregar variáveis
export $(cat .env.local | xargs)
```

### Passo 2: Executar Testes

#### Método Simplificado (Recomendado)

```bash
# Executar todos os testes
./run-tests.sh

# Apenas JUDiT
./run-tests.sh judit

# Apenas Escavador
./run-tests.sh escavador

# Ajuda
./run-tests.sh help
```

#### Método Manual

```bash
# Com Node.js
node test-judit-api.mjs
node test-escavador-api.mjs

# Com Deno (se disponível)
deno run --allow-env --allow-net test-judit-api.ts
deno run --allow-env --allow-net test-escavador-api.ts
```

### Passo 3: Analisar Resultados

```bash
# Ver resumo
cat test-results-judit-*.json | jq '.summary'
cat test-results-escavador-*.json | jq '.summary'

# Ver endpoints que funcionaram
cat test-results-*.json | jq '.tests[] | select(.success==true) | .test'

# Ver endpoints que falharam com detalhes
cat test-results-*.json | jq '.tests[] | select(.success==false) | {test, status, error}'

# Ver latências
cat test-results-*.json | jq '.tests[] | select(.success==true) | {test, latency}'
```

## 📊 Formato dos Resultados

### Estrutura do JSON

```json
{
  "timestamp": "2025-11-02T10:30:45.123Z",
  "api": "JUDiT",
  "baseUrl": "https://api.judit.io",
  "summary": {
    "total": 9,
    "success": 7,
    "failed": 2,
    "successRate": "77.8%"
  },
  "tests": [
    {
      "test": "Busca por CPF",
      "success": true,
      "status": 200,
      "latency": 1234,
      "data": { ... }
    },
    {
      "test": "Health Check",
      "success": false,
      "status": 404,
      "error": "Not Found",
      "latency": 123
    }
  ]
}
```

## 🔍 Diagnóstico de Problemas

### Status HTTP e Significados

| Status | Significado | Causa Provável | Solução |
|--------|-------------|----------------|---------|
| 200 | Sucesso | - | Endpoint correto ✅ |
| 401 | Não autorizado | API key inválida | Verificar chave no dashboard |
| 403 | Proibido | Sem créditos ou permissão | Recarregar créditos |
| 404 | Não encontrado | Endpoint incorreto | Consultar docs da API |
| 429 | Rate limit | Muitas requisições | Aguardar alguns minutos |
| 500 | Erro interno | Problema na API | Contactar suporte |

## 📈 Próximos Passos

### 1. Após Executar os Testes

1. ✅ Revisar relatórios JSON gerados
2. ✅ Identificar endpoints corretos (status 200)
3. ✅ Anotar endpoints que precisam correção (404)
4. ✅ Verificar latências médias

### 2. Atualizar Edge Functions

Com base nos resultados, atualizar:

- `supabase/functions/search-processes/index.ts`
- `supabase/functions/get-process-details/index.ts`
- `supabase/functions/check-monitoring/index.ts`
- `supabase/functions/download-attachments/index.ts`

Exemplo de correção:

```typescript
// ❌ ANTES
const response = await fetch(`${apiConfig.endpoint_url}/v1/search`, {
  method: 'POST',
  body: JSON.stringify({ query: searchValue })
})

// ✅ DEPOIS (baseado em teste que retornou 200)
const response = await fetch(`${apiConfig.endpoint_url}/v1/requests/request-document`, {
  method: 'POST',
  body: JSON.stringify({
    document: searchValue,
    document_type: 'CPF',
    cache: true
  })
})
```

### 3. Validar em Produção

```bash
# Deploy das edge functions corrigidas
supabase functions deploy search-processes
supabase functions deploy get-process-details

# Testar endpoints deployados
curl -X POST \
  https://mklfiunuhaaunytvtnfo.supabase.co/functions/v1/search-processes \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"searchType":"cpf","searchValue":"12345678900","userId":"user-id"}'
```

### 4. Documentar Descobertas

Criar issue ou documento com:
- Endpoints corretos identificados
- Endpoints que não funcionam
- Endpoints alternativos descobertos
- Recomendações de otimização

## 🔐 Segurança

### ⚠️ Regras Importantes

1. **NUNCA** commite `.env.local` no git
2. **SEMPRE** use secrets do Supabase em produção
3. **NUNCA** exponha API keys em logs
4. **SEMPRE** adicione `*.env*` ao `.gitignore`

### Arquivos no .gitignore

```gitignore
.env.local
.env.*.local
test-results-*.json
```

## 📞 Suporte e Recursos

### Documentação Oficial

- **JUDiT**: https://app.judit.io (solicitar docs ao suporte)
- **Escavador**: https://api.escavador.com/docs

### Status das APIs

- Verificar se APIs estão online antes de testar
- Conferir se há manutenções programadas
- Validar saldo de créditos suficiente

### Troubleshooting

Ver guia completo em `SETUP_API_TESTING.md`

## 💡 Dicas e Boas Práticas

### Executar Testes

1. Executar em horário de baixo tráfego (evitar rate limits)
2. Ter créditos suficientes nas APIs (pelo menos 100 de cada)
3. Salvar resultados antes de executar novamente
4. Documentar descobertas imediatamente

### Interpretar Resultados

1. Priorizar endpoints com status 200
2. Investigar 404 (podem ter mudado)
3. Ignorar temporariamente 429 (rate limit)
4. Para 401, verificar chave da API

### Manutenção

1. Executar testes mensalmente
2. Atualizar endpoints se APIs mudarem
3. Revisar latências e performance
4. Manter documentação atualizada

## 📝 Changelog

### 2025-11-02 - v1.0
- ✅ Criação inicial dos scripts de teste
- ✅ Suporte para JUDiT e Escavador
- ✅ Versões Deno e Node.js
- ✅ Documentação completa
- ✅ Script auxiliar Bash
- ✅ Formatação de relatórios JSON

## 🎯 Próxima Versão (v1.1)

- [ ] Adicionar testes para novos endpoints descobertos
- [ ] Implementar retry automático com backoff
- [ ] Dashboard HTML para visualizar resultados
- [ ] Testes de carga (stress test)
- [ ] Integração com CI/CD
- [ ] Alertas automáticos se APIs falharem

---

**Versão**: 1.0
**Data**: 2025-11-02
**Autor**: Claude Agent
**Status**: ✅ Pronto para uso
