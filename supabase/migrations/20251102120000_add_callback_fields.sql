-- ============================================
-- MIGRAÇÃO: Adicionar campos para callbacks
-- Data: 2025-11-02
-- Sprint: 2
-- Objetivo: Suportar webhooks/callbacks das APIs
-- ============================================

-- Adicionar campos à tabela monitorings para suportar callbacks
ALTER TABLE monitorings
ADD COLUMN IF NOT EXISTS tracking_id TEXT,
ADD COLUMN IF NOT EXISTS callback_url TEXT,
ADD COLUMN IF NOT EXISTS api_provider TEXT CHECK (api_provider IN ('judit', 'escavador'));

-- Comentários nas colunas
COMMENT ON COLUMN monitorings.tracking_id IS 'ID do tracking/monitoramento na API externa (JUDiT ou Escavador)';
COMMENT ON COLUMN monitorings.callback_url IS 'URL do callback configurado na API externa';
COMMENT ON COLUMN monitorings.api_provider IS 'Provedor da API: judit ou escavador';

-- Índice para busca rápida por tracking_id (usado nos callbacks)
CREATE INDEX IF NOT EXISTS idx_monitorings_tracking_id ON monitorings(tracking_id);

-- Índice para busca por provider (útil para analytics)
CREATE INDEX IF NOT EXISTS idx_monitorings_api_provider ON monitorings(api_provider);

-- ============================================
-- Tabela para logs de callbacks recebidos
-- ============================================
CREATE TABLE IF NOT EXISTS callback_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_provider TEXT NOT NULL CHECK (api_provider IN ('judit', 'escavador')),
    tracking_id TEXT,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    signature TEXT,
    is_valid BOOLEAN DEFAULT TRUE,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    monitoring_id UUID REFERENCES monitorings(id) ON DELETE SET NULL,
    alerts_created INTEGER DEFAULT 0,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Comentários
COMMENT ON TABLE callback_logs IS 'Log de todos os callbacks recebidos das APIs (auditoria e debugging)';
COMMENT ON COLUMN callback_logs.payload IS 'Payload completo do callback (JSONB para queries flexíveis)';
COMMENT ON COLUMN callback_logs.is_valid IS 'Se a assinatura/token do callback foi validado com sucesso';
COMMENT ON COLUMN callback_logs.processing_status IS 'Status do processamento do callback';
COMMENT ON COLUMN callback_logs.alerts_created IS 'Quantidade de alertas criados a partir deste callback';

-- Índices para callback_logs
CREATE INDEX IF NOT EXISTS idx_callback_logs_provider ON callback_logs(api_provider);
CREATE INDEX IF NOT EXISTS idx_callback_logs_tracking_id ON callback_logs(tracking_id);
CREATE INDEX IF NOT EXISTS idx_callback_logs_created_at ON callback_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_callback_logs_status ON callback_logs(processing_status);
CREATE INDEX IF NOT EXISTS idx_callback_logs_monitoring_id ON callback_logs(monitoring_id);

-- ============================================
-- Função para marcar monitoramento como
-- baseado em callback (não precisa polling)
-- ============================================
CREATE OR REPLACE FUNCTION mark_monitoring_with_callback()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando tracking_id é preenchido, significa que callback está configurado
  -- Neste caso, podemos pausar ou remover o polling
  IF NEW.tracking_id IS NOT NULL AND OLD.tracking_id IS NULL THEN
    -- Log da migração para callback
    INSERT INTO system_logs (log_type, action, metadata)
    VALUES (
      'admin_action',
      'monitoring_migrated_to_callback',
      jsonb_build_object(
        'monitoring_id', NEW.id,
        'tracking_id', NEW.tracking_id,
        'api_provider', NEW.api_provider
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para logar migração para callbacks
DROP TRIGGER IF EXISTS trigger_monitoring_callback_migration ON monitorings;
CREATE TRIGGER trigger_monitoring_callback_migration
  AFTER UPDATE ON monitorings
  FOR EACH ROW
  EXECUTE FUNCTION mark_monitoring_with_callback();

-- ============================================
-- View para analytics de callbacks
-- ============================================
CREATE OR REPLACE VIEW callback_analytics AS
SELECT
  api_provider,
  DATE(created_at) as date,
  COUNT(*) as total_callbacks,
  COUNT(*) FILTER (WHERE is_valid = TRUE) as valid_callbacks,
  COUNT(*) FILTER (WHERE is_valid = FALSE) as invalid_callbacks,
  COUNT(*) FILTER (WHERE processing_status = 'completed') as successful,
  COUNT(*) FILTER (WHERE processing_status = 'failed') as failed,
  SUM(alerts_created) as total_alerts_created,
  AVG(processing_time_ms) as avg_processing_time_ms,
  MAX(processing_time_ms) as max_processing_time_ms
FROM callback_logs
GROUP BY api_provider, DATE(created_at);

COMMENT ON VIEW callback_analytics IS 'Analytics diária de callbacks por provedor de API';

-- ============================================
-- Função para limpar logs antigos (> 90 dias)
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_callback_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM callback_logs
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND processing_status = 'completed';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_callback_logs IS 'Limpa logs de callbacks com mais de 90 dias (apenas completed)';
