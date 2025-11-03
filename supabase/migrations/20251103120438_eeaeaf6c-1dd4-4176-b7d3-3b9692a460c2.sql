-- Criar tabela para rastrear buscas assíncronas
CREATE TABLE IF NOT EXISTS public.async_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_type search_type NOT NULL,
  search_value TEXT NOT NULL,
  request_id TEXT NOT NULL,
  provider api_name NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  results_count INTEGER DEFAULT 0,
  error_message TEXT
);

-- Habilitar RLS
ALTER TABLE public.async_searches ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own async searches"
  ON public.async_searches
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert async searches"
  ON public.async_searches
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update async searches"
  ON public.async_searches
  FOR UPDATE
  USING (true);

-- Criar índice para buscar por request_id (usado nos callbacks)
CREATE INDEX IF NOT EXISTS idx_async_searches_request_id ON public.async_searches(request_id);

-- Criar índice para buscar por user_id e status
CREATE INDEX IF NOT EXISTS idx_async_searches_user_status ON public.async_searches(user_id, status);