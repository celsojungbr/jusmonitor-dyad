import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Loader2 } from "lucide-react";
import { useSubscriptionPlans, usePricingConfigs, useActivePromotions } from "@/hooks/usePricing";
import { useCredits } from "@/shared/hooks/useCredits";
import { useState } from "react"; // Removido React
import { AddCreditsDialog } from "@/features/payments/components/AddCreditsDialog";
import { SubscribePlanDialog } from "@/features/payments/components/SubscribePlanDialog";
import { useRealtimePricingSync } from "@/shared/hooks/useRealtimePricingSync";

const Planos = () => {
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: pricingConfigs, isLoading: pricingLoading } = usePricingConfigs();
  const { data: promotions } = useActivePromotions();
  const { balance, creditCost, loading: creditsLoading, planType } = useCredits();
  const formatBRL = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const [creditsOpen, setCreditsOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof sortedPlans[0] | null>(null);

  // Ordena os planos pela display_order
  const sortedPlans = plans?.sort((a, b) => a.display_order - b.display_order) || [];
  useRealtimePricingSync();

  // Calcula a economia baseada no plano Pré-Pago
  const prepaidPlan = sortedPlans.find(p => p.plan_type === 'prepaid');

  const calculateSavings = (plan: typeof sortedPlans[0]) => {
    if (!prepaidPlan || !plan.credit_price || !prepaidPlan.credit_price) return null;
    const savings = ((prepaidPlan.credit_price - plan.credit_price) / prepaidPlan.credit_price) * 100;
    return Math.round(savings);
  };

  if (plansLoading || pricingLoading || creditsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
              <div className="text-4xl font-bold text-primary">{balance} créditos</div>
              <div className="text-sm text-muted-foreground mt-1">
                Equivalente a {formatBRL(balance * creditCost)} {planType === 'prepaid' ? '(Plano Pré-Pago)' : ''}
              </div>
            </div>
            <Button size="lg" onClick={() => setCreditsOpen(true)}>
              <Zap className="w-5 h-5 mr-2" />
              Adicionar Créditos
            </Button>
          </div>
        </CardContent>
      </Card>

      {promotions && promotions.length > 0 && (
        <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
          {promotions.map((promo) => (
            <div key={promo.id}>
              <Badge variant="outline" className="text-green-600 border-green-600 mb-2">
                {promo.promotion_name}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {promo.description}
              </p>
            </div>
          ))}
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-4">Escolha seu Plano</h2>

        <div className={`grid gap-6 ${sortedPlans.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
          {sortedPlans.map((plan, index) => {
            const savings = calculateSavings(plan);
            const isMiddlePlan = index === Math.floor(sortedPlans.length / 2);

            return (
              <Card key={plan.id} className={isMiddlePlan ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <CardTitle>{plan.plan_name}</CardTitle>
                      <CardDescription>{plan.description || 'Plano flexível'}</CardDescription>
                    </div>
                    {typeof savings === 'number' && savings > 0 ? (
                      <Badge className="text-xs px-2 py-0.5 whitespace-nowrap self-start">
                        Economia {savings}%
                      </Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">R$ {plan.credit_price.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">por crédito</div>
                    {plan.monthly_price && (
                      <>
                        <div className="text-lg font-semibold">R$ {plan.monthly_price.toFixed(2)}/mês</div>
                        {plan.included_credits > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Inclui {plan.included_credits} créditos
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <ul className="space-y-2 text-sm">
                    {plan.features && plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={!plan.monthly_price ? 'outline' : 'default'}
                    onClick={() => {
                      if (plan.monthly_price) {
                        setSelectedPlan(plan);
                        setSubscribeOpen(true);
                      } else {
                        setCreditsOpen(true);
                      }
                    }}
                  >
                    {plan.monthly_price ? `Contratar ${plan.plan_name}` : 'Adicionar Créditos'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custo por Operação</CardTitle>
          <CardDescription>Quantidade de créditos necessários para cada tipo de consulta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pricingConfigs && pricingConfigs.length > 0 ? (
              pricingConfigs.map((config) => (
                <div key={config.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="text-sm">{config.description || config.operation_name}</span>
                  <Badge variant="secondary">{config.credits_cost} créditos</Badge>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                Nenhuma configuração de preços disponível
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <AddCreditsDialog open={creditsOpen} onOpenChange={setCreditsOpen} />
      <SubscribePlanDialog open={subscribeOpen} onOpenChange={setSubscribeOpen} plan={selectedPlan || null} />
    </div>
  );
};

export default Planos;