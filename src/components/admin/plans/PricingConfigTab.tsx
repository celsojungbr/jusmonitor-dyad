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
  usePricingConfigs,
  useUpdatePricingConfig,
  useDeletePricingConfig,
} from '@/hooks/usePricing';
import { PricingConfigDialog } from './PricingConfigDialog';
import { PricingConfig } from '@/types/pricing.types';
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

export function PricingConfigTab() {
  const { data: configs, isLoading } = usePricingConfigs();
  const updateConfig = useUpdatePricingConfig();
  const deleteConfig = useDeletePricingConfig();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<PricingConfig | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);

  const handleToggleActive = async (config: PricingConfig) => {
    await updateConfig.mutateAsync({
      id: config.id,
      dto: { is_active: !config.is_active },
    });
  };

  const handleEdit = (config: PricingConfig) => {
    setEditingConfig(config);
    setDialogOpen(true);
  };

  const handleDelete = (configId: string) => {
    setConfigToDelete(configId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (configToDelete) {
      await deleteConfig.mutateAsync(configToDelete);
      setDeleteDialogOpen(false);
      setConfigToDelete(null);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingConfig(null);
  };

  const getOperationLabel = (name: string) => {
    const labels: Record<string, string> = {
      consulta: 'Consulta Processual',
      atualizacao_processo: 'Atualização Processual',
      monitoramento_ativo: 'Monitoramento',
    };
    return labels[name] || name;
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Total de operações: {configs?.length || 0}
        </p>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Operação
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Operação</TableHead>
              <TableHead>Custo (Créditos)</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs?.map((config) => (
              <TableRow key={config.id}>
                <TableCell className="font-medium">
                  {getOperationLabel(config.operation_name)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {config.credits_cost} créditos
                  </Badge>
                </TableCell>
                <TableCell className="max-w-md truncate">
                  {config.description || '-'}
                </TableCell>
                <TableCell>
                  {config.is_active ? (
                    <Badge className="bg-green-500">Ativo</Badge>
                  ) : (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={config.is_active}
                    onCheckedChange={() => handleToggleActive(config)}
                  />
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(config)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(config.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!configs || configs.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhuma configuração cadastrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PricingConfigDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        config={editingConfig}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta configuração de preço? Esta ação não pode ser desfeita.
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
