import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Scale, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import logoBlack from "@/assets/logo-horizontal-black.png";

const Auth = () => {
  const [userType, setUserType] = useState<"user" | "lawyer">("user");
  const [isLogin, setIsLogin] = useState(true);

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
                  >
                    <User className="w-6 h-6" />
                    <span>Usuário</span>
                  </Button>
                  <Button
                    type="button"
                    variant={userType === "lawyer" ? "default" : "outline"}
                    className="h-20 flex-col gap-2"
                    onClick={() => setUserType("lawyer")}
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
                    <Input id="name" placeholder="Seu nome" />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="seu@email.com" />
                </div>
                
                {!isLogin && userType === "lawyer" && (
                  <div className="space-y-2">
                    <Label htmlFor="oab">Número OAB</Label>
                    <Input id="oab" placeholder="Ex: SP123456" />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" placeholder="••••••••" />
                </div>
                
                {isLogin && (
                  <div className="flex justify-end">
                    <Button variant="link" className="px-0 text-sm">
                      Esqueceu a senha?
                    </Button>
                  </div>
                )}
                
                <Button className="w-full" size="lg">
                  {isLogin ? "Entrar" : "Criar Conta"}
                </Button>
              </TabsContent>
              
              <TabsContent value="google" className="space-y-4 mt-4">
                <Button variant="outline" className="w-full" size="lg">
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
                
                <Button variant="outline" className="w-full" size="lg">
                  Receber código por email
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
