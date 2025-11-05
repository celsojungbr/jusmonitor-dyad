"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const CheckoutCancel: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Pagamento cancelado</CardTitle>
          <CardDescription>Você pode tentar novamente quando desejar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="flex items-center justify-center">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <p className="text-sm text-muted-foreground">
            Nenhuma cobrança foi realizada. Retorne para gerenciar seus planos e créditos.
          </p>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => navigate("/dashboard/planos")}>Voltar para Planos</Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate("/dashboard/consultas")}>Ir para Consultas</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutCancel;