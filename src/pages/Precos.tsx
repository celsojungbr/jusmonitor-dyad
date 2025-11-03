import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const Precos = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 border-primary/20 bg-primary/5">Planos e Preços</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Escolha o plano ideal para você
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Planos flexíveis para advogados, escritórios e empresas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Starter</CardTitle>
                <CardDescription>Para advogados iniciantes</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">R$ 99</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Até 50 processos monitorados</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Alertas em tempo real</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Download de documentos</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>1 usuário</span>
                  </li>
                </ul>
                <Button asChild className="w-full mt-6">
                  <Link to="/auth">Começar Agora</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary">Mais Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Professional</CardTitle>
                <CardDescription>Para escritórios pequenos</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">R$ 249</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Até 200 processos monitorados</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Alertas em tempo real</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Download ilimitado</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Até 5 usuários</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Suporte prioritário</span>
                  </li>
                </ul>
                <Button asChild className="w-full mt-6">
                  <Link to="/auth">Começar Agora</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <CardDescription>Para grandes escritórios</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Personalizado</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Processos ilimitados</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Alertas customizados</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>API de integração</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Usuários ilimitados</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Suporte dedicado</span>
                  </li>
                </ul>
                <Button asChild variant="outline" className="w-full mt-6">
                  <Link to="/auth">Falar com Vendas</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Precos;
