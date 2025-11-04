-- Tabela de configuração de preços por operação
CREATE TABLE IF NOT EXISTS pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_name TEXT NOT NULL UNIQUE, -- 'consulta', 'atualizacao_processo', 'monitoramento_ativo'
  credits_cost INTEGER NOT NULL, -- Custo em créditos
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de planos de assinatura
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL UNIQUE, -- 'Pré-Pago', 'Plus', 'Pro'
  plan_type TEXT NOT NULL, -- 'prepaid', 'plus', 'pro'
  credit_price DECIMAL(10, 2) NOT NULL, -- Preço por crédito (R$)
  monthly_price DECIMAL(10, 2), -- Preço mensal (NULL para pré-pago)
  included_credits INTEGER DEFAULT 0, -- Créditos incluídos no plano mensal
  can_recharge BOOLEAN DEFAULT true, -- Pode recarregar créditos
  description TEXT,
  features JSONB, -- Lista de features do plano
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de promoções
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_name TEXT NOT NULL,
  promotion_type TEXT NOT NULL, -- 'discount_percentage', 'discount_fixed', 'bonus_credits', 'free_trial'
  description TEXT,
  discount_percentage DECIMAL(5, 2), -- Desconto em porcentagem (ex: 20.00 para 20%)
  discount_fixed DECIMAL(10, 2), -- Desconto fixo em reais
  bonus_credits INTEGER, -- Créditos bônus
  applicable_to TEXT[], -- Array de plan_types que a promoção se aplica
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  max_uses INTEGER, -- Máximo de usos (NULL = ilimitado)
  current_uses INTEGER DEFAULT 0,
  coupon_code TEXT UNIQUE, -- Código do cupom (opcional)
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

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

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

-- Políticas de acesso

-- Pricing Config: todos podem ler, apenas admins podem modificar
CREATE POLICY "Anyone can read active pricing config"
  ON pricing_config FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage pricing config"
  ON pricing_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Subscription Plans: todos podem ler planos ativos, apenas admins podem modificar
CREATE POLICY "Anyone can read active subscription plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans"
  ON subscription_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

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
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );
