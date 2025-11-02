# 🧪 Testes de APIs - JusMonitor

Este diretório contém scripts para testar as APIs JUDiT e Escavador com as secrets configuradas no Supabase.

## 📋 Scripts Disponíveis

### 1. `test-judit-api.ts`
Testa todos os endpoints principais da API JUDiT:
- ✅ Health Check
- ✅ Busca por CPF/CNPJ
- ✅ Busca por CNJ
- ✅ Busca por Nome
- ✅ Dados Cadastrais
- ✅ Tracking/Monitoramento
- ✅ Consulta Penal
- ✅ Consumo de Créditos

### 2. `test-escavador-api.ts`
Testa todos os endpoints principais da API Escavador:
- ✅ Saldo
- ✅ Busca Geral
- ✅ Pesquisa por CPF/CNPJ
- ✅ Pesquisa por OAB
- ✅ Pesquisa por Processo
- ✅ Listar Tribunais
- ✅ Busca Assíncrona
- ✅ Callbacks
- ✅ Monitoramentos
- ✅ Diários Oficiais

### 3. `test-all-apis.ts`
Executa todos os testes em sequência e gera relatório consolidado.

## 🚀 Como Executar

### Pré-requisitos

1. **Deno instalado** (versão 1.30+)
   ```bash
   # Verificar instalação
   deno --version
   ```

2. **API Keys configuradas** como variáveis de ambiente

### Método 1: Usar secrets do Supabase (Recomendado)

Se você está testando localmente com o Supabase CLI:

```bash
# As secrets já estarão disponíveis automaticamente
supabase functions serve

# Em outro terminal, execute os testes
deno run --allow-env --allow-net test-all-apis.ts
```

### Método 2: Configurar manualmente

```bash
# Exportar as variáveis de ambiente
export JUDIT_API_KEY=sua-chave-judit
export ESCAVADOR_API_KEY=sua-chave-escavador

# Executar todos os testes
deno run --allow-env --allow-net --allow-read --allow-write --allow-run test-all-apis.ts
```

### Método 3: Usar arquivo .env

```bash
# Criar arquivo .env
cat > .env << EOF
JUDIT_API_KEY=sua-chave-judit
ESCAVADOR_API_KEY=sua-chave-escavador
EOF

# Carregar variáveis e executar
export $(cat .env | xargs) && deno run --allow-env --allow-net --allow-read --allow-write --allow-run test-all-apis.ts
```

### Executar testes individuais

```bash
# Apenas JUDiT
deno run --allow-env --allow-net test-judit-api.ts

# Apenas Escavador
deno run --allow-env --allow-net test-escavador-api.ts
```

## 📊 Resultados

Os scripts geram:

1. **Output no console** com detalhes de cada teste
2. **Arquivos JSON** com resultados completos:
   - `test-results-judit-[timestamp].json`
   - `test-results-escavador-[timestamp].json`

### Exemplo de saída:

```
🔍 Testando API JUDiT
============================================================
Base URL: https://api.judit.io
API Key: abc123def4...
============================================================

🧪 INICIANDO TESTES

📡 Testando: Health Check
   Endpoint: GET /v1/health
   ✅ Status: 200
   ⏱️  Latência: 234ms
   📦 Resposta: {"status":"ok","version":"1.0"}

📡 Testando: Busca por Documento (CPF)
   Endpoint: POST /v1/requests/request-document
   ✅ Status: 200
   ⏱️  Latência: 1456ms
   📦 Resposta: {"lawsuits":[...],"total":5}

...

📊 RESUMO DOS TESTES
============================================================
Total de testes: 9
✅ Sucessos: 7
❌ Falhas: 2
📈 Taxa de sucesso: 77.8%
⏱️  Latência média: 892ms
```

## 🔍 Interpretando os Resultados

### Status HTTP esperados:

- **200**: Sucesso
- **401**: Chave de API inválida
- **403**: Sem permissão / Créditos insuficientes
- **404**: Endpoint não encontrado (pode indicar que endpoint mudou)
- **429**: Rate limit excedido
- **500**: Erro interno da API

### Diagnóstico de Problemas:

#### ❌ Erro 401 - Unauthorized
```
Solução: Verifique se a API key está correta
export JUDIT_API_KEY=chave-correta
```

#### ❌ Erro 404 - Not Found
```
Causa: Endpoint pode ter sido alterado pela API
Solução: Consultar documentação atualizada da API
```

#### ❌ Erro 429 - Rate Limit
```
Causa: Muitas requisições em curto período
Solução: Aguardar alguns minutos antes de testar novamente
```

#### ❌ Network Error
```
Causa: Problemas de conectividade ou API fora do ar
Solução:
1. Verificar conexão com internet
2. Verificar status da API (status.judit.io ou similar)
3. Tentar novamente mais tarde
```

## 📝 Personalizando os Testes

### Alterar dados de teste:

Edite os scripts para usar dados reais:

```typescript
// Em test-judit-api.ts
await testEndpoint(
  'Busca por CPF Real',
  '/v1/requests/request-document',
  'POST',
  {
    document: '12345678900', // ← Altere aqui
    document_type: 'CPF',
    cache: true
  }
);
```

### Adicionar novos testes:

```typescript
// Adicione ao final dos testes existentes
await testEndpoint(
  'Meu Teste Customizado',
  '/v1/novo-endpoint',
  'POST',
  {
    // seus parâmetros
  }
);
```

## 🔒 Segurança

⚠️ **IMPORTANTE**:
- **NUNCA** commite arquivos `.env` com API keys reais
- **NUNCA** exponha API keys em logs públicos
- Os scripts já ocultam as chaves nos outputs (mostra apenas primeiros 10 caracteres)
- Adicione `*.env` e `test-results-*.json` ao `.gitignore`

## 🐛 Troubleshooting

### Deno não encontrado
```bash
# MacOS/Linux
curl -fsSL https://deno.land/install.sh | sh

# Windows
irm https://deno.land/install.ps1 | iex
```

### Permissões negadas
```bash
# Adicione --allow-all (use com cuidado)
deno run --allow-all test-all-apis.ts

# Ou adicione permissões específicas necessárias
```

### Secrets não encontradas no Supabase
```bash
# Listar secrets configuradas
supabase secrets list

# Adicionar nova secret
supabase secrets set JUDIT_API_KEY=sua-chave
supabase secrets set ESCAVADOR_API_KEY=sua-chave
```

## 📚 Documentação das APIs

- **JUDiT**: https://docs.judit.io (se disponível)
- **Escavador**: https://api.escavador.com/docs

## 🎯 Próximos Passos

Depois de rodar os testes:

1. ✅ Verificar quais endpoints funcionam
2. ✅ Identificar endpoints que precisam de correção
3. ✅ Atualizar edge functions com endpoints corretos
4. ✅ Implementar tratamento de erros baseado nos resultados
5. ✅ Configurar monitoramento de health das APIs

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs detalhados nos arquivos JSON gerados
2. Consulte a documentação oficial das APIs
3. Verifique o status das APIs
4. Entre em contato com o suporte das APIs se necessário

---

**Última atualização**: 2025-11-02
**Versão**: 1.0
