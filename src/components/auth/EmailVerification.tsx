import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import logoBlack from "@/assets/logo-horizontal-black.png";

export function EmailVerification() {
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");
      const type = searchParams.get("type");

      if (!token || type !== "signup") {
        setError("Link de verificação inválido");
        setLoading(false);
        return;
      }

      try {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: "signup",
        });

        if (verifyError) throw verifyError;

        setVerified(true);
        toast({
          title: "Email verificado!",
          description: "Sua conta foi ativada com sucesso",
        });

        // Redirecionar para o dashboard após 3 segundos
        setTimeout(() => {
          navigate("/dashboard/consultas");
        }, 3000);
      } catch (err: any) {
        console.error("Erro ao verificar email:", err);
        setError(err.message || "Erro ao verificar email");
        toast({
          title: "Erro na verificação",
          description: "Não foi possível verificar seu email",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/">
            <img src={logoBlack} alt="JusMonitor" className="h-12 mx-auto mb-4" />
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Verificação de Email</CardTitle>
            <CardDescription>
              {loading
                ? "Verificando seu email..."
                : verified
                ? "Email verificado com sucesso!"
                : "Erro na verificação"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            {loading && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Aguarde enquanto verificamos seu email...
                </p>
              </>
            )}

            {!loading && verified && (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <p className="text-sm text-muted-foreground text-center">
                  Seu email foi verificado com sucesso! Você será redirecionado para o
                  dashboard em alguns segundos.
                </p>
                <Button asChild className="w-full">
                  <Link to="/dashboard/consultas">Ir para o Dashboard</Link>
                </Button>
              </>
            )}

            {!loading && error && (
              <>
                <XCircle className="h-12 w-12 text-destructive" />
                <p className="text-sm text-destructive text-center">{error}</p>
                <div className="flex flex-col gap-2 w-full">
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/auth">Voltar para o Login</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => window.location.reload()}
                  >
                    Tentar Novamente
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}