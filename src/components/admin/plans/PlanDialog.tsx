import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateSubscriptionPlan, useUpdateSubscriptionPlan } from '@/hooks/usePricing';
import { SubscriptionPlan, CreateSubscriptionPlanDto } from '@/types/pricing.types';
import { Plus, X } from 'lucide-react';

interface PlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: SubscriptionPlan | null;
}

export function PlanDialog({ open, onOpenChange, plan }: PlanDialogProps) {
  const createPlan = useCreateSubscriptionPlan();
  const updatePlan = useUpdateSubscriptionPlan();
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateSubscriptionPlanDto>({
    defaultValues: {
      is_active: true,
      can_recharge: true,
      included_credits: 0,
      display_order: 0,
    },
  });

  const planType = watch('plan_type');

  useEffect(() => {
    if (plan) {
      reset({
        plan_name: plan.plan_name,
        plan_type: plan.plan_type,
        credit_price: plan.credit_price,
        monthly_price: plan.monthly_price || undefined,
        included_credits: plan.included_credits,
        can_recharge: plan.can_recharge,
        description: plan.description || '',
        is_active: plan.is_active,
        display_order: plan.display_order,
      });
      setFeatures(plan.features || []);
    } else {
      reset({
        is_active: true,
        can_recharge: true,
        included_credits: 0,
        display_order: 0,
      });
      setFeatures([]);
    }
  }, [plan, reset]);

  const onSubmit = async (data: CreateSubscriptionPlanDto) => {
    const dto = {
      ...data,
      features: features.length > 0 ? features : undefined,
    };

    if (plan) {
      await updatePlan.mutateAsync({ id: plan.id, dto });
    } else {
      await createPlan.mutateAsync(dto);
    }

    onOpenChange(false);
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
          <DialogDescription>
            {plan
              ? 'Atualize as informações do plano'
              : 'Preencha os dados para criar um novo plano'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plan_name">Nome do Plano*</Label>
              <Input
                id="plan_name"
                {...register('plan_name', { required: 'Nome é obrigatório' })}
                placeholder="Ex: Plus"
              />
              {errors.plan_name && (
                <p className="text-sm text-red-500">{errors.plan_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan_type">Tipo*</Label>
              <Select
                value={watch('plan_type')}
                onValueChange={(value) => setValue('plan_type', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prepaid">Pré-Pago</SelectItem>
                  <SelectItem value="plus">Plus</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
              {errors.plan_type && (
                <p className="text-sm text-red-500">{errors.plan_type.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credit_price">Preço por Crédito (R$)*</Label>
              <Input
                id="credit_price"
                type="number"
                step="0.01"
                {...register('credit_price', {
                  required: 'Preço por crédito é obrigatório',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Valor deve ser maior que 0' },
                })}
                placeholder="1.50"
              />
              {errors.credit_price && (
                <p className="text-sm text-red-500">{errors.credit_price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly_price">Mensalidade (R$)</Label>
              <Input
                id="monthly_price"
                type="number"
                step="0.01"
                {...register('monthly_price', {
                  valueAsNumber: true,
                })}
                placeholder="49.00"
              />
              <p className="text-xs text-muted-foreground">
                Deixe vazio para plano pré-pago
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="included_credits">Créditos Incluídos</Label>
              <Input
                id="included_credits"
                type="number"
                {...register('included_credits', { valueAsNumber: true })}
                placeholder="49"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Ordem de Exibição</Label>
              <Input
                id="display_order"
                type="number"
                {...register('display_order', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descrição do plano"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Features do Plano</Label>
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Digite uma feature"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
              />
              <Button type="button" onClick={handleAddFeature} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 mt-2">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span className="text-sm">{feature}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFeature(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="can_recharge"
                checked={watch('can_recharge')}
                onCheckedChange={(checked) => setValue('can_recharge', checked)}
              />
              <Label htmlFor="can_recharge">Pode recarregar créditos</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={watch('is_active')}
                onCheckedChange={(checked) => setValue('is_active', checked)}
              />
              <Label htmlFor="is_active">Plano ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createPlan.isPending || updatePlan.isPending}>
              {plan ? 'Atualizar' : 'Criar'} Plano
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
