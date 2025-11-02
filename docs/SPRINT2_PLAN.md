# Sprint 2 - Sistema de Callbacks (Webhooks)

**Data de Início**: 2025-11-02
**Duração Estimada**: 5-7 dias
**Objetivo**: Migrar de polling para callbacks, economizando 90% em custos de monitoramento

---

## 🎯 OBJETIVOS

### Problema Atual:
```
check-monitoring (polling):
- Roda a cada X horas
- Consome créditos da API em cada verificação
- Ineficiente: verifica mesmo quando não há novidades
- Custo: ~10 créditos/mês por monitoramento
```

### Solução (Callbacks):
```
Webhooks/Callbacks:
- API notifica quando há novidade (push)
- Zero créditos contínuos
- Instantâneo: notificação em tempo real
- Custo: ~0 créditos (apenas setup inicial)
```

### Economia Esperada:
```
❌ Antes (polling):  10 créditos/mês por monitoramento
✅ Depois (callback): 0 créditos contínuos
💰 Economia: 100% dos custos de verificação
```

---

## 📋 TAREFAS DO SPRINT

### 1. Criar Edge Function: `judit-callback`
**Arquivo**: `supabase/functions/judit-callback/index.ts`

**Responsabilidades**:
- Receber callbacks HTTP POST da JUDiT
- Validar assinatura/token do callback
- Identificar tipo de evento (nova movimentação, novo processo, etc)
- Buscar monitoramento relacionado
- Criar alerta na tabela `monitoring_alerts`
- Criar notificação para o usuário
- Atualizar processo no DataLake

**Eventos Suportados**:
- `tracking.update` - Atualização em tracking
- `lawsuit.new_movement` - Nova movimentação
- `lawsuit.status_change` - Mudança de status
- `tracking.new_lawsuit` - Novo processo encontrado

**Validação de Segurança**:
```typescript
// JUDiT envia header: X-JUDiT-Signature
// Validar HMAC-SHA256 com secret
const signature = req.headers.get('X-JUDiT-Signature')
const isValid = validateJuditSignature(body, signature, secret)
```

---

### 2. Criar Edge Function: `escavador-callback`
**Arquivo**: `supabase/functions/escavador-callback/index.ts`

**Responsabilidades**:
- Receber callbacks HTTP POST do Escavador
- Validar token de callback
- Identificar tipo de evento
- Processar notificação
- Criar alertas e notificações

**Eventos Suportados** (Diários Oficiais):
- Nova publicação encontrada
- Monitoramento atualizado

**Eventos Suportados** (Site do Tribunal):
- Processo encontrado
- Novo andamento
- Andamento removido
- Nova informação da capa
- Informação removida/alterada
- Nova instância
- Segredo de justiça (entrada/saída)
- Processo arquivado/desarquivado
- Novo envolvido
- Envolvido removido
- Novo processo

**Validação de Segurança**:
```typescript
// Escavador envia token no body
const { token } = callbackBody
const isValid = token === expectedToken
```

---

### 3. Atualizar `create-monitoring`

**Mudanças**:
```typescript
// ANTES: Apenas criar registro
INSERT INTO monitorings (...) VALUES (...)

// DEPOIS: Criar registro + registrar callback na API

// JUDiT
POST /tracking/tracking
Body: {
  document: "12345678900",
  callback_url: "https://[projeto].supabase.co/functions/v1/judit-callback"
}
Response: { tracking_id: "abc123" }

// Salvar tracking_id no banco
UPDATE monitorings SET tracking_id = 'abc123' WHERE id = monitoring_id

// Escavador
POST /v1/monitoramentos
Body: {
  numero_processo: "0000000-00.0000.0.00.0000",
  callback_url: "https://[projeto].supabase.co/functions/v1/escavador-callback"
}
```

**Campos Novos em `monitorings`**:
- `tracking_id` (TEXT) - ID do tracking na API externa
- `callback_url` (TEXT) - URL do callback configurado
- `api_provider` (TEXT) - 'judit' ou 'escavador'

---

### 4. Migração de Schema

**Arquivo**: `supabase/migrations/20251102_add_callback_fields.sql`

```sql
-- Adicionar campos para callbacks
ALTER TABLE monitorings
ADD COLUMN tracking_id TEXT,
ADD COLUMN callback_url TEXT,
ADD COLUMN api_provider TEXT;

-- Índice para busca rápida por tracking_id
CREATE INDEX idx_monitorings_tracking_id ON monitorings(tracking_id);
```

---

### 5. Função Auxiliar de Validação

**Arquivo**: `supabase/functions/_shared/callback-validator.ts`

```typescript
export function validateJuditCallback(
  body: string,
  signature: string,
  secret: string
): boolean {
  // Validar HMAC-SHA256
  const expectedSignature = await crypto.subtle.sign(
    { name: "HMAC", hash: "SHA-256" },
    secret,
    new TextEncoder().encode(body)
  )
  return signature === expectedSignature
}

export function validateEscavadorCallback(
  token: string,
  expectedToken: string
): boolean {
  return token === expectedToken
}
```

---

### 6. Depreciar `check-monitoring`

**Mudanças**:
```typescript
// Adicionar comentário de deprecação
console.warn('DEPRECATED: Esta função será removida no futuro.')
console.warn('Use callbacks (judit-callback, escavador-callback) em vez de polling.')

// Verificar apenas monitoramentos sem callback configurado
const { data: monitorings } = await supabaseClient
  .from('monitorings')
  .select('*')
  .eq('status', 'active')
  .is('tracking_id', null) // Apenas sem callback
  .lte('next_check', new Date().toISOString())
```

---

## 🔐 SEGURANÇA DOS CALLBACKS

### Validação Obrigatória:
1. **Verificar origem** (headers, IP se possível)
2. **Validar assinatura** (HMAC, token)
3. **Verificar timestamp** (evitar replay attacks)
4. **Rate limiting** (max 100 callbacks/min por fonte)

### Exemplo de Validação Completa:
```typescript
// 1. Verificar header de assinatura
const signature = req.headers.get('X-JUDiT-Signature')
if (!signature) {
  return new Response('Unauthorized', { status: 401 })
}

// 2. Validar assinatura
const isValid = await validateJuditCallback(body, signature, SECRET)
if (!isValid) {
  return new Response('Invalid signature', { status: 403 })
}

// 3. Verificar timestamp (max 5 min de diferença)
const timestamp = callbackData.timestamp
const now = Date.now()
if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
  return new Response('Timestamp too old', { status: 400 })
}

// 4. Processar callback
```

---

## 📡 CONFIGURAÇÃO NAS APIs

### JUDiT - Configurar Tracking

```bash
# 1. Criar tracking com callback
POST https://api.judit.io/tracking/tracking
Authorization: Bearer {JUDIT_API_KEY}
Content-Type: application/json

{
  "document": "12345678900",
  "document_type": "CPF",
  "callback_url": "https://[projeto].supabase.co/functions/v1/judit-callback",
  "events": ["new_movement", "new_lawsuit", "status_change"]
}

# Resposta:
{
  "tracking_id": "track_abc123",
  "status": "active",
  "document": "12345678900",
  "callback_url": "https://..."
}
```

### Escavador - Configurar Monitoramento

```bash
# 1. Monitoramento de Diários Oficiais
POST https://api.escavador.com/v1/monitoramentos-diarios-oficiais
Authorization: Token {ESCAVADOR_API_KEY}
Content-Type: application/json

{
  "termo": "Nome da Pessoa",
  "callback_url": "https://[projeto].supabase.co/functions/v1/escavador-callback"
}

# 2. Monitoramento do Site do Tribunal
POST https://api.escavador.com/v1/monitoramentos
Authorization: Token {ESCAVADOR_API_KEY}
Content-Type: application/json

{
  "numero_processo": "0000000-00.0000.0.00.0000",
  "callback_url": "https://[projeto].supabase.co/functions/v1/escavador-callback"
}
```

---

## 🧪 TESTES

### Teste Manual de Callbacks:

```bash
# Simular callback da JUDiT
curl -X POST https://[projeto].supabase.co/functions/v1/judit-callback \
  -H "Content-Type: application/json" \
  -H "X-JUDiT-Signature: [signature]" \
  -d '{
    "event": "lawsuit.new_movement",
    "tracking_id": "track_abc123",
    "data": {
      "cnj_number": "0000000-00.0000.0.00.0000",
      "movement": {
        "date": "2025-11-02",
        "description": "Audiência marcada"
      }
    }
  }'

# Simular callback do Escavador
curl -X POST https://[projeto].supabase.co/functions/v1/escavador-callback \
  -H "Content-Type: application/json" \
  -d '{
    "token": "[expected-token]",
    "tipo": "novo_andamento",
    "numero_processo": "0000000-00.0000.0.00.0000",
    "andamento": {
      "data": "2025-11-02",
      "descricao": "Sentença publicada"
    }
  }'
```

### Verificar Resultado:
```sql
-- Ver alertas criados
SELECT * FROM monitoring_alerts ORDER BY created_at DESC LIMIT 5;

-- Ver notificações
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;

-- Ver logs
SELECT * FROM system_logs WHERE action = 'callback_received' ORDER BY created_at DESC LIMIT 10;
```

---

## 📊 MÉTRICAS DE SUCESSO

### KPIs:
- [ ] Callbacks recebidos com sucesso: >95%
- [ ] Latência de processamento: <2 segundos
- [ ] Taxa de validação bem-sucedida: >99%
- [ ] Redução de custos: >90%

### Monitoramento:
```sql
-- Dashboard de callbacks
SELECT
  api_provider,
  DATE(created_at) as date,
  COUNT(*) as total_callbacks,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time_sec
FROM monitoring_alerts
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY api_provider, DATE(created_at)
ORDER BY date DESC;
```

---

## 🚨 TROUBLESHOOTING

### Callback não recebido:
1. Verificar URL configurada na API
2. Verificar logs da edge function
3. Testar manualmente com curl
4. Verificar firewall/CORS

### Callback rejeitado:
1. Verificar assinatura/token
2. Verificar timestamp
3. Verificar formato do payload
4. Ver logs de erro

### Alertas não criados:
1. Verificar se tracking_id existe no banco
2. Verificar se monitoramento está ativo
3. Ver logs de processamento
4. Verificar permissões RLS

---

## 📝 ARQUIVOS A CRIAR/MODIFICAR

### Novos Arquivos:
```
supabase/functions/
├── judit-callback/
│   └── index.ts (NOVO)
├── escavador-callback/
│   └── index.ts (NOVO)
└── _shared/
    └── callback-validator.ts (NOVO)

supabase/migrations/
└── 20251102_add_callback_fields.sql (NOVO)

docs/
├── SPRINT2_PLAN.md (este arquivo)
├── SPRINT2_CHANGELOG.md (ao final)
└── CALLBACK_CONFIGURATION.md (NOVO - guia de setup)
```

### Arquivos Modificados:
```
supabase/functions/
├── create-monitoring/index.ts (MODIFICAR)
└── check-monitoring/index.ts (DEPRECAR)
```

---

## ⏱️ CRONOGRAMA

### Dia 1-2: Setup e Infraestrutura
- [x] Criar plano do Sprint 2
- [ ] Criar migração de schema
- [ ] Criar função de validação de callbacks

### Dia 3-4: Edge Functions
- [ ] Implementar judit-callback
- [ ] Implementar escavador-callback
- [ ] Atualizar create-monitoring

### Dia 5: Testes e Documentação
- [ ] Testar callbacks manualmente
- [ ] Criar documentação de configuração
- [ ] Criar SPRINT2_CHANGELOG.md

### Dia 6-7: Ajustes e Deploy
- [ ] Ajustes baseados em testes
- [ ] Deploy em produção
- [ ] Monitorar primeiras 24h

---

## 🎓 REFERÊNCIAS

- [JUDiT Tracking Docs](https://docs.judit.io/tracking/tracking)
- [JUDiT Callbacks Docs](https://docs.judit.io/webhook/callbacks)
- [Escavador Monitoramento Docs](https://api.escavador.com/v1/docs/#monitoramento-de-dirios-oficiais)
- [Escavador Callbacks Docs](https://api.escavador.com/v1/docs/#callback)

---

## ✅ CHECKLIST DE CONCLUSÃO

- [ ] judit-callback implementado e testado
- [ ] escavador-callback implementado e testado
- [ ] create-monitoring atualizado
- [ ] Migração de schema aplicada
- [ ] Validação de callbacks funcionando
- [ ] Documentação de configuração criada
- [ ] Testes manuais passando
- [ ] Monitoramentos antigos (polling) deprecados
- [ ] Economia de custos validada
- [ ] Sprint 2 documentado

---

**Próximo**: Implementar as edge functions de callback!
