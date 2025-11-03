# 📊 SPRINT 2 & 3 - RESUMO DE OTIMIZAÇÕES

## ✅ Sprints Concluídos
- **Sprint 1**: Migrações e Edge Functions Core ✅
- **Sprint 2**: Otimizações e Integração Front-End ✅ 
- **Sprint 3**: Otimizações Avançadas ✅

---

## 🎯 OTIMIZAÇÕES IMPLEMENTADAS

### 1. **search-processes** (Economia de 40-60%)

**Fluxo Otimizado:**
```
1. Verificar cache local (24h) → GRATUITO se encontrado
2. Buscar Diários Oficiais (Escavador) → GRATUITO
3. Se não encontrar, APIs pagas (JUDiT/Escavador) → 2-3 créditos
```

**Antes:**
- Sempre chamava API paga (3-5 créditos)
- Sem priorização de fontes gratuitas

**Depois:**
- Diários Oficiais consultados PRIMEIRO
- Cache expandido para múltiplos usuários
- Métricas: `from_cache`, `used_diarios_oficiais`, `api_used`

**Economia esperada:** **40-60%** em consultas processuais

---

### 2. **create-monitoring** (Economia de 100% em verificações)

**Callbacks Implementados:**
```
1. Tentar registrar callback JUDiT
2. Se falhar, registrar callback Escavador
3. Salvar tracking_id e callback_url
```

**Antes:**
- Polling manual via `check-monitoring`
- Custos recorrentes: 3-5 créditos por verificação
- Exemplo: 100 monitoramentos diários = 300-500 créditos/dia

**Depois:**
- Callbacks push das APIs
- Custo: 10 créditos (setup inicial)
- Verificações: **0 créditos** (notificações automáticas)

**Economia esperada:** **100%** dos custos de verificação recorrentes

---

### 3. **search-registration-data** (Nova - 5 créditos)

**Funcionalidade:**
- Consulta dados cadastrais de CPF/CNPJ
- Cache: 7 dias
- API: JUDiT

**Exemplo de uso:**
```typescript
ConsultaService.searchRegistrationData('cpf', '12345678900')
```

**Resposta:**
```json
{
  "success": true,
  "from_cache": false,
  "credits_consumed": 5,
  "data": {
    "name": "João da Silva",
    "addresses": [...],
    "contacts": [...],
    "registration_status": "Ativo"
  }
}
```

---

### 4. **search-criminal-records** (Nova - 8 créditos)

**Funcionalidade:**
- Consulta mandados de prisão e execuções penais
- Cache: 30 dias
- API: JUDiT (2 endpoints em paralelo)

**Exemplo de uso:**
```typescript
ConsultaService.searchCriminalRecords('12345678900')
```

**Resposta:**
```json
{
  "success": true,
  "from_cache": false,
  "credits_consumed": 8,
  "data": {
    "warrants": [...],
    "criminal_executions": [...],
    "has_active_warrants": true
  }
}
```

---

### 5. **search-diarios-oficiais** (Nova - GRATUITO)

**Funcionalidade:**
- Busca em Diários Oficiais do Escavador
- Cache: 1 hora
- Custo: **0 créditos** 🎉

**Exemplo de uso:**
```typescript
ConsultaService.searchDiariosOficiais('cpf', '12345678900')
```

**Resposta:**
```json
{
  "success": true,
  "from_cache": false,
  "credits_consumed": 0,
  "source": "diarios_oficiais",
  "results_count": 15,
  "processes_mentioned": ["CNJ1", "CNJ2", ...]
}
```

---

### 6. **capture-attachments** (Nova - Background Job)

**Funcionalidade:**
- Captura todos anexos de um processo em background
- Não bloqueia resposta
- Notifica usuário quando concluir

**Exemplo de uso:**
```typescript
ProcessoService.captureAttachments('0000000-00.2024.8.26.0000')
```

**Resposta:**
```json
{
  "success": true,
  "job_id": "uuid",
  "status": "pending",
  "estimated_time": "30 minutos a 48 horas",
  "message": "Captura iniciada..."
}
```

---

### 7. **generate-pdf-dossier** (Nova - 10 créditos)

**Funcionalidade:**
- Gera PDF completo do processo
- Inclui capa, movimentações e anexos
- Retorna HTML renderizável

**Exemplo de uso:**
```typescript
ProcessoService.generatePdfDossier('0000000-00.2024.8.26.0000', true)
```

**Resposta:**
```json
{
  "success": true,
  "credits_consumed": 10,
  "pdf_html": "<!DOCTYPE html>...",
  "movements_count": 45,
  "attachments_count": 12
}
```

---

## 🗄️ DATA LAKE MELHORADO

### Novas Tabelas de Cache

**1. registration_data** (cache 7 dias)
```sql
- document (unique)
- full_name
- addresses JSONB
- contacts JSONB
- registration_status
- last_update
```

**2. criminal_records** (cache 30 dias)
```sql
- cpf (unique)
- warrants JSONB
- criminal_executions JSONB
- has_active_warrants
- last_update
```

**3. diarios_oficiais_cache** (cache 1h)
```sql
- search_term
- search_type
- results JSONB
- results_count
- last_update
```

**4. attachment_capture_jobs**
```sql
- cnj_number
- user_id
- status (pending, processing, completed, failed)
- total_attachments
- captured_attachments
- error_message
```

### Campos Adicionados em `processes`
```sql
- search_count INTEGER (contador de buscas)
- last_searched_by UUID
- source_api api_name (judit/escavador)
```

### Campos Adicionados em `user_searches`
```sql
- from_cache BOOLEAN
- api_used api_name
- response_time_ms INTEGER
```

### Campos Adicionados em `monitorings`
```sql
- tracking_id TEXT (ID do callback)
- callback_url TEXT
- api_provider api_name
- last_notification_at TIMESTAMPTZ
```

---

## 💰 RESUMO DE ECONOMIA

### Antes das Otimizações
```
Consulta Processual CPF: 5 créditos
Verificação de Monitoramento (100x/dia): 300-500 créditos/dia
Consulta Repetida: 5 créditos (sempre)
Total mensal (exemplo): ~15.000 créditos
```

### Depois das Otimizações
```
Consulta Processual CPF: 
  - Diários Oficiais: 0 créditos (primeiro)
  - Cache: 0 créditos
  - API paga: 3 créditos (último recurso)
  
Verificação de Monitoramento (100x/dia): 0 créditos (callbacks)

Consulta Repetida (cache 24h): 0 créditos

Total mensal (exemplo): ~6.000 créditos
```

**Economia Total: ~60%** 💸

---

## 🔄 INTEGRAÇÃO FRONT-END

### Página Consultas (`src/pages/dashboard/Consultas.tsx`)

**Removido:**
- ❌ Todos os mocks de processos
- ❌ Dados simulados

**Integrado:**
- ✅ `ConsultaService.searchProcesses()`
- ✅ `ConsultaService.searchRegistrationData()`
- ✅ `ConsultaService.searchCriminalRecords()`
- ✅ Toasts informativos com custos reais
- ✅ Cache hits exibidos

### Hook useProcessoDetalhes (`src/features/processos/hooks/useProcessoDetalhes.ts`)

**Integrado:**
- ✅ `ProcessoService.captureAttachments()` → Captura background
- ✅ `ProcessoService.generatePdfDossier()` → Geração de PDF
- ✅ Abertura de HTML em nova aba

### Tipos Atualizados

**Busca interface:**
```typescript
interface Busca {
  id: string
  tipo: TipoConsulta
  valor: string
  resultados: number
  data: Date
  fromCache?: boolean        // NOVO
  creditsConsumed?: number   // NOVO
  apiUsed?: 'judit' | 'escavador' // NOVO
}
```

---

## 📊 MÉTRICAS E MONITORAMENTO

### Logs Estruturados
Todas as edge functions agora incluem:
```typescript
console.log(`[Function Name] Ação realizada`)
console.log(`[Function Name] Cache hit/miss`)
console.log(`[Function Name] API usada: ${api}`)
console.log(`[Function Name] Créditos consumidos: ${credits}`)
```

### Índices de Performance
```sql
-- Buscas por cache
idx_processes_search_count
idx_processes_source_api

-- Monitoramentos
idx_monitorings_tracking_id
idx_monitorings_api_provider

-- Dados cadastrais
idx_registration_data_document
idx_registration_data_last_update

-- Consultas penais
idx_criminal_records_cpf
idx_criminal_records_last_update
```

---

## 🚀 PRÓXIMOS PASSOS (TESTES)

### 1. Configurar APIs no Banco
```sql
-- Inserir configurações (se não existirem)
INSERT INTO api_configurations (api_name, api_key, endpoint_url, is_active, priority)
VALUES 
  ('judit', 'sua-chave-judit', 'https://api.judit.io', true, 1),
  ('escavador', 'sua-chave-escavador', 'https://api.escavador.com', true, 2);
```

### 2. Testar Fluxos Principais

**A. Consulta Processual:**
```
1. Buscar CPF novo → Deve usar Diários Oficiais primeiro
2. Buscar mesmo CPF → Deve retornar cache
3. Verificar toast: "from_cache: true, 0 créditos"
```

**B. Consulta Cadastral:**
```
1. Buscar CPF → 5 créditos
2. Buscar mesmo CPF (dentro de 7 dias) → 0 créditos (cache)
```

**C. Consulta Penal:**
```
1. Buscar CPF → 8 créditos
2. Buscar mesmo CPF (dentro de 30 dias) → 0 créditos (cache)
```

**D. Monitoramento:**
```
1. Criar monitoramento → 10 créditos (setup)
2. Aguardar callback → 0 créditos
3. Verificar notificação criada
```

**E. Captura de Anexos:**
```
1. Ver detalhes do processo
2. Clicar "Capturar Anexos"
3. Verificar job criado em attachment_capture_jobs
4. Aguardar notificação
```

**F. Gerar PDF:**
```
1. Ver detalhes do processo
2. Clicar "Baixar PDF"
3. Verificar HTML aberto em nova aba
4. Toast: "10 créditos consumidos"
```

### 3. Monitorar Logs

**Edge Functions:**
```bash
# Verificar logs de cada função
- search-processes: Diários Oficiais usado?
- create-monitoring: Callback registrado?
- callbacks: Notificações recebidas?
```

**Banco de Dados:**
```sql
-- Verificar cache hits
SELECT from_cache, COUNT(*) 
FROM user_searches 
GROUP BY from_cache;

-- Ver economia
SELECT 
  SUM(CASE WHEN from_cache THEN 0 ELSE credits_consumed END) as credits_paid,
  COUNT(*) as total_searches
FROM user_searches;
```

---

## 📝 NOTAS IMPORTANTES

### Avisos de Segurança (Não Críticos)
Os seguintes avisos apareceram mas são de funções antigas:
1. Function Search Path Mutable (handle_new_user, update_updated_at_column)
2. Leaked Password Protection Disabled (config geral)

**Ação:** Não relacionados às novas implementações. Podem ser ignorados por agora.

### Rate Limits
- **JUDiT**: Consultar documentação
- **Escavador**: 500 req/min ✅

### Callbacks Públicos
Os callbacks NÃO usam JWT (`verify_jwt = false`) pois são chamados pelas APIs externas.

---

## 🎉 CONCLUSÃO

**Implementações Sprint 2 & 3:**
- ✅ 5 novas edge functions
- ✅ 4 novas tabelas de cache
- ✅ Otimização de 3 edge functions existentes
- ✅ Integração completa do front-end
- ✅ Sistema de callbacks completo
- ✅ Economia estimada: **60%** 💰

**Status:** Pronto para testes com APIs reais! 🚀
