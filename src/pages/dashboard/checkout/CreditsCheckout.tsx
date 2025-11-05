"use client";

import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCredits } from "@/shared/hooks/useCredits";
import { formatCurrency } from "@/shared/utils/formatters";
import { useToast } from "@/hooks/use-toast";

const CreditsCheckout: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { creditCost } = useCredits();

  const amount = Math.max(parseInt(params.get("amount") || "0", 10), 0);
  const method = params.get("method") === "card" ? "card" : "pix";
  const total = amount * creditCost;

  const startPayment = () => {
    toast({
      title: "Integração pendente",
      description: "O pagamento será iniciado quando conectarmos o Asaas (PIX) ou Stripe (Cartão).",
    });
    // Placeholder: após integrar, redirecionar para URL/checkout do provedor e depois para /dashboard/checkout/success
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Checkout de Créditos</CardTitle>
          <CardDescription>Confirme seus dados e inicie o pagamento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Quantidade</span>
              <Badge variant="secondary">{amount} créditos</Badge>
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Preço por crédito</span>
              <span className="font-medium">{formatCurrency(creditCost)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-medium">Total</span>
              <span className="text-xl font-bold">{formatCurrency(total)}</span>
            </div>
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

export default CreditsCheckout;