import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap } from "lucide-react";

const Planos = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Planos e Créditos</h1>
        <p className="text-muted-foreground">
          Gerencie seus créditos e escolha o melhor plano para você
        </p>
      </div>

      <Card className="border-primary">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Saldo Atual</div>
              <div className="text-4xl font-bold text-primary">250 créditos</div>
              <div className="text-sm text-muted-foreground mt-1">
                Equivalente a R$ 375,00 (Plano Pré-Pago)
              </div>
            </div>
            <Button size="lg">
              <Zap className="w-5 h-5 mr-2" />
              Adicionar Créditos
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">Escolha seu Plano</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pré-Pago</CardTitle>
              <CardDescription>Pague apenas pelo que usar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-3xl font-bold">R$ 1,50</div>
                <div className="text-sm text-muted-foreground">por crédito</div>
              </div>
              
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Sem compromisso mensal
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Válido por 12 meses
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Suporte por email
                </li>
              </ul>
              
              <Button variant="outline" className="w-full">
                Adicionar Créditos
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Plus</CardTitle>
                  <CardDescription>Para uso moderado</CardDescription>
                </div>
                <Badge>Economia 33%</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-3xl font-bold">R$ 1,00</div>
                <div className="text-sm text-muted-foreground">por crédito</div>
                <div className="text-lg font-semibold">R$ 49/mês</div>
              </div>
              
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Renovação automática
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Cancele quando quiser
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Suporte prioritário
                </li>
              </ul>
              
              <Button className="w-full">
                Contratar Plus
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Pro</CardTitle>
                  <CardDescription>Para uso intensivo</CardDescription>
                </div>
                <Badge>Economia 53%</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-3xl font-bold">R$ 0,70</div>
                <div className="text-sm text-muted-foreground">por crédito</div>
                <div className="text-lg font-semibold">R$ 990/mês</div>
              </div>
              
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Renovação automática
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Cancele quando quiser
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Suporte VIP 24/7
                </li>
              </ul>
              
              <Button className="w-full">
                Contratar Pro
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custo por Operação</CardTitle>
          <CardDescription>Quantidade de créditos necessários para cada tipo de consulta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { operation: "Consulta por CPF/CNPJ", credits: 5 },
              { operation: "Consulta por CNJ", credits: 3 },
              { operation: "Consulta por OAB", credits: 4 },
              { operation: "Monitoramento/mês (por processo)", credits: 10 },
              { operation: "Download de Anexo", credits: 2 },
              { operation: "Análise IA por Processo", credits: 15 },
              { operation: "Acesso Autos Completos", credits: 25 },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="text-sm">{item.operation}</span>
                <Badge variant="secondary">{item.credits} créditos</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Planos;
