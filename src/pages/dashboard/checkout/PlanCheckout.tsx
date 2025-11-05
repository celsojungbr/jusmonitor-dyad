"use client";

import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSubscriptionPlans } from "@/hooks/usePricing";
import { formatCurrency } from "@/shared/utils/formatters";
import { useToast } from "@/hooks/use-toast";

const PlanCheckout: React.FC = () => {
  const { planId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: plans, isLoading } = useSubscriptionPlans(true);

  const method = params.get("method") === "pix" ? "pix" : "card";
  const plan = (plans || []).find(p => p.id === planId) || null;

  const startPayment = () => {
    toast({
      title: "Integração pendente",
      description: "Vamos conectar ao Asaas (PIX) ou Stripe (Cartão) para concluir a assinatura.",
    });
    // Placeholder: após integrar, redirecionar para URL/checkout do provedor e depois para /dashboard/checkout/success
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-sm text-muted-foreground">Carregando plano...</div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-sm text-muted-foreground">
        Plano não encontrado. <Button variant="link" onClick={() => navigate("/dashboard/planos")}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Checkout de Plano</CardTitle>
          <CardDescription>Revise o plano e prossiga com o pagamento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Plano</span>
              <Badge variant="secondary">{plan.plan_name}</Badge>
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Mensalidade</span>
              <span className="font-medium">{formatCurrency(plan.monthly_price || 0)}</span>
            </div>
            {plan.included_credits > 0 && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Créditos incluídos</span>
                <span className="font-medium">{plan.included_credits} créditos</span>
              </div>
            )}
          </div>

          <div className="rounded-lg border p-4">
            <div className="font-medium mb-2">Método</div>
            <div className="text-sm">
              {method === "pix" ? (
                <div className="space-y-2">
                  <div>PIX (Asaas)</div>
                  <div className="h-40 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    QR Code será mostrado aqui após integração
                  </div>
                </div>
              ) : (
                <div>Cartão (Stripe)</div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button className="flex-1" onClick={startPayment}>Iniciar pagamento</Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate("/dashboard/planos")}>Voltar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanCheckout;