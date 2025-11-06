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
import { Checkbox } from '@/components/ui/checkbox';
import { useCreatePromotion, useUpdatePromotion } from '@/hooks/usePricing';
import { Promotion, CreatePromotionDto } from '@/types/pricing.types';
import { format } from 'date-fns';

interface PromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion?: Promotion | null;
}

const PLAN_TYPES = [
  { value: 'prepaid', label: 'Pré-Pago' },
  { value: 'plus', label: 'Plus' },
  { value: 'pro', label: 'Pro' },
];

export function PromotionDialog({ open, onOpenChange, promotion }: PromotionDialogProps) {
  const createPromotion = useCreatePromotion();
  const updatePromotion = useUpdatePromotion();
  const [applicableTo, setApplicableTo] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreatePromotionDto>({
    defaultValues: {
      is_active: true,
    },
  });

  const promotionType = watch('promotion_type');

  useEffect(() => {
    if (promotion) {
      reset({
        promotion_name: promotion.promotion_name,
        promotion_type: promotion.promotion_type,
        description: promotion.description || '',
        discount_percentage: promotion.discount_percentage || undefined,
        discount_fixed: promotion.discount_fixed || undefined,
        bonus_credits: promotion.bonus_credits || undefined,
        start_date: format(new Date(promotion.start_date), "yyyy-MM-dd'T'HH:mm"),
        end_date: format(new Date(promotion.end_date), "yyyy-MM-dd'T'HH:mm"),
        is_active: promotion.is_active,
        max_uses: promotion.max_uses || undefined,
        coupon_code: promotion.coupon_code || '',
      });
      setApplicableTo(promotion.applicable_to || []);
    } else {
      const now = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      reset({
        is_active: true,
        start_date: format(now, "yyyy-MM-dd'T'HH:mm"),
        end_date: format(endDate, "yyyy-MM-dd'T'HH:mm"),
      });
      setApplicableTo([]);
    }
  }, [promotion, reset]);

  const onSubmit = async (data: CreatePromotionDto) => {
    const dto = {
      ...data,
      applicable_to: applicableTo.length > 0 ? applicableTo : undefined,
      discount_percentage:
        promotionType === 'discount_percentage' ? data.discount_percentage : undefined,
      discount_fixed:
        promotionType === 'discount_fixed' ? data.discount_fixed : undefined,
      bonus_credits:
        promotionType === 'bonus_credits' ? data.bonus_credits : undefined,
    };

    if (promotion) {
      await updatePromotion.mutateAsync({ id: promotion.id, dto });
    } else {
      await createPromotion.mutateAsync(dto);
    }

    onOpenChange(false);
  };

  const handlePlanTypeToggle = (planType: string) => {
    setApplicableTo((prev) =>
      prev.includes(planType)
        ? prev.filter((p) => p !== planType)
        : [...prev, planType]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {promotion ? 'Editar Promoção' : 'Nova Promoção'}
          </DialogTitle>
          <DialogDescription>
            {promotion
              ? 'Atualize as informações da promoção'
              : 'Preencha os dados para criar uma nova promoção'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="promotion_name">Nome da Promoção*</Label>
            <Input
              id="promotion_name"
              {...register('promotion_name', { required: 'Nome é obrigatório' })}
              placeholder="Ex: Black Friday 2025"
            />
            {errors.promotion_name && (
              <p className="text-sm text-red-500">{errors.promotion_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="promotion_type">Tipo de Promoção*</Label>
            <Select
              value={watch('promotion_type')}
              onValueChange={(value) => setValue('promotion_type', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discount_percentage">Desconto em Porcentagem</SelectItem>
                <SelectItem value="discount_fixed">Desconto Fixo (R$)</SelectItem>
                <SelectItem value="bonus_credits">Créditos Bônus</SelectItem>
                <SelectItem value="free_trial">Trial Grátis</SelectItem>
              </SelectContent>
            </Select>
            {errors.promotion_type && (
              <p className="text-sm text-red-500">{errors.promotion_type.message}</p>
            )}
          </div>

          {promotionType === 'discount_percentage' && (
            <div className="space-y-2">
              <Label htmlFor="discount_percentage">Desconto (%)*</Label>
              <Input
                id="discount_percentage"
                type="number"
                step="0.01"
                {...register('discount_percentage', {
                  valueAsNumber: true,
                  min: { value: 0, message: 'Mínimo 0%' },
                  max: { value: 100, message: 'Máximo 100%' },
                })}
                placeholder="30"
              />
              {errors.discount_percentage && (
                <p className="text-sm text-red-500">{errors.discount_percentage.message}</p>
              )}
            </div>
          )}

          {promotionType === 'discount_fixed' && (
            <div className="space-y-2">
              <Label htmlFor="discount_fixed">Desconto Fixo (R$)*</Label>
              <Input
                id="discount_fixed"
                type="number"
                step="0.01"
                {...register('discount_fixed', {
                  valueAsNumber: true,
                  min: { value: 0, message: 'Valor deve ser maior que 0' },
                })}
                placeholder="50.00"
              />
              {errors.discount_fixed && (
                <p className="text-sm text-red-500">{errors.discount_fixed.message}</p>
              )}
            </div>
          )}

          {promotionType === 'bonus_credits' && (
            <div className="space-y-2">
              <Label htmlFor="bonus_credits">Créditos Bônus*</Label>
              <Input
                id="bonus_credits"
                type="number"
                {...register('bonus_credits', {
                  valueAsNumber: true,
                  min: { value: 1, message: 'Mínimo 1 crédito' },
                })}
                placeholder="100"
              />
              {errors.bonus_credits && (
                <p className="text-sm text-red-500">{errors.bonus_credits.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descrição da promoção"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Aplicável aos Planos</Label>
            <div className="space-y-2">
              {PLAN_TYPES.map((planType) => (
                <div key={planType.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`plan-${planType.value}`}
                    checked={applicableTo.includes(planType.value)}
                    onCheckedChange={() => handlePlanTypeToggle(planType.value)}
                  />
                  <label
                    htmlFor={`plan-${planType.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {planType.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início*</Label>
              <Input
                id="start_date"
                type="datetime-local"
                {...register('start_date', { required: 'Data de início é obrigatória' })}
              />
              {errors.start_date && (
                <p className="text-sm text-red-500">{errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Término*</Label>
              <Input
                id="end_date"
                type="datetime-local"
                {...register('end_date', { required: 'Data de término é obrigatória' })}
              />
              {errors.end_date && (
                <p className="text-sm text-red-500">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_uses">Máximo de Usos</Label>
              <Input
                id="max_uses"
                type="number"
                {...register('max_uses', { valueAsNumber: true })}
                placeholder="100"
              />
              <p className="text-xs text-muted-foreground">
                Deixe vazio para usos ilimitados
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon_code">Código do Cupom</Label>
              <Input
                id="coupon_code"
                {...register('coupon_code')}
                placeholder="Ex: VERANO2025"
              />
              <p className="text-xs text-muted-foreground">
                Opcional. Se vazio, a promoção é aplicada automaticamente.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={watch('is_active')}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
            <Label htmlFor="is_active">Promoção ativa</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createPromotion.isPending || updatePromotion.isPending}
            >
              {promotion ? 'Atualizar' : 'Criar'} Promoção
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}