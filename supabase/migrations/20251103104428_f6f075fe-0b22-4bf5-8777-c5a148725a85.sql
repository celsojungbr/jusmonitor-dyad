-- ============================================
-- SPRINT 1: MIGRAÇÕES PARA DATA LAKE E NOVAS FUNCIONALIDADES
-- ============================================

-- 1. Criar tabela de dados cadastrais (cache 7 dias)
CREATE TABLE IF NOT EXISTS public.registration_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document VARCHAR(20) UNIQUE NOT NULL,
  document_type VARCHAR(10) NOT NULL CHECK (document_type IN ('cpf', 'cnpj')),
  full_name TEXT,
  addresses JSONB DEFAULT '[]'::jsonb,
  contacts JSONB DEFAULT '[]'::jsonb,
  registration_status TEXT,
  additional_data JSONB DEFAULT '{}'::jsonb,
  last_update TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registration_data_document ON public.registration_data(document);
CREATE INDEX IF NOT EXISTS idx_registration_data_last_update ON public.registration_data(last_update);

-- RLS para registration_data
ALTER TABLE public.registration_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view registration data"
ON public.registration_data
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can insert registration data"
ON public.registration_data
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update registration data"
ON public.registration_data
FOR UPDATE
USING (true);

-- 2. Criar tabela de consultas penais (cache 30 dias)
CREATE TABLE IF NOT EXISTS public.criminal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf VARCHAR(14) UNIQUE NOT NULL,
  warrants JSONB DEFAULT '[]'::jsonb,
  criminal_executions JSONB DEFAULT '[]'::jsonb,
  has_active_warrants BOOLEAN DEFAULT FALSE,
  last_update TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_criminal_records_cpf ON public.criminal_records(cpf);
CREATE INDEX IF NOT EXISTS idx_criminal_records_last_update ON public.criminal_records(last_update);

-- RLS para criminal_records
ALTER TABLE public.criminal_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view criminal records"
ON public.criminal_records
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can insert criminal records"
ON public.criminal_records
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update criminal records"
ON public.criminal_records
FOR UPDATE
USING (true);

-- 3. Criar tabela de cache de diários oficiais (cache 1h)
CREATE TABLE IF NOT EXISTS public.diarios_oficiais_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_term TEXT NOT NULL,
  search_type VARCHAR(10) NOT NULL CHECK (search_type IN ('cpf', 'cnpj', 'oab', 'nome')),
  results JSONB DEFAULT '[]'::jsonb,
  results_count INTEGER DEFAULT 0,
  last_update TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diarios_search ON public.diarios_oficiais_cache(search_term, search_type);
CREATE INDEX IF NOT EXISTS idx_diarios_last_update ON public.diarios_oficiais_cache(last_update);

-- RLS para diarios_oficiais_cache
ALTER TABLE public.diarios_oficiais_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view diarios cache"
ON public.diarios_oficiais_cache
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can insert diarios cache"
ON public.diarios_oficiais_cache
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update diarios cache"
ON public.diarios_oficiais_cache
FOR UPDATE
USING (true);

-- 4. Adicionar campos de controle na tabela processes
ALTER TABLE public.processes 
ADD COLUMN IF NOT EXISTS search_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_searched_by UUID,
ADD COLUMN IF NOT EXISTS source_api api_name;

CREATE INDEX IF NOT EXISTS idx_processes_search_count ON public.processes(search_count);
CREATE INDEX IF NOT EXISTS idx_processes_source_api ON public.processes(source_api);

-- 5. Adicionar campos de métricas na tabela user_searches
ALTER TABLE public.user_searches
ADD COLUMN IF NOT EXISTS from_cache BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS api_used api_name,
ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;

CREATE INDEX IF NOT EXISTS idx_user_searches_from_cache ON public.user_searches(from_cache);
CREATE INDEX IF NOT EXISTS idx_user_searches_api_used ON public.user_searches(api_used);

-- 6. Criar função para incrementar contador de buscas
CREATE OR REPLACE FUNCTION public.increment_search_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_update > OLD.last_update THEN
    NEW.search_count = COALESCE(OLD.search_count, 0) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger para atualizar search_count automaticamente
DROP TRIGGER IF EXISTS update_search_count ON public.processes;
CREATE TRIGGER update_search_count
BEFORE UPDATE ON public.processes
FOR EACH ROW
EXECUTE FUNCTION public.increment_search_count();

-- 8. Criar tabela para jobs de captura de anexos (background)
CREATE TABLE IF NOT EXISTS public.attachment_capture_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnj_number TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_attachments INTEGER DEFAULT 0,
  captured_attachments INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachment_jobs_status ON public.attachment_capture_jobs(status);
CREATE INDEX IF NOT EXISTS idx_attachment_jobs_user ON public.attachment_capture_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_attachment_jobs_cnj ON public.attachment_capture_jobs(cnj_number);

-- RLS para attachment_capture_jobs
ALTER TABLE public.attachment_capture_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own capture jobs"
ON public.attachment_capture_jobs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can insert capture jobs"
ON public.attachment_capture_jobs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update capture jobs"
ON public.attachment_capture_jobs
FOR UPDATE
USING (true);