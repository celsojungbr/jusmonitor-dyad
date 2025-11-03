-- ============================================
-- SPRINT 3: Adicionar campos para callbacks em monitoramentos
-- ============================================

-- Adicionar campos para rastreamento de callbacks
ALTER TABLE public.monitorings 
ADD COLUMN IF NOT EXISTS tracking_id TEXT,
ADD COLUMN IF NOT EXISTS callback_url TEXT,
ADD COLUMN IF NOT EXISTS api_provider api_name;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_monitorings_tracking_id ON public.monitorings(tracking_id);
CREATE INDEX IF NOT EXISTS idx_monitorings_api_provider ON public.monitorings(api_provider);

-- Adicionar campo para métricas
ALTER TABLE public.monitorings
ADD COLUMN IF NOT EXISTS last_notification_at TIMESTAMPTZ;