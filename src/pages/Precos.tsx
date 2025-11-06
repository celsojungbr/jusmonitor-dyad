import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useSubscriptionPlans, useActivePromotions } from "@/hooks/usePricing";
import { useRealtimePricingSync } from "@/shared/hooks/useRealtimePricingSync";

const Precos = () => {
  const { data: plans, isLoading } = useSubscriptionPlans();
  const { data: promotions } = useActivePromotions();

  // Ordena os planos pela display_order
  const sortedPlans = plans?.sort((a, b) => a.display_order - b.display_order) || [];
  useRealtimePricingSync();

  // Destaca o plano do meio como "Mais Popular"
  const popularPlanIndex = Math.floor(sortedPlans.length / 2);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

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
              Planos flexíveis com sistema de créditos para advogados e escritórios
            </p>
          </div>

          {promotions && promotions.length > 0 && (
            <div className="text-center mb-8">
              {promotions.map((promo) => (
                <Badge key={promo.id} variant="outline" className="text-green-600 border-green-600 mb-2">
                  {promo.promotion_name}
                  {promo.discount_percentage && ` - ${promo.discount_percentage}% OFF`}
                  {promo.bonus_credits && ` - ${promo.bonus_credits} créditos bônus`}
                </Badge>
              ))}
            </div>
          )}

          <div className={`grid gap-8 max-w-6xl mx-auto ${sortedPlans.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
            {sortedPlans.map((plan, index) => {
              const isPopular = index === popularPlanIndex;

              return (
                <Card key={plan.id} className={`border-2 ${isPopular ? 'border-primary relative' : ''}`}>
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">Mais Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.plan_name}</CardTitle>
                    <CardDescription>{plan.description || 'Plano flexível'}</CardDescription>
                    <div className="mt-4">
                      {plan.monthly_price ? (
                        <>
                          <span className="text-4xl font-bold">R$ {plan.monthly_price.toFixed(2)}</span>
                          <span className="text-muted-foreground">/mês</span>
                          <div className="text-sm text-muted-foreground mt-2">
                            + R$ {plan.credit_price.toFixed(2)} por crédito adicional
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-4xl font-bold">R$ {plan.credit_price.toFixed(2)}</span>
                          <span className="text-muted-foreground">/crédito</span>
                          <div className="text-sm text-muted-foreground mt-2">
                            Pay per use - Sem mensalidade
                          </div>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.monthly_price && plan.included_credits > 0 && (
                        <li className="flex gap-2">
                          <Check className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="font-semibold">{plan.included_credits} créditos incluídos</span>
                        </li>
                      )}
                      {plan.features && plan.features.map((feature, idx) => (
                        <li key={idx} className="flex gap-2">
                          <Check className="w-5 h-5 text-primary flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {plan.can_recharge && (
                        <li className="flex gap-2">
                          <Check className="w-5 h-5 text-primary flex-shrink-0" />
                          <span>Pode recarregar créditos</span>
                        </li>
                      )}
                    </ul>
                    <Button asChild className="w-full mt-6">
                      <Link to="/auth">Começar Agora</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {sortedPlans.length === 0 && (
            <div className="text-center text-muted-foreground">
              <p>Nenhum plano disponível no momento.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Precos;
