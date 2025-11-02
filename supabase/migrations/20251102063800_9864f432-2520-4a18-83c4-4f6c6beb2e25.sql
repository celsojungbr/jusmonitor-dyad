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