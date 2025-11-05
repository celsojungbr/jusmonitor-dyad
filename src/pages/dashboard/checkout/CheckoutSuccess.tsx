"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const CheckoutSuccess: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Pagamento concluído</CardTitle>
          <CardDescription>Obrigado! Estamos confirmando sua transação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <p className="text-sm text-muted-foreground">
            Em instantes seu saldo/plano será atualizado. Você pode acompanhar em Planos.
          </p>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => navigate("/dashboard/planos")}>Ir para Planos</Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate("/dashboard/consultas")}>Ir para Consultas</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutSuccess;