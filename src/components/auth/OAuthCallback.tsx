import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function OAuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Tratar erros retornados pelo provider (se houver)
        const url = new URL(window.location.href);
        const providerError = url.searchParams.get('error_description') || url.searchParams.get('error');
        if (providerError) {
          throw new Error(providerError);
        }

        // Se houver 'code' na URL, trocar por sessão
        const code = url.searchParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          // Limpa parâmetros da URL após sucesso (mantém rota limpa)
          window.history.replaceState({}, document.title, '/auth/callback');
        }

        // Agora obter a sessão ativa
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) throw new Error('Nenhuma sessão encontrada');

        // Verificar se o perfil existe
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        // Se o perfil não existe, criar um
        if (!profile) {
          const fullName = session.user.user_metadata?.full_name ||
                        session.user.user_metadata?.name ||
                        session.user.email?.split('@')[0] ||
                        'Usuário';

          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              full_name: fullName,
              user_type: 'user',
              cpf_cnpj: '',
            });

          if (insertError) throw insertError;

          // Criar plano de créditos
          const { error: creditsError } = await supabase
            .from('credits_plans')
            .insert({
              user_id: session.user.id,
              plan_type: 'prepaid',
              credits_balance: 0,
              credit_cost: 0.50,
            });

          if (creditsError && creditsError.code !== '23505') {
            throw creditsError;
          }
        }

        toast({
          title: 'Login realizado com sucesso!',
          description: 'Bem-vindo ao JusMonitor',
        });

        navigate('/dashboard/consultas');
      } catch (error: any) {
        console.error('Erro no callback OAuth:', error);

        toast({
          title: 'Erro no login',
          description: error.message || 'Não foi possível completar o login com Google',
          variant: 'destructive',
        });

        navigate('/auth');
      }
    };

    handleOAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg font-medium">Completando login...</p>
        <p className="text-sm text-muted-foreground mt-2">
          Aguarde enquanto configuramos sua conta
        </p>
      </div>
    </div>
  );
}