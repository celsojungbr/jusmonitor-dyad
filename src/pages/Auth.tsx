import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Scale, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/shared/services/authService";
import logoBlack from "@/assets/logo-horizontal-black.png";

const Auth = () => {
  const [userType, setUserType] = useState<"user" | "lawyer">("user");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [oabNumber, setOabNumber] = useState("");
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Senha fraca",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await AuthService.signUp({
        email,
        password,
        fullName,
        cpfCnpj: "", // Pode adicionar campo no formulário se necessário
        userType,
        oabNumber: userType === "lawyer" ? oabNumber : undefined,
      });

      toast({
        title: "Conta criada com sucesso!",
        description: "Você já pode fazer login",
      });

      // Já faz login automaticamente
      navigate("/dashboard/consultas");
    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      
      let errorMessage = "Erro ao criar conta. Tente novamente.";
      
      if (error.message?.includes("User already registered")) {
        errorMessage = "Este email já está cadastrado. Faça login.";
      } else if (error.message?.includes("Password should be")) {
        errorMessage = "A senha deve ter pelo menos 6 caracteres";
      }

      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha email e senha",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await AuthService.signIn({ email, password });
      
      toast({
        title: "Login realizado!",
        description: "Bem-vindo ao JusMonitor",
      });

      navigate("/dashboard/consultas");
    } catch (error: any) {
      console.error("Erro no login:", error);
      
      let errorMessage = "Email ou senha incorretos";
      
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Email ou senha incorretos";
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = "Confirme seu email antes de fazer login";
      }

      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      toast({
        title: "Email obrigatório",
        description: "Digite seu email para receber o código",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await AuthService.signInWithOtp(email);
      
      toast({
        title: "Código enviado!",
        description: "Verifique seu email para fazer login",
      });
    } catch (error: any) {
      console.error("Erro ao enviar magic link:", error);
      
      toast({
        title: "Erro ao enviar código",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await AuthService.signInWithGoogle();
    } catch (error: any) {
      console.error("Erro no login com Google:", error);
      
      toast({
        title: "Erro no login",
        description: "Não foi possível fazer login com Google",
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isLogin ? "Entrar" : "Criar Conta"}</CardTitle>
            <CardDescription>
              {isLogin 
                ? "Acesse sua conta do JusMonitor" 
                : "Crie sua conta e comece a monitorar processos"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isLogin && (
              <div className="space-y-3">
                <Label>Tipo de Conta</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={userType === "user" ? "default" : "outline"}
                    className="h-20 flex-col gap-2"
                    onClick={() => setUserType("user")}
                    disabled={loading}
                  >
                    <User className="w-6 h-6" />
                    <span>Usuário</span>
                  </Button>
                  <Button
                    type="button"
                    variant={userType === "lawyer" ? "default" : "outline"}
                    className="h-20 flex-col gap-2"
                    onClick={() => setUserType("lawyer")}
                    disabled={loading}
                  >
                    <Scale className="w-6 h-6" />
                    <span>Advogado</span>
                  </Button>
                </div>
              </div>
            )}

            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="google">Google</TabsTrigger>
              </TabsList>
              
              <TabsContent value="email" className="space-y-4 mt-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input 
                      id="name" 
                      placeholder="Seu nome" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                {!isLogin && userType === "lawyer" && (
                  <div className="space-y-2">
                    <Label htmlFor="oab">Número OAB</Label>
                    <Input 
                      id="oab" 
                      placeholder="Ex: SP123456" 
                      value={oabNumber}
                      onChange={(e) => setOabNumber(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                {isLogin && (
                  <div className="flex justify-end">
                    <Button 
                      variant="link" 
                      className="px-0 text-sm"
                      onClick={() => {
                        // Implementar recuperação de senha futuramente
                        toast({
                          title: "Em breve",
                          description: "Funcionalidade de recuperação de senha será implementada em breve",
                        });
                      }}
                    >
                      Esqueceu a senha?
                    </Button>
                  </div>
                )}
                
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={isLogin ? handleSignIn : handleSignUp}
                  disabled={loading}
                >
                  {loading ? "Carregando..." : (isLogin ? "Entrar" : "Criar Conta")}
                </Button>
              </TabsContent>
              
              <TabsContent value="google" className="space-y-4 mt-4">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  size="lg"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Continuar com Google
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">ou</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="magic-email">Email</Label>
                  <Input 
                    id="magic-email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full" 
                  size="lg"
                  onClick={handleMagicLink}
                  disabled={loading}
                >
                  {loading ? "Enviando..." : "Receber código por email"}
                </Button>
              </TabsContent>
            </Tabs>

            <div className="text-center text-sm">
              {isLogin ? (
                <span>
                  Não tem conta?{" "}
                  <Button
                    variant="link"
                    className="px-1"
                    onClick={() => setIsLogin(false)}
                    disabled={loading}
                  >
                    Cadastre-se
                  </Button>
                </span>
              ) : (
                <span>
                  Já tem conta?{" "}
                  <Button
                    variant="link"
                    className="px-1"
                    onClick={() => setIsLogin(true)}
                    disabled={loading}
                  >
                    Entrar
                  </Button>
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
