import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlansTab } from '@/components/admin/plans/PlansTab';
import { PromotionsTab } from '@/components/admin/plans/PromotionsTab';
import { PricingConfigTab } from '@/components/admin/plans/PricingConfigTab';

export default function AdminPlans() {
  const [activeTab, setActiveTab] = useState('plans');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gerenciar Planos e Preços</h1>
        <p className="text-muted-foreground">
          Configure os planos de assinatura, promoções e preços das operações
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="promotions">Promoções</TabsTrigger>
          <TabsTrigger value="pricing">Preços de Operações</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Planos de Assinatura</CardTitle>
              <CardDescription>
                Gerencie os planos disponíveis para os usuários. Você pode ativar/desativar planos sem excluí-los.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlansTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promotions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Promoções</CardTitle>
              <CardDescription>
                Crie e gerencie promoções com desconto ou créditos bônus para os planos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PromotionsTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preços de Operações</CardTitle>
              <CardDescription>
                Configure o custo em créditos para cada operação do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PricingConfigTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
