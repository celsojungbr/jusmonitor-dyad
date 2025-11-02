-- Create ENUMS
CREATE TYPE user_type AS ENUM ('user', 'lawyer', 'admin');
CREATE TYPE plan_type AS ENUM ('prepaid', 'plus', 'pro');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'expired');
CREATE TYPE search_type AS ENUM ('cpf', 'cnpj', 'oab', 'cnj');
CREATE TYPE monitoring_frequency AS ENUM ('daily', 'weekly');
CREATE TYPE monitoring_status AS ENUM ('active', 'paused', 'error');
CREATE TYPE credential_type AS ENUM ('password', 'certificate');
CREATE TYPE credential_status AS ENUM ('active', 'inactive', 'expired');
CREATE TYPE transaction_type AS ENUM ('purchase', 'consumption', 'refund');
CREATE TYPE api_name AS ENUM ('judit', 'escavador');
CREATE TYPE function_status AS ENUM ('active', 'inactive');
CREATE TYPE log_type AS ENUM ('api_call', 'user_action', 'error', 'admin_action');
CREATE TYPE notification_type AS ENUM ('monitoring', 'system', 'message');

-- ============================================
-- TABELA: profiles
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type user_type NOT NULL DEFAULT 'user',
    full_name TEXT NOT NULL,
    oab_number TEXT,
    cpf_cnpj TEXT NOT NULL UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para profiles
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_profiles_cpf_cnpj ON profiles(cpf_cnpj);

-- ============================================
-- TABELA: credits_plans
-- ============================================
CREATE TABLE credits_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan_type plan_type NOT NULL DEFAULT 'prepaid',
    credits_balance INTEGER NOT NULL DEFAULT 0,
    credit_cost DECIMAL(10,2) NOT NULL, -- 1.50, 1.00, ou 0.70
    subscription_status subscription_status DEFAULT 'active',
    next_billing_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para credits_plans
CREATE INDEX idx_credits_plans_user_id ON credits_plans(user_id);
CREATE INDEX idx_credits_plans_status ON credits_plans(subscription_status);

-- ============================================
-- TABELA: processes (DataLake)
-- ============================================
CREATE TABLE processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnj_number TEXT UNIQUE NOT NULL,
    tribunal TEXT,
    distribution_date DATE,
    status TEXT,
    case_value DECIMAL(15,2),
    judge_name TEXT,
    court_name TEXT,
    phase TEXT,
    author_names JSONB, -- array de nomes
    defendant_names JSONB, -- array de nomes
    parties_cpf_cnpj JSONB, -- array de documentos
    last_update TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para processes
CREATE INDEX idx_processes_cnj_number ON processes(cnj_number);
CREATE INDEX idx_processes_tribunal ON processes(tribunal);
CREATE INDEX idx_processes_parties_cpf_cnpj ON processes USING GIN(parties_cpf_cnpj);
CREATE INDEX idx_processes_last_update ON processes(last_update);

-- ============================================
-- TABELA: process_movements
-- ============================================
CREATE TABLE process_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
    movement_date DATE NOT NULL,
    movement_type TEXT,
    description TEXT NOT NULL,
    tribunal_source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para process_movements
CREATE INDEX idx_process_movements_process_id ON process_movements(process_id);
CREATE INDEX idx_process_movements_date ON process_movements(movement_date DESC);

-- ============================================
-- TABELA: process_attachments
-- ============================================
CREATE TABLE process_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
    attachment_name TEXT NOT NULL,
    attachment_type TEXT,
    file_url TEXT,
    file_size INTEGER,
    filing_date DATE,
    download_cost_credits INTEGER DEFAULT 2,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para process_attachments
CREATE INDEX idx_process_attachments_process_id ON process_attachments(process_id);

-- ============================================
-- TABELA: user_searches
-- ============================================
CREATE TABLE user_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    search_type search_type NOT NULL,
    search_value TEXT NOT NULL,
    credits_consumed INTEGER NOT NULL,
    results_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para user_searches
CREATE INDEX idx_user_searches_user_id ON user_searches(user_id);
CREATE INDEX idx_user_searches_created_at ON user_searches(created_at DESC);

-- ============================================
-- TABELA: user_processes
-- ============================================
CREATE TABLE user_processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    access_cost_credits INTEGER DEFAULT 0,
    UNIQUE(user_id, process_id)
);

-- Índices para user_processes
CREATE INDEX idx_user_processes_user_id ON user_processes(user_id);
CREATE INDEX idx_user_processes_process_id ON user_processes(process_id);

-- ============================================
-- TABELA: monitorings
-- ============================================
CREATE TABLE monitorings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    monitoring_type search_type NOT NULL,
    monitoring_value TEXT NOT NULL,
    process_id UUID REFERENCES processes(id) ON DELETE SET NULL,
    frequency monitoring_frequency NOT NULL DEFAULT 'daily',
    status monitoring_status NOT NULL DEFAULT 'active',
    last_check TIMESTAMPTZ,
    next_check TIMESTAMPTZ,
    alerts_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para monitorings
CREATE INDEX idx_monitorings_user_id ON monitorings(user_id);
CREATE INDEX idx_monitorings_status ON monitorings(status);
CREATE INDEX idx_monitorings_next_check ON monitorings(next_check);

-- ============================================
-- TABELA: monitoring_alerts
-- ============================================
CREATE TABLE monitoring_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitoring_id UUID NOT NULL REFERENCES monitorings(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    alert_data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para monitoring_alerts
CREATE INDEX idx_monitoring_alerts_monitoring_id ON monitoring_alerts(monitoring_id);
CREATE INDEX idx_monitoring_alerts_is_read ON monitoring_alerts(is_read);
CREATE INDEX idx_monitoring_alerts_created_at ON monitoring_alerts(created_at DESC);

-- ============================================
-- TABELA: credentials_vault
-- ============================================
CREATE TABLE credentials_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tribunal TEXT NOT NULL,
    credential_type credential_type NOT NULL,
    encrypted_credentials TEXT NOT NULL, -- criptografia E2E
    status credential_status DEFAULT 'active',
    last_used TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para credentials_vault
CREATE INDEX idx_credentials_vault_user_id ON credentials_vault(user_id);
CREATE INDEX idx_credentials_vault_tribunal ON credentials_vault(tribunal);

-- ============================================
-- TABELA: credit_transactions
-- ============================================
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    transaction_type transaction_type NOT NULL,
    operation_type TEXT, -- ex: "Consulta CPF", "Download Anexo"
    credits_amount INTEGER NOT NULL,
    cost_in_reais DECIMAL(10,2),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para credit_transactions
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(transaction_type);

-- ============================================
-- TABELA: api_configurations (Para Admin)
-- ============================================
CREATE TABLE api_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_name api_name NOT NULL UNIQUE,
    api_key TEXT NOT NULL, -- será criptografado
    endpoint_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 1,
    rate_limit INTEGER DEFAULT 100,
    timeout INTEGER DEFAULT 30000, -- em ms
    fallback_api TEXT,
    last_health_check TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para api_configurations
CREATE INDEX idx_api_configurations_is_active ON api_configurations(is_active);
CREATE INDEX idx_api_configurations_priority ON api_configurations(priority);

-- ============================================
-- TABELA: edge_function_config (Para Admin)
-- ============================================
CREATE TABLE edge_function_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    function_name TEXT NOT NULL UNIQUE,
    enabled_apis JSONB NOT NULL, -- array de API names
    api_priority JSONB NOT NULL, -- ordem de tentativa
    fallback_enabled BOOLEAN DEFAULT TRUE,
    status function_status DEFAULT 'active',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para edge_function_config
CREATE INDEX idx_edge_function_config_status ON edge_function_config(status);

-- ============================================
-- TABELA: system_logs
-- ============================================
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_type log_type NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para system_logs
CREATE INDEX idx_system_logs_log_type ON system_logs(log_type);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);

-- ============================================
-- TABELA: notifications
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    link_to TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- TABELA: messages
-- ============================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para messages
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_parent_id ON messages(parent_message_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- ============================================
-- TRIGGERS: updated_at automático
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credits_plans_updated_at BEFORE UPDATE ON credits_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_configurations_updated_at BEFORE UPDATE ON api_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_edge_function_config_updated_at BEFORE UPDATE ON edge_function_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Auto criar profile ao registrar usuário
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, user_type, full_name, cpf_cnpj)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'user_type', 'user')::user_type,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
        COALESCE(NEW.raw_user_meta_data->>'cpf_cnpj', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar profile automaticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCTION: Auto criar plano prepago ao criar profile
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.credits_plans (user_id, plan_type, credits_balance, credit_cost)
    VALUES (NEW.id, 'prepaid', 0, 1.50);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar plano automaticamente
CREATE TRIGGER on_profile_created
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

-- ============================================
-- INSERIR DADOS INICIAIS (Admin Config)
-- ============================================

-- Configuração padrão das APIs (admin precisará atualizar as keys)
INSERT INTO api_configurations (api_name, api_key, endpoint_url, priority)
VALUES
    ('judit', 'CONFIGURE_VIA_ADMIN', 'https://api.judit.io', 1),
    ('escavador', 'CONFIGURE_VIA_ADMIN', 'https://api.escavador.com', 2);

-- Configuração padrão das edge functions
INSERT INTO edge_function_config (function_name, enabled_apis, api_priority, fallback_enabled)
VALUES
    ('search-processes', '["judit", "escavador"]'::jsonb, '["judit", "escavador"]'::jsonb, TRUE),
    ('get-process-details', '["judit", "escavador"]'::jsonb, '["judit", "escavador"]'::jsonb, TRUE),
    ('download-attachments', '["judit"]'::jsonb, '["judit"]'::jsonb, FALSE);
