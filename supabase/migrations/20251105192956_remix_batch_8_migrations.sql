
-- Migration: 20251102063759
-- Create enums
CREATE TYPE public.user_type AS ENUM ('user', 'lawyer', 'admin');
CREATE TYPE public.plan_type AS ENUM ('prepaid', 'plus', 'pro');
CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'expired');
CREATE TYPE public.search_type AS ENUM ('cpf', 'cnpj', 'oab', 'cnj');
CREATE TYPE public.monitoring_frequency AS ENUM ('daily', 'weekly');
CREATE TYPE public.monitoring_status AS ENUM ('active', 'paused', 'error');
CREATE TYPE public.credential_type AS ENUM ('password', 'certificate');
CREATE TYPE public.credential_status AS ENUM ('active', 'inactive', 'expired');
CREATE TYPE public.transaction_type AS ENUM ('purchase', 'consumption', 'refund');
CREATE TYPE public.api_name AS ENUM ('judit', 'escavador');
CREATE TYPE public.function_status AS ENUM ('active', 'inactive');
CREATE TYPE public.log_type AS ENUM ('api_call', 'user_action', 'error', 'admin_action');
CREATE TYPE public.notification_type AS ENUM ('monitoring', 'system', 'message');
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type user_type NOT NULL DEFAULT 'user',
  full_name TEXT NOT NULL,
  oab_number TEXT,
  cpf_cnpj TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (security critical)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create credits_plans table
CREATE TABLE public.credits_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_type plan_type NOT NULL DEFAULT 'prepaid',
  credits_balance INTEGER NOT NULL DEFAULT 0,
  credit_cost DECIMAL(10,2) NOT NULL DEFAULT 1.50,
  subscription_status subscription_status NOT NULL DEFAULT 'active',
  next_billing_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create processes table (DataLake)
CREATE TABLE public.processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnj_number TEXT UNIQUE NOT NULL,
  tribunal TEXT NOT NULL,
  distribution_date DATE,
  status TEXT,
  case_value DECIMAL(15,2),
  judge_name TEXT,
  court_name TEXT,
  phase TEXT,
  author_names JSONB,
  defendant_names JSONB,
  parties_cpf_cnpj JSONB,
  last_update TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create process_movements table
CREATE TABLE public.process_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID REFERENCES public.processes(id) ON DELETE CASCADE NOT NULL,
  movement_date DATE NOT NULL,
  movement_type TEXT,
  description TEXT NOT NULL,
  tribunal_source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create process_attachments table
CREATE TABLE public.process_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID REFERENCES public.processes(id) ON DELETE CASCADE NOT NULL,
  attachment_name TEXT NOT NULL,
  attachment_type TEXT,
  file_url TEXT,
  file_size INTEGER,
  filing_date DATE,
  download_cost_credits INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_searches table
CREATE TABLE public.user_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  search_type search_type NOT NULL,
  search_value TEXT NOT NULL,
  credits_consumed INTEGER NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_processes table
CREATE TABLE public.user_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  process_id UUID REFERENCES public.processes(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  access_cost_credits INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, process_id)
);

-- Create monitorings table
CREATE TABLE public.monitorings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  monitoring_type search_type NOT NULL,
  monitoring_value TEXT NOT NULL,
  process_id UUID REFERENCES public.processes(id) ON DELETE SET NULL,
  frequency monitoring_frequency NOT NULL DEFAULT 'weekly',
  status monitoring_status NOT NULL DEFAULT 'active',
  last_check TIMESTAMPTZ,
  next_check TIMESTAMPTZ,
  alerts_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create monitoring_alerts table
CREATE TABLE public.monitoring_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitoring_id UUID REFERENCES public.monitorings(id) ON DELETE CASCADE NOT NULL,
  alert_type TEXT NOT NULL,
  alert_data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create credentials_vault table
CREATE TABLE public.credentials_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tribunal TEXT NOT NULL,
  credential_type credential_type NOT NULL,
  encrypted_credentials TEXT NOT NULL,
  status credential_status NOT NULL DEFAULT 'active',
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create credit_transactions table
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  transaction_type transaction_type NOT NULL,
  operation_type TEXT,
  credits_amount INTEGER NOT NULL,
  cost_in_reais DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create api_configurations table
CREATE TABLE public.api_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name api_name NOT NULL UNIQUE,
  api_key TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 1,
  rate_limit INTEGER NOT NULL DEFAULT 100,
  timeout INTEGER NOT NULL DEFAULT 30000,
  fallback_api TEXT,
  last_health_check TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create edge_function_config table
CREATE TABLE public.edge_function_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL UNIQUE,
  enabled_apis JSONB NOT NULL DEFAULT '[]',
  api_priority JSONB NOT NULL DEFAULT '[]',
  fallback_enabled BOOLEAN NOT NULL DEFAULT true,
  status function_status NOT NULL DEFAULT 'active',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create system_logs table
CREATE TABLE public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type log_type NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  notification_type notification_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  link_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  parent_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_type, full_name, cpf_cnpj, oab_number, phone)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'user'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'cpf_cnpj', ''),
    NEW.raw_user_meta_data->>'oab_number',
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- Create default credits plan
  INSERT INTO public.credits_plans (user_id, plan_type, credits_balance, credit_cost)
  VALUES (NEW.id, 'prepaid', 0, 1.50);
  
  -- Add default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credits_plans_updated_at
  BEFORE UPDATE ON public.credits_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitorings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edge_function_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for credits_plans
CREATE POLICY "Users can view their own credits"
  ON public.credits_plans FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all credits"
  ON public.credits_plans FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can update credits"
  ON public.credits_plans FOR UPDATE
  USING (true);

-- RLS Policies for processes (public read for DataLake)
CREATE POLICY "Authenticated users can view processes"
  ON public.processes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert processes"
  ON public.processes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update processes"
  ON public.processes FOR UPDATE
  USING (true);

-- RLS Policies for process_movements
CREATE POLICY "Authenticated users can view movements"
  ON public.process_movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert movements"
  ON public.process_movements FOR INSERT
  WITH CHECK (true);

-- RLS Policies for process_attachments
CREATE POLICY "Authenticated users can view attachments"
  ON public.process_attachments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert attachments"
  ON public.process_attachments FOR INSERT
  WITH CHECK (true);

-- RLS Policies for user_searches
CREATE POLICY "Users can view their own searches"
  ON public.user_searches FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert searches"
  ON public.user_searches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all searches"
  ON public.user_searches FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_processes
CREATE POLICY "Users can view their own processes"
  ON public.user_processes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert user processes"
  ON public.user_processes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all user processes"
  ON public.user_processes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for monitorings
CREATE POLICY "Users can view their own monitorings"
  ON public.monitorings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own monitorings"
  ON public.monitorings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own monitorings"
  ON public.monitorings FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own monitorings"
  ON public.monitorings FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for monitoring_alerts
CREATE POLICY "Users can view their monitoring alerts"
  ON public.monitoring_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.monitorings
      WHERE id = monitoring_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert alerts"
  ON public.monitoring_alerts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their alerts"
  ON public.monitoring_alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.monitorings
      WHERE id = monitoring_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for credentials_vault
CREATE POLICY "Users can view their own credentials"
  ON public.credentials_vault FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own credentials"
  ON public.credentials_vault FOR ALL
  USING (user_id = auth.uid());

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.credit_transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all transactions"
  ON public.credit_transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for api_configurations (admin only)
CREATE POLICY "Admins can manage API configs"
  ON public.api_configurations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for edge_function_config (admin only)
CREATE POLICY "Admins can manage edge function configs"
  ON public.edge_function_config FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for system_logs (admin only)
CREATE POLICY "Admins can view all logs"
  ON public.system_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert logs"
  ON public.system_logs FOR INSERT
  WITH CHECK (true);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- RLS Policies for messages
CREATE POLICY "Users can view messages they sent or received"
  ON public.messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update messages they received"
  ON public.messages FOR UPDATE
  USING (receiver_id = auth.uid());

-- Insert initial data for API configurations
INSERT INTO public.api_configurations (api_name, api_key, endpoint_url, priority) VALUES
  ('judit', 'placeholder_will_be_replaced', 'https://api.judit.io/v1', 1),
  ('escavador', 'placeholder_will_be_replaced', 'https://api.escavador.com/v2', 2);

-- Insert initial edge function configurations
INSERT INTO public.edge_function_config (function_name, enabled_apis, api_priority, fallback_enabled) VALUES
  ('search-processes', '["judit", "escavador"]', '["judit", "escavador"]', true),
  ('get-process-details', '["judit", "escavador"]', '["judit", "escavador"]', true),
  ('download-attachments', '["judit"]', '["judit"]', false);

-- Create indexes for performance
CREATE INDEX idx_processes_cnj ON public.processes(cnj_number);
CREATE INDEX idx_processes_parties ON public.processes USING GIN(parties_cpf_cnpj);
CREATE INDEX idx_user_searches_user ON public.user_searches(user_id);
CREATE INDEX idx_user_processes_user ON public.user_processes(user_id);
CREATE INDEX idx_monitorings_user ON public.monitorings(user_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id, is_read);

-- Migration: 20251103104425
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

-- Migration: 20251103105852
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

-- Migration: 20251103120438
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

-- Migration: 20251103140508
-- Add feature_id column to edge_function_config
ALTER TABLE edge_function_config 
ADD COLUMN IF NOT EXISTS feature_id TEXT;

-- Update existing records to associate with busca-processual-cpf-cnpj feature
UPDATE edge_function_config 
SET feature_id = 'busca-processual-cpf-cnpj' 
WHERE function_name IN (
  'escavador_consulta_CPF_CNPJ',
  'judit-search-document',
  'judit_consulta_hot_storage'
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_edge_function_config_feature_status 
ON edge_function_config(feature_id, status);

-- Migration: 20251103161230
-- Adicionar colunas para advogados separados na tabela processes
ALTER TABLE processes 
ADD COLUMN IF NOT EXISTS author_lawyers jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS defendant_lawyers jsonb DEFAULT NULL;

COMMENT ON COLUMN processes.author_lawyers IS 'Advogados do autor (array de objetos com name e oab)';
COMMENT ON COLUMN processes.defendant_lawyers IS 'Advogados do réu (array de objetos com name e oab)';

-- Migration: 20251104195050
-- Tabela de configuração de preços por operação
CREATE TABLE IF NOT EXISTS pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_name TEXT NOT NULL UNIQUE,
  credits_cost INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de planos de assinatura
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL UNIQUE,
  plan_type TEXT NOT NULL,
  credit_price DECIMAL(10, 2) NOT NULL,
  monthly_price DECIMAL(10, 2),
  included_credits INTEGER DEFAULT 0,
  can_recharge BOOLEAN DEFAULT true,
  description TEXT,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de promoções
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_name TEXT NOT NULL,
  promotion_type TEXT NOT NULL,
  description TEXT,
  discount_percentage DECIMAL(5, 2),
  discount_fixed DECIMAL(10, 2),
  bonus_credits INTEGER,
  applicable_to TEXT[],
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  coupon_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pricing_config_active ON pricing_config(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_type ON subscription_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_coupon ON promotions(coupon_code);

-- Trigger para atualizar updated_at (reutiliza função existente)
CREATE TRIGGER update_pricing_config_updated_at BEFORE UPDATE ON pricing_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir configurações iniciais de preços por operação
INSERT INTO pricing_config (operation_name, credits_cost, description) VALUES
  ('consulta', 9, 'Custo em créditos para realizar uma consulta'),
  ('atualizacao_processo', 5, 'Custo em créditos para atualizar um processo'),
  ('monitoramento_ativo', 10, 'Custo em créditos para monitoramento ativo mensal')
ON CONFLICT (operation_name) DO NOTHING;

-- Inserir planos iniciais
INSERT INTO subscription_plans (plan_name, plan_type, credit_price, monthly_price, included_credits, can_recharge, description, display_order, features) VALUES
  (
    'Pré-Pago',
    'prepaid',
    1.50,
    NULL,
    0,
    true,
    'Pague apenas pelos créditos que usar',
    1,
    '["Sem mensalidade", "Créditos não expiram", "Ideal para uso esporádico", "R$ 1,50 por crédito"]'::jsonb
  ),
  (
    'Plus',
    'plus',
    1.00,
    49.00,
    49,
    true,
    'Plano mensal com créditos incluídos',
    2,
    '["49 créditos incluídos", "R$ 1,00 por crédito adicional", "33% de economia", "Renovação automática"]'::jsonb
  ),
  (
    'Pro',
    'pro',
    0.70,
    990.00,
    1415,
    true,
    'Plano profissional para alto volume',
    3,
    '["1.415 créditos incluídos", "R$ 0,70 por crédito adicional", "53% de economia", "Suporte prioritário"]'::jsonb
  )
ON CONFLICT (plan_name) DO NOTHING;

-- Inserir promoção de exemplo
INSERT INTO promotions (
  promotion_name,
  promotion_type,
  description,
  discount_percentage,
  applicable_to,
  start_date,
  end_date,
  is_active
) VALUES
  (
    'Black Friday 2025',
    'discount_percentage',
    'Desconto especial de Black Friday em todos os planos',
    30.00,
    ARRAY['plus', 'pro'],
    '2025-11-20 00:00:00',
    '2025-11-30 23:59:59',
    false
  )
ON CONFLICT DO NOTHING;

-- Habilitar RLS (Row Level Security)
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso com segurança corrigida usando has_role()

-- Pricing Config: todos podem ler, apenas admins podem modificar
CREATE POLICY "Anyone can read active pricing config"
  ON pricing_config FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage pricing config"
  ON pricing_config FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Subscription Plans: todos podem ler planos ativos, apenas admins podem modificar
CREATE POLICY "Anyone can read active subscription plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans"
  ON subscription_plans FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Promotions: todos podem ler promoções ativas, apenas admins podem modificar
CREATE POLICY "Anyone can read active promotions"
  ON promotions FOR SELECT
  USING (
    is_active = true
    AND start_date <= NOW()
    AND end_date >= NOW()
  );

CREATE POLICY "Admins can manage promotions"
  ON promotions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Migration: 20251104201252
-- 1. Criar bucket de storage para avatares (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profiles',
  'profiles',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- 2. Políticas RLS para o bucket profiles
-- Qualquer um pode visualizar as imagens (bucket é público)
CREATE POLICY "Anyone can view profile avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

-- Usuários autenticados podem fazer upload de seus próprios avatares
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Usuários podem atualizar seus próprios avatares
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Usuários podem deletar seus próprios avatares
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Criar tabela de preferências de notificações
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  process_alerts BOOLEAN NOT NULL DEFAULT true,
  credit_alerts BOOLEAN NOT NULL DEFAULT true,
  system_updates BOOLEAN NOT NULL DEFAULT true,
  marketing_emails BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS na tabela
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notification_preferences
CREATE POLICY "Users can view their own notification preferences"
ON public.notification_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
ON public.notification_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
ON public.notification_preferences FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notification preferences"
ON public.notification_preferences FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Trigger para atualizar updated_at
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Criar preferências padrão quando usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_preferences
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_preferences();

-- 6. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id 
ON public.notification_preferences(user_id);
