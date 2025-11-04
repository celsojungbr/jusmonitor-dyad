import { useEffect } from 'react';
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
import { useCreatePricingConfig, useUpdatePricingConfig } from '@/hooks/usePricing';
import { PricingConfig, CreatePricingConfigDto } from '@/types/pricing.types';

interface PricingConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config?: PricingConfig | null;
}

export function PricingConfigDialog({
  open,
  onOpenChange,
  config,
}: PricingConfigDialogProps) {
  const createConfig = useCreatePricingConfig();
  const updateConfig = useUpdatePricingConfig();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreatePricingConfigDto>({
    defaultValues: {
      is_active: true,
    },
  });

  useEffect(() => {
    if (config) {
      reset({
        operation_name: config.operation_name,
        credits_cost: config.credits_cost,
        description: config.description || '',
        is_active: config.is_active,
      });
    } else {
      reset({
        is_active: true,
      });
    }
  }, [config, reset]);

  const onSubmit = async (data: CreatePricingConfigDto) => {
    if (config) {
      await updateConfig.mutateAsync({ id: config.id, dto: data });
    } else {
      await createConfig.mutateAsync(data);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {config ? 'Editar Configuração' : 'Nova Configuração'}
          </DialogTitle>
          <DialogDescription>
            {config
              ? 'Atualize as informações da configuração de preço'
              : 'Preencha os dados para criar uma nova configuração'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="operation_name">Nome da Operação*</Label>
            <Input
              id="operation_name"
              {...register('operation_name', {
                required: 'Nome da operação é obrigatório',
              })}
              placeholder="Ex: consulta, atualizacao_processo"
              disabled={!!config}
            />
            {errors.operation_name && (
              <p className="text-sm text-red-500">{errors.operation_name.message}</p>
            )}
            {!config && (
              <p className="text-xs text-muted-foreground">
                Use snake_case (ex: monitoramento_ativo)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="credits_cost">Custo em Créditos*</Label>
            <Input
              id="credits_cost"
              type="number"
              {...register('credits_cost', {
                required: 'Custo em créditos é obrigatório',
                valueAsNumber: true,
                min: { value: 1, message: 'Custo deve ser no mínimo 1 crédito' },
              })}
              placeholder="9"
            />
            {errors.credits_cost && (
              <p className="text-sm text-red-500">{errors.credits_cost.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descrição da operação"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={watch('is_active')}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
            <Label htmlFor="is_active">Configuração ativa</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createConfig.isPending || updateConfig.isPending}
            >
              {config ? 'Atualizar' : 'Criar'} Configuração
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
