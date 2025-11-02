-- ============================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitorings ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE edge_function_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS PARA RLS
-- ============================================

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND user_type = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para pegar user_id autenticado
CREATE OR REPLACE FUNCTION public.auth_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- POLÍTICAS RLS: profiles
-- ============================================

-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (is_admin());

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Admins podem atualizar qualquer perfil
CREATE POLICY "Admins can update all profiles"
    ON profiles FOR UPDATE
    USING (is_admin());

-- Admins podem inserir novos perfis
CREATE POLICY "Admins can insert profiles"
    ON profiles FOR INSERT
    WITH CHECK (is_admin());

-- ============================================
-- POLÍTICAS RLS: credits_plans
-- ============================================

-- Usuários podem ver seu próprio plano
CREATE POLICY "Users can view own plan"
    ON credits_plans FOR SELECT
    USING (user_id = auth.uid());

-- Admins podem ver todos os planos
CREATE POLICY "Admins can view all plans"
    ON credits_plans FOR SELECT
    USING (is_admin());

-- Usuários podem atualizar seu próprio plano (para pausar assinatura)
CREATE POLICY "Users can update own plan"
    ON credits_plans FOR UPDATE
    USING (user_id = auth.uid());

-- Admins podem atualizar qualquer plano
CREATE POLICY "Admins can update all plans"
    ON credits_plans FOR UPDATE
    USING (is_admin());

-- Sistema pode inserir planos (via trigger)
CREATE POLICY "System can insert plans"
    ON credits_plans FOR INSERT
    WITH CHECK (true);

-- ============================================
-- POLÍTICAS RLS: processes (DataLake público com controle)
-- ============================================

-- Processos são visíveis para usuários que os adicionaram
CREATE POLICY "Users can view their processes"
    ON processes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_processes
            WHERE user_processes.process_id = processes.id
            AND user_processes.user_id = auth.uid()
        ) OR is_admin()
    );

-- Apenas sistema/admin pode inserir processos (via edge functions)
CREATE POLICY "System can insert processes"
    ON processes FOR INSERT
    WITH CHECK (is_admin());

-- Apenas sistema/admin pode atualizar processos
CREATE POLICY "System can update processes"
    ON processes FOR UPDATE
    USING (is_admin());

-- ============================================
-- POLÍTICAS RLS: process_movements
-- ============================================

-- Usuários podem ver movimentações de processos que possuem
CREATE POLICY "Users can view movements of their processes"
    ON process_movements FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_processes
            WHERE user_processes.process_id = process_movements.process_id
            AND user_processes.user_id = auth.uid()
        ) OR is_admin()
    );

-- Sistema pode inserir/atualizar movimentações
CREATE POLICY "System can manage movements"
    ON process_movements FOR ALL
    USING (is_admin());

-- ============================================
-- POLÍTICAS RLS: process_attachments
-- ============================================

-- Usuários podem ver anexos de processos que possuem
CREATE POLICY "Users can view attachments of their processes"
    ON process_attachments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_processes
            WHERE user_processes.process_id = process_attachments.process_id
            AND user_processes.user_id = auth.uid()
        ) OR is_admin()
    );

-- Sistema pode inserir/atualizar anexos
CREATE POLICY "System can manage attachments"
    ON process_attachments FOR ALL
    USING (is_admin());

-- ============================================
-- POLÍTICAS RLS: user_searches
-- ============================================

-- Usuários podem ver suas próprias buscas
CREATE POLICY "Users can view own searches"
    ON user_searches FOR SELECT
    USING (user_id = auth.uid());

-- Admins podem ver todas as buscas
CREATE POLICY "Admins can view all searches"
    ON user_searches FOR SELECT
    USING (is_admin());

-- Sistema pode inserir buscas
CREATE POLICY "System can insert searches"
    ON user_searches FOR INSERT
    WITH CHECK (user_id = auth.uid() OR is_admin());

-- ============================================
-- POLÍTICAS RLS: user_processes
-- ============================================

-- Usuários podem ver seus próprios processos vinculados
CREATE POLICY "Users can view own process links"
    ON user_processes FOR SELECT
    USING (user_id = auth.uid());

-- Admins podem ver todos os vínculos
CREATE POLICY "Admins can view all process links"
    ON user_processes FOR SELECT
    USING (is_admin());

-- Sistema pode inserir vínculos
CREATE POLICY "System can insert process links"
    ON user_processes FOR INSERT
    WITH CHECK (user_id = auth.uid() OR is_admin());

-- Usuários podem deletar seus próprios vínculos
CREATE POLICY "Users can delete own process links"
    ON user_processes FOR DELETE
    USING (user_id = auth.uid());

-- ============================================
-- POLÍTICAS RLS: monitorings
-- ============================================

-- Usuários podem ver seus próprios monitoramentos
CREATE POLICY "Users can view own monitorings"
    ON monitorings FOR SELECT
    USING (user_id = auth.uid());

-- Admins podem ver todos os monitoramentos
CREATE POLICY "Admins can view all monitorings"
    ON monitorings FOR SELECT
    USING (is_admin());

-- Usuários podem criar seus próprios monitoramentos
CREATE POLICY "Users can create own monitorings"
    ON monitorings FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar seus próprios monitoramentos
CREATE POLICY "Users can update own monitorings"
    ON monitorings FOR UPDATE
    USING (user_id = auth.uid());

-- Sistema pode atualizar monitoramentos (cron job)
CREATE POLICY "System can update monitorings"
    ON monitorings FOR UPDATE
    USING (is_admin());

-- Usuários podem deletar seus próprios monitoramentos
CREATE POLICY "Users can delete own monitorings"
    ON monitorings FOR DELETE
    USING (user_id = auth.uid());

-- ============================================
-- POLÍTICAS RLS: monitoring_alerts
-- ============================================

-- Usuários podem ver alertas de seus monitoramentos
CREATE POLICY "Users can view own monitoring alerts"
    ON monitoring_alerts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM monitorings
            WHERE monitorings.id = monitoring_alerts.monitoring_id
            AND monitorings.user_id = auth.uid()
        ) OR is_admin()
    );

-- Sistema pode inserir alertas
CREATE POLICY "System can insert alerts"
    ON monitoring_alerts FOR INSERT
    WITH CHECK (true);

-- Usuários podem marcar alertas como lidos
CREATE POLICY "Users can update own alerts"
    ON monitoring_alerts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM monitorings
            WHERE monitorings.id = monitoring_alerts.monitoring_id
            AND monitorings.user_id = auth.uid()
        )
    );

-- ============================================
-- POLÍTICAS RLS: credentials_vault
-- ============================================

-- Usuários podem ver suas próprias credenciais
CREATE POLICY "Users can view own credentials"
    ON credentials_vault FOR SELECT
    USING (user_id = auth.uid());

-- Usuários podem criar suas próprias credenciais
CREATE POLICY "Users can create own credentials"
    ON credentials_vault FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar suas próprias credenciais
CREATE POLICY "Users can update own credentials"
    ON credentials_vault FOR UPDATE
    USING (user_id = auth.uid());

-- Usuários podem deletar suas próprias credenciais
CREATE POLICY "Users can delete own credentials"
    ON credentials_vault FOR DELETE
    USING (user_id = auth.uid());

-- ============================================
-- POLÍTICAS RLS: credit_transactions
-- ============================================

-- Usuários podem ver suas próprias transações
CREATE POLICY "Users can view own transactions"
    ON credit_transactions FOR SELECT
    USING (user_id = auth.uid());

-- Admins podem ver todas as transações
CREATE POLICY "Admins can view all transactions"
    ON credit_transactions FOR SELECT
    USING (is_admin());

-- Sistema pode inserir transações
CREATE POLICY "System can insert transactions"
    ON credit_transactions FOR INSERT
    WITH CHECK (user_id = auth.uid() OR is_admin());

-- ============================================
-- POLÍTICAS RLS: api_configurations (APENAS ADMIN)
-- ============================================

-- Apenas admins podem ver configurações de API
CREATE POLICY "Only admins can view api configs"
    ON api_configurations FOR SELECT
    USING (is_admin());

-- Apenas admins podem inserir configurações
CREATE POLICY "Only admins can insert api configs"
    ON api_configurations FOR INSERT
    WITH CHECK (is_admin());

-- Apenas admins podem atualizar configurações
CREATE POLICY "Only admins can update api configs"
    ON api_configurations FOR UPDATE
    USING (is_admin());

-- Apenas admins podem deletar configurações
CREATE POLICY "Only admins can delete api configs"
    ON api_configurations FOR DELETE
    USING (is_admin());

-- ============================================
-- POLÍTICAS RLS: edge_function_config (APENAS ADMIN)
-- ============================================

-- Apenas admins podem ver configurações de edge functions
CREATE POLICY "Only admins can view function configs"
    ON edge_function_config FOR SELECT
    USING (is_admin());

-- Apenas admins podem inserir configurações
CREATE POLICY "Only admins can insert function configs"
    ON edge_function_config FOR INSERT
    WITH CHECK (is_admin());

-- Apenas admins podem atualizar configurações
CREATE POLICY "Only admins can update function configs"
    ON edge_function_config FOR UPDATE
    USING (is_admin());

-- Apenas admins podem deletar configurações
CREATE POLICY "Only admins can delete function configs"
    ON edge_function_config FOR DELETE
    USING (is_admin());

-- ============================================
-- POLÍTICAS RLS: system_logs
-- ============================================

-- Usuários podem ver seus próprios logs
CREATE POLICY "Users can view own logs"
    ON system_logs FOR SELECT
    USING (user_id = auth.uid());

-- Admins podem ver todos os logs
CREATE POLICY "Admins can view all logs"
    ON system_logs FOR SELECT
    USING (is_admin());

-- Sistema pode inserir logs
CREATE POLICY "System can insert logs"
    ON system_logs FOR INSERT
    WITH CHECK (true);

-- ============================================
-- POLÍTICAS RLS: notifications
-- ============================================

-- Usuários podem ver suas próprias notificações
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

-- Sistema pode inserir notificações
CREATE POLICY "System can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- Usuários podem marcar notificações como lidas
CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

-- Usuários podem deletar suas notificações
CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE
    USING (user_id = auth.uid());

-- ============================================
-- POLÍTICAS RLS: messages
-- ============================================

-- Usuários podem ver mensagens enviadas ou recebidas por eles
CREATE POLICY "Users can view own messages"
    ON messages FOR SELECT
    USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Admins podem ver todas as mensagens
CREATE POLICY "Admins can view all messages"
    ON messages FOR SELECT
    USING (is_admin());

-- Usuários podem enviar mensagens
CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    WITH CHECK (sender_id = auth.uid());

-- Usuários podem marcar mensagens recebidas como lidas
CREATE POLICY "Users can update received messages"
    ON messages FOR UPDATE
    USING (receiver_id = auth.uid());

-- Usuários podem deletar mensagens enviadas ou recebidas
CREATE POLICY "Users can delete own messages"
    ON messages FOR DELETE
    USING (sender_id = auth.uid() OR receiver_id = auth.uid());
