import { useState } from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, Bell, Shield, Mail, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Email change state
  const [newEmail, setNewEmail] = useState("");

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    processAlerts: true,
    creditAlerts: true,
    systemUpdates: false,
    marketingEmails: false,
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error("As senhas não coincidem");
      }

      if (passwordData.newPassword.length < 6) {
        throw new Error("A senha deve ter pelo menos 6 caracteres");
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso!",
      });

      // Limpar formulário
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível alterar a senha.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;

      toast({
        title: "Verificação Enviada",
        description: "Um e-mail de verificação foi enviado para o novo endereço.",
      });

      setNewEmail("");
    } catch (error: any) {
      console.error("Erro ao alterar e-mail:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível alterar o e-mail.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });

    // Auto-save (you could debounce this in production)
    toast({
      title: "Preferência Salva",
      description: "Suas preferências de notificação foram atualizadas.",
    });
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas configurações de conta e preferências
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="account">
            <Lock className="mr-2 h-4 w-4" />
            Conta
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notificações
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          {/* Email Change */}
          <Card>
            <CardHeader>
              <CardTitle>Alterar E-mail</CardTitle>
              <CardDescription>
                Atualize o endereço de e-mail da sua conta. Você receberá um e-mail de verificação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_email">E-mail Atual</Label>
                  <Input
                    id="current_email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_email">Novo E-mail</Label>
                  <Input
                    id="new_email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="novo@email.com"
                    required
                  />
                </div>
                <Button type="submit" disabled={loading || !newEmail}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Alterar E-mail
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>
                Mantenha sua conta segura com uma senha forte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new_password">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                      }
                      placeholder="Digite sua nova senha"
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      placeholder="Confirme sua nova senha"
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-sm text-muted-foreground">
                    Dicas para uma senha forte:
                  </p>
                  <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                    <li>Use pelo menos 8 caracteres</li>
                    <li>Combine letras maiúsculas e minúsculas</li>
                    <li>Inclua números e símbolos</li>
                    <li>Evite informações pessoais óbvias</li>
                  </ul>
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Alterar Senha
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sessões Ativas</CardTitle>
              <CardDescription>
                Gerencie onde você está conectado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <p className="font-medium">Sessão Atual</p>
                  <p className="text-sm text-muted-foreground">
                    Este dispositivo • Ativo agora
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Atual
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Você está conectado apenas neste dispositivo.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Autenticação de Dois Fatores</CardTitle>
              <CardDescription>
                Adicione uma camada extra de segurança à sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Autenticação em Dois Fatores (2FA)</p>
                  <p className="text-sm text-muted-foreground">
                    Proteja sua conta com verificação em duas etapas
                  </p>
                </div>
                <Button variant="outline" disabled>
                  Em Breve
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zona de Perigo</CardTitle>
              <CardDescription>
                Ações irreversíveis relacionadas à sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <h4 className="font-medium text-destructive">Excluir Conta</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Excluir permanentemente sua conta e todos os dados associados.
                  Esta ação não pode ser desfeita.
                </p>
                <Button variant="destructive" className="mt-4" disabled>
                  Excluir Conta
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Escolha como e quando você quer receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="email-notifications">Notificações por E-mail</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações gerais por e-mail
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notifications.emailNotifications}
                  onCheckedChange={() => handleNotificationChange("emailNotifications")}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="process-alerts">Alertas de Processos</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificações sobre movimentações nos processos monitorados
                  </p>
                </div>
                <Switch
                  id="process-alerts"
                  checked={notifications.processAlerts}
                  onCheckedChange={() => handleNotificationChange("processAlerts")}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="credit-alerts">Alertas de Créditos</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificações sobre saldo de créditos e vencimentos
                  </p>
                </div>
                <Switch
                  id="credit-alerts"
                  checked={notifications.creditAlerts}
                  onCheckedChange={() => handleNotificationChange("creditAlerts")}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="system-updates">Atualizações do Sistema</Label>
                  <p className="text-sm text-muted-foreground">
                    Novidades, recursos e melhorias da plataforma
                  </p>
                </div>
                <Switch
                  id="system-updates"
                  checked={notifications.systemUpdates}
                  onCheckedChange={() => handleNotificationChange("systemUpdates")}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="marketing-emails">E-mails de Marketing</Label>
                  <p className="text-sm text-muted-foreground">
                    Ofertas especiais, promoções e conteúdo educativo
                  </p>
                </div>
                <Switch
                  id="marketing-emails"
                  checked={notifications.marketingEmails}
                  onCheckedChange={() => handleNotificationChange("marketingEmails")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horário de Notificações</CardTitle>
              <CardDescription>
                Configure o horário em que deseja receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Em breve você poderá definir horários específicos para receber notificações.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
