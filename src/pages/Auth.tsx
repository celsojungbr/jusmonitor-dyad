import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Scale, Mail } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/shared/services/authService";
import { PasswordRecovery } from "@/components/auth/PasswordRecovery";
import logoBlack from "@/assets/logo-horizontal-black.png";

const Auth = () => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname !== "/register");
  const [userType, setUserType] = useState<"user" | "lawyer">("user");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setIsLogin(location.pathname !== "/register");
  }, [location.pathname]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    cpfCnpj: "",
    oabNumber: "",
    phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await AuthService.signIn({
          email: formData.email,
          password: formData.password,
        });

        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo de volta ao JusMonitor",
        });

        navigate("/dashboard/consultas");
      } else {
        const result = await AuthService.signUp({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          cpfCnpj: formData.cpfCnpj,
          userType,
          oabNumber: userType === "lawyer" ? formData.oabNumber : undefined,
          phone: formData.phone || undefined,
        });

        // Verificar se precisa confirmar email
        if (result.user && !result.session) {
          toast({
            title: "Verifique seu email!",
            description: "Enviamos um link de confirmação para " + formData.email,
          });
          console.log('⚠️ Usuário criado mas precisa confirmar email');
        } else {
          toast({
            title: "Conta criada com sucesso!",
            description: "Você já pode começar a usar o JusMonitor",
          });
          navigate("/dashboard/consultas");
        }
      }
    } catch (error: any) {
      console.error("Erro na autenticação:", error);
      toast({
        title: "Erro na autenticação",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!formData.email) {
      toast({
        title: "Email obrigatório",
        description: "Digite seu email para receber o link de acesso",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await AuthService.signInWithMagicLink(formData.email);

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para acessar sua conta",
      });
    } catch (error: any) {
      console.error("Erro ao enviar magic link:", error);
      toast({
        title: "Erro ao enviar email",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await AuthService.signInWithGoogle();
    } catch (error: any) {
      console.error("Erro no login com Google:", error);
      toast({
        title: "Erro no login",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/">
            <img src={logoBlack} alt="JusMonitor" className="h-12 mx-auto mb-4" />
          </Link>
          <h1 className="text-2xl font-bold">
            {isLogin ? "Bem-vindo de volta" : "Criar conta"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLogin
              ? "Entre com sua conta para continuar"
              : "Cadastre-se para começar a monitorar processos"}
          </p>
        </div>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="google">Google</TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>{isLogin ? "Entrar" : "Criar Conta"}</CardTitle>
                <CardDescription>
                  {isLogin
                    ? "Digite suas credenciais para acessar"
                    : "Preencha os dados para criar sua conta"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <>
                      <div className="space-y-2">
                        <Label>Tipo de Usuário</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant={userType === "user" ? "default" : "outline"}
                            onClick={() => setUserType("user")}
                            className="w-full"
                          >
                            <User className="w-4 h-4 mr-2" />
                            Usuário
                          </Button>
                          <Button
                            type="button"
                            variant={userType === "lawyer" ? "default" : "outline"}
                            onClick={() => setUserType("lawyer")}
                            className="w-full"
                          >
                            <Scale className="w-4 h-4 mr-2" />
                            Advogado
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fullName">Nome Completo</Label>
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Seu nome completo"
                          value={formData.fullName}
                          onChange={(e) =>
                            setFormData({ ...formData, fullName: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                        <Input
                          id="cpfCnpj"
                          type="text"
                          placeholder="000.000.000-00"
                          value={formData.cpfCnpj}
                          onChange={(e) =>
                            setFormData({ ...formData, cpfCnpj: e.target.value })
                          }
                          required
                        />
                      </div>

                      {userType === "lawyer" && (
                        <div className="space-y-2">
                          <Label htmlFor="oabNumber">Número da OAB</Label>
                          <Input
                            id="oabNumber"
                            type="text"
                            placeholder="OAB/UF 000000"
                            value={formData.oabNumber}
                            onChange={(e) =>
                              setFormData({ ...formData, oabNumber: e.target.value })
                            }
                            required
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone (opcional)</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(00) 00000-0000"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      minLength={6}
                    />
                  </div>

                  {isLogin && (
                    <div className="flex justify-end">
                      <PasswordRecovery />
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar Conta"}
                  </Button>

                  <div className="text-center text-sm">
                    {isLogin ? (
                      <span>
                        Não tem uma conta?{" "}
                        <button
                          type="button"
                          onClick={() => setIsLogin(false)}
                          className="text-primary hover:underline"
                        >
                          Cadastre-se
                        </button>
                      </span>
                    ) : (
                      <span>
                        Já tem uma conta?{" "}
                        <button
                          type="button"
                          onClick={() => setIsLogin(true)}
                          className="text-primary hover:underline"
                        >
                          Entrar
                        </button>
                      </span>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="google">
            <Card>
              <CardHeader>
                <CardTitle>Login com Google</CardTitle>
                <CardDescription>
                  Use sua conta Google para acessar rapidamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleGoogleLogin}
                  variant="outline"
                  className="w-full h-11 text-base font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Conectando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continuar com Google
                    </>
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Ou use magic link
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="magic-email">Email</Label>
                  <Input
                    id="magic-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                <Button
                  onClick={handleMagicLink}
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Receber código por email
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <Link to="/" className="hover:underline">
            Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;