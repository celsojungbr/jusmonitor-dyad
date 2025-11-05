"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCredits } from "@/shared/hooks/useCredits";
import { formatCurrency } from "@/shared/utils/formatters";

const schema = z.object({
  credits: z.coerce.number().int().min(1, "Mínimo de 1 crédito"),
  method: z.enum(["pix", "card"], { required_error: "Selecione um método" })
});

type FormValues = z.infer<typeof schema>;

interface AddCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddCreditsDialog: React.FC<AddCreditsDialogProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const { creditCost } = useCredits();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { credits: 10, method: "pix" }
  });

  const credits = form.watch("credits") || 0;
  const total = credits * creditCost;

  const onSubmit = (values: FormValues) => {
    const params = new URLSearchParams({
      amount: String(values.credits),
      method: values.method
    });
    onOpenChange(false);
    navigate(`/dashboard/checkout/credits?${params.toString()}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Créditos</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="credits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade de créditos</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} step={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Preço por crédito</span>
                <Badge variant="secondary">{formatCurrency(creditCost)}</Badge>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between">
                <span className="font-medium">Total</span>
                <span className="text-xl font-bold">{formatCurrency(total)}</span>
              </div>
            </div>

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
                          <div className="text-xs text-muted-foreground">Pagamento via QR Code</div>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted/40">
                        <RadioGroupItem value="card" />
                        <div>
                          <div className="font-medium">Cartão (Stripe)</div>
                          <div className="text-xs text-muted-foreground">Visa, MasterCard, etc.</div>
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
      </DialogContent>
    </Dialog>
  );
};

export default AddCreditsDialog;