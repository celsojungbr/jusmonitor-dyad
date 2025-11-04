import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  usePromotions,
  useUpdatePromotion,
  useDeletePromotion,
} from '@/hooks/usePricing';
import { PromotionDialog } from './PromotionDialog';
import { Promotion } from '@/types/pricing.types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function PromotionsTab() {
  const { data: promotions, isLoading } = usePromotions(true);
  const updatePromotion = useUpdatePromotion();
  const deletePromotion = useDeletePromotion();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState<string | null>(null);

  const handleToggleActive = async (promotion: Promotion) => {
    await updatePromotion.mutateAsync({
      id: promotion.id,
      dto: { is_active: !promotion.is_active },
    });
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setDialogOpen(true);
  };

  const handleDelete = (promotionId: string) => {
    setPromotionToDelete(promotionId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (promotionToDelete) {
      await deletePromotion.mutateAsync(promotionToDelete);
      setDeleteDialogOpen(false);
      setPromotionToDelete(null);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingPromotion(null);
  };

  const getPromotionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      discount_percentage: 'Desconto %',
      discount_fixed: 'Desconto Fixo',
      bonus_credits: 'Créditos Bônus',
      free_trial: 'Trial Grátis',
    };
    return labels[type] || type;
  };

  const getPromotionValue = (promotion: Promotion) => {
    if (promotion.discount_percentage) {
      return `${promotion.discount_percentage}%`;
    }
    if (promotion.discount_fixed) {
      return `R$ ${promotion.discount_fixed.toFixed(2)}`;
    }
    if (promotion.bonus_credits) {
      return `${promotion.bonus_credits} créditos`;
    }
    return '-';
  };

  const isPromotionActive = (promotion: Promotion) => {
    const now = new Date();
    const start = new Date(promotion.start_date);
    const end = new Date(promotion.end_date);
    return promotion.is_active && now >= start && now <= end;
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Total de promoções: {promotions?.length || 0}
        </p>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Promoção
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Aplicável a</TableHead>
              <TableHead>Usos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotions?.map((promotion) => (
              <TableRow key={promotion.id}>
                <TableCell className="font-medium">
                  {promotion.promotion_name}
                  {promotion.coupon_code && (
                    <div className="text-xs text-muted-foreground">
                      Cupom: {promotion.coupon_code}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getPromotionTypeLabel(promotion.promotion_type)}
                  </Badge>
                </TableCell>
                <TableCell>{getPromotionValue(promotion)}</TableCell>
                <TableCell className="text-sm">
                  <div>{format(new Date(promotion.start_date), 'dd/MM/yyyy', { locale: ptBR })}</div>
                  <div className="text-muted-foreground">
                    até {format(new Date(promotion.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {promotion.applicable_to?.map((planType) => (
                      <Badge key={planType} variant="secondary" className="text-xs">
                        {planType}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {promotion.current_uses}/{promotion.max_uses || '∞'}
                </TableCell>
                <TableCell>
                  {isPromotionActive(promotion) ? (
                    <Badge className="bg-green-500">Ativa</Badge>
                  ) : promotion.is_active ? (
                    <Badge variant="outline">Agendada</Badge>
                  ) : (
                    <Badge variant="secondary">Inativa</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={promotion.is_active}
                    onCheckedChange={() => handleToggleActive(promotion)}
                  />
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(promotion)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(promotion.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!promotions || promotions.length === 0) && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Nenhuma promoção cadastrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PromotionDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        promotion={editingPromotion}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta promoção? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
