import { useEffect, useState } from "react"
import { AdminTable } from "@/components/admin/AdminTable"
import { AdminApiService } from "@/features/admin"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/shared/utils/formatters"

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      const data = await AdminApiService.getAllTransactions()
      setTransactions(data || [])
    } catch (error) {
      toast({
        title: "Erro ao carregar transações",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      key: "created_at",
      label: "Data",
      render: (tx: any) => new Date(tx.created_at).toLocaleString('pt-BR')
    },
    {
      key: "profile",
      label: "Usuário",
      render: (tx: any) => (tx as any).profile?.full_name || "-"
    },
    {
      key: "transaction_type",
      label: "Tipo",
      render: (tx: any) => (
        <Badge variant={tx.transaction_type === 'purchase' ? 'default' : 'secondary'}>
          {tx.transaction_type === 'purchase' ? 'Compra' : 'Consumo'}
        </Badge>
      )
    },
    {
      key: "credits_amount",
      label: "Créditos",
      render: (tx: any) => (
        <span className={tx.credits_amount > 0 ? 'text-green-600' : 'text-red-600'}>
          {tx.credits_amount > 0 ? '+' : ''}{tx.credits_amount}
        </span>
      )
    },
    {
      key: "cost_in_reais",
      label: "Valor",
      render: (tx: any) => formatCurrency(tx.cost_in_reais)
    },
    {
      key: "description",
      label: "Descrição",
      render: (tx: any) => tx.description || tx.operation_type || "-"
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const totalRevenue = transactions
    .filter(tx => tx.transaction_type === 'purchase')
    .reduce((sum, tx) => sum + tx.cost_in_reais, 0)

  const totalConsumed = transactions
    .filter(tx => tx.transaction_type === 'consumption')
    .reduce((sum, tx) => sum + Math.abs(tx.credits_amount), 0)

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transações de Créditos</h1>
        <p className="text-muted-foreground mt-2">
          {transactions.length} transações registradas
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-6 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground">Receita Total</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="p-6 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground">Créditos Consumidos</p>
          <p className="text-2xl font-bold mt-2">{totalConsumed}</p>
        </div>
        <div className="p-6 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground">Total de Transações</p>
          <p className="text-2xl font-bold mt-2">{transactions.length}</p>
        </div>
      </div>

      <AdminTable
        data={transactions}
        columns={columns}
      />
    </div>
  )
}

export default AdminTransactions
