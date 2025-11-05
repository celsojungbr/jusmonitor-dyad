"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/shared/utils/formatters";
import type { SubscriptionPlan } from "@/types/pricing.types";

const schema = z.object({
  method: z.enum(["pix", "card"], { required_error: "Selecione um método" })
});

type FormValues = z.infer<typeof schema>;

interface SubscribePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: SubscriptionPlan | null;
}

export const SubscribePlanDialog: React.FC<SubscribePlanDialogProps> = ({ open, onOpenChange, plan }) => {
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { method: "card" }
  });

  const onSubmit = (values: FormValues) => {
    if (!plan) return;
    const params = new URLSearchParams({ method: values.method });
    onOpenChange(false);
    navigate(`/dashboard/checkout/plan/${plan.id}?${params.toString()}`);
  };

  const monthly = plan?.monthly_price ?? 0;
  const included = plan?.included_credits ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Contratar {plan?.plan_name}</DialogTitle>
        </DialogHeader>

        {!plan ? (
          <div className="text-sm text-muted-foreground">Selecione um plano para continuar.</div>
        ) : (
          <>
            <div className="rounded-lg border p-4 bg-muted/30 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Mensalidade</span>
                <Badge variant="secondary">{formatCurrency(monthly)}</Badge>
              </div>
              {included > 0 && (
                <>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Créditos incluídos</span>
                    <span className="font-medium">{included} créditos</span>
                  </div>
                </>
              )}
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de pagamento</FormLabel>
                      <FormControl>
                        <RadioGroup
                          className="grid grid-cols-2 gap-3"
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <label className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted/40">
                            <RadioGroupItem value="pix" />
                            <div>
                              <div className="font-medium">PIX (Asaas)</div>
                              <div className="text-xs text-muted-foreground">QR Code para assinatura</div>
                            </div>
                          </label>
                          <label className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted/40">
                            <RadioGroupItem value="card" />
                            <div>
                              <div className="font-medium">Cartão (Stripe)</div>
                              <div className="text-xs text-muted-foreground">Cobra mensal automaticamente</div>
                            </div>
                          </label>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">Continuar</Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SubscribePlanDialog;