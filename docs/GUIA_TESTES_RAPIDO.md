# 🧪 GUIA DE TESTES RÁPIDO - JUSMONITOR

## 📋 PRÉ-REQUISITOS

1. ✅ APIs JUDiT e Escavador configuradas no painel admin
2. ✅ Usuário criado com créditos suficientes
3. ✅ Acesso à página de Consultas

---

## 🎯 TESTE 1: Consulta Processual (Economia via Diários Oficiais)

### Objetivo
Verificar se Diários Oficiais é consultado primeiro (gratuito)

### Passos
1. Ir para **Consultas → Processual**
2. Selecionar **CPF**
3. Digitar CPF de teste: `12345678900`
4. Clicar **Buscar**

### Resultado Esperado
```
Toast: "Busca realizada"
- X processos encontrados
- 0 créditos (se encontrado em Diários Oficiais)
- 2-3 créditos (se não encontrado, usou API paga)
```

### Verificar no Histórico
- Badge mostrando "Cache" ou "API: escavador/judit"
- Créditos consumidos

---

## 🎯 TESTE 2: Cache de Consulta Processual

### Objetivo
Verificar se cache funciona (24h)

### Passos
1. Repetir a mesma busca do Teste 1
2. Aguardar resposta

### Resultado Esperado
```
Toast: "Busca (cache)"
- X processos encontrados
- 0 créditos consumidos ✨
- Resposta instantânea
```

---

## 🎯 TESTE 3: Consulta Cadastral

### Objetivo
Testar consulta de dados cadastrais

### Passos
1. Ir para **Consultas → Cadastral**
2. Selecionar **CPF**
3. Digitar CPF: `12345678900`
4. Clicar **Buscar**

### Resultado Esperado
```
Toast: "Consulta cadastral realizada"
- Dados de [Nome]
- 5 créditos (primeira vez)
- 0 créditos (se buscar novamente dentro de 7 dias)
```

---

## 🎯 TESTE 4: Consulta Penal

### Objetivo
Testar consulta de antecedentes criminais

### Passos
1. Ir para **Consultas → Penal**
2. Digitar CPF: `12345678900`
3. Clicar **Buscar**

### Resultado Esperado
```
Toast: "Consulta penal realizada"
- "Nada consta" OU "⚠️ X registro(s) encontrado(s)"
- 8 créditos (primeira vez)
- 0 créditos (se buscar novamente dentro de 30 dias)
```

---

## 🎯 TESTE 5: Ver Detalhes do Processo

### Objetivo
Verificar visualização de processo

### Passos
1. No histórico de buscas, clicar em um processo
2. Verificar página de detalhes

### Resultado Esperado
```
- Dados gerais do processo
- Lista de movimentações
- Lista de anexos (se existirem)
- Botões: Capturar Anexos, Baixar PDF, Monitorar
- 3 créditos (primeira vez que acessa esse processo)
- 0 créditos (acessos subsequentes)
```

---

## 🎯 TESTE 6: Capturar Anexos (Background Job)

### Objetivo
Testar captura de anexos em background

### Passos
1. Na página de detalhes do processo
2. Clicar **Capturar Anexos**
3. Aguardar toast

### Resultado Esperado
```
Toast: "Captura iniciada"
- "Os anexos estão sendo capturados..."
- Job criado (verificar em attachment_capture_jobs)
- Após conclusão: notificação no sino
```

### Verificar no Banco
```sql
SELECT * FROM attachment_capture_jobs 
WHERE cnj_number = '[CNJ_DO_PROCESSO]'
ORDER BY created_at DESC LIMIT 1;

-- Status deve progredir:
-- pending → processing → completed
```

---

## 🎯 TESTE 7: Gerar PDF Dossiê

### Objetivo
Testar geração de PDF completo

### Passos
1. Na página de detalhes do processo
2. Clicar **Baixar PDF**
3. Aguardar

### Resultado Esperado
```
Toast 1: "Gerando dossiê..."
Toast 2: "Dossiê gerado"
- PDF com X movimentações e Y anexos
- 10 créditos consumidos
- Nova aba abre com HTML renderizado
```

---

## 🎯 TESTE 8: Criar Monitoramento (Callbacks)

### Objetivo
Verificar registro de callbacks

### Passos
1. Na página **Monitoramentos**
2. Clicar **+ Novo Monitoramento**
3. Selecionar tipo: **CNJ**
4. Digitar número CNJ
5. Selecionar frequência: **Diário**
6. Clicar **Criar**

### Resultado Esperado
```
Toast: "Monitoramento ativado"
- 10 créditos (setup inicial)
- Callback registrado (verificar logs)
```

### Verificar no Banco
```sql
SELECT * FROM monitorings 
WHERE user_id = '[USER_ID]'
ORDER BY created_at DESC LIMIT 1;

-- Deve ter:
-- tracking_id: não nulo
-- callback_url: https://...judit-callback ou escavador-callback
-- api_provider: 'judit' ou 'escavador'
```

### Verificar Logs (Edge Function)
```
[create-monitoring] Registrando callback JUDiT: https://...
[create-monitoring] Callback JUDiT registrado. Tracking ID: abc123
```

---

## 🎯 TESTE 9: Receber Callback (Simulado)

### Objetivo
Testar recepção de callback

### Passos
1. Usar ferramenta de testes HTTP (Postman/Insomnia)
2. Fazer POST para: `https://[PROJECT-ID].supabase.co/functions/v1/judit-callback`
3. Body (simulado):
```json
{
  "event_type": "new_movement",
  "tracking_id": "[TRACKING_ID_DO_TESTE_8]",
  "cnj_number": "[CNJ_DO_MONITORAMENTO]",
  "data": {
    "movement_date": "2024-11-03",
    "description": "Teste de callback"
  }
}
```

### Resultado Esperado
```
Status: 200 OK
Response: { "success": true }
```

### Verificar no Banco
```sql
-- Deve criar alerta
SELECT * FROM monitoring_alerts 
WHERE monitoring_id = '[MONITORING_ID]'
ORDER BY created_at DESC LIMIT 1;

-- Deve criar notificação
SELECT * FROM notifications 
WHERE user_id = '[USER_ID]'
ORDER BY created_at DESC LIMIT 1;
```

---

## 📊 TESTE 10: Verificar Economia

### Objetivo
Medir economia real vs. esperada

### Passos
1. Fazer 10 buscas variadas
2. Repetir 5 delas (testar cache)
3. Consultar métricas

### SQL de Análise
```sql
-- Total de buscas e economia
SELECT 
  COUNT(*) as total_searches,
  SUM(CASE WHEN from_cache THEN 1 ELSE 0 END) as cache_hits,
  SUM(credits_consumed) as total_credits,
  ROUND(
    (SUM(CASE WHEN from_cache THEN 1 ELSE 0 END)::FLOAT / COUNT(*)) * 100, 
    2
  ) as cache_hit_rate_percent
FROM user_searches
WHERE user_id = '[USER_ID]';

-- Por tipo de API
SELECT 
  api_used,
  COUNT(*) as count,
  SUM(credits_consumed) as credits
FROM user_searches
WHERE user_id = '[USER_ID]'
GROUP BY api_used;

-- Economia estimada
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN from_cache THEN 3 ELSE credits_consumed END) as would_pay,
  SUM(credits_consumed) as actually_paid,
  SUM(CASE WHEN from_cache THEN 3 ELSE credits_consumed END) - SUM(credits_consumed) as saved
FROM user_searches
WHERE user_id = '[USER_ID]';
```

---

## 🔍 CHECKLIST DE VALIDAÇÃO

### Edge Functions
- [ ] `search-processes` - Diários Oficiais consultado primeiro?
- [ ] `search-processes` - Cache funcionando (24h)?
- [ ] `search-registration-data` - Cache funcionando (7 dias)?
- [ ] `search-criminal-records` - Cache funcionando (30 dias)?
- [ ] `search-diarios-oficiais` - Retornando processos mencionados?
- [ ] `capture-attachments` - Job criado com sucesso?
- [ ] `generate-pdf-dossier` - PDF gerado corretamente?
- [ ] `create-monitoring` - Callback registrado?
- [ ] `judit-callback` - Recebendo e processando?
- [ ] `escavador-callback` - Recebendo e processando?

### Front-End
- [ ] Consultas → Sem mocks, dados reais?
- [ ] Toasts informativos com créditos?
- [ ] Histórico mostrando cache hits?
- [ ] Detalhes do processo carregando?
- [ ] Botões funcionando (Capturar, PDF, Monitorar)?

### Economia
- [ ] Diários Oficiais reduzindo custos?
- [ ] Cache hit rate > 30%?
- [ ] Monitoramentos sem polling?
- [ ] Callbacks funcionando (0 créditos)?

---

## 🐛 TROUBLESHOOTING

### Erro: "API configuration not found"
**Solução:**
```sql
-- Verificar se APIs estão configuradas
SELECT * FROM api_configurations;

-- Se não existirem, inserir:
INSERT INTO api_configurations (api_name, api_key, endpoint_url, is_active, priority)
VALUES 
  ('judit', '[SUA-CHAVE]', 'https://api.judit.io', true, 1),
  ('escavador', '[SUA-CHAVE]', 'https://api.escavador.com', true, 2);
```

### Erro: "Insufficient credits"
**Solução:**
```sql
-- Adicionar créditos ao usuário
UPDATE credits_plans 
SET credits_balance = 1000 
WHERE user_id = '[USER_ID]';
```

### Callbacks não chegando
**Verificações:**
1. URL do callback está correta?
   - `https://[PROJECT-ID].supabase.co/functions/v1/judit-callback`
2. Edge function pública (`verify_jwt = false`)?
3. Logs mostram registro bem-sucedido?
4. tracking_id salvo no monitoramento?

### Cache não funcionando
**Verificações:**
1. `last_update` está sendo atualizado?
2. Intervalo de cache correto?
   - Processos: 24h
   - Cadastral: 7 dias
   - Penal: 30 dias
3. Query considera `gte(last_update, [timestamp])`?

---

## 📈 MÉTRICAS DE SUCESSO

### Mínimo Aceitável
- ✅ Cache hit rate: > 30%
- ✅ Economia: > 40%
- ✅ Diários Oficiais usado: > 50% das buscas
- ✅ Callbacks funcionando: 100%

### Ideal
- 🎯 Cache hit rate: > 50%
- 🎯 Economia: > 60%
- 🎯 Diários Oficiais usado: > 70% das buscas
- 🎯 Tempo médio de resposta: < 3s

---

## ✅ CONCLUSÃO

Após completar todos os testes, você deve ter:
1. ✅ Consultado APIs reais
2. ✅ Verificado cache funcionando
3. ✅ Testado economia via Diários Oficiais
4. ✅ Validado callbacks de monitoramento
5. ✅ Gerado PDFs
6. ✅ Capturado anexos
7. ✅ Medido economia real

**Se todos os testes passarem:** Sistema pronto para produção! 🚀

**Se algum teste falhar:** Revisar logs e ajustar conforme necessário.
