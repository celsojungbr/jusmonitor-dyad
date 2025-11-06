import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { AdminApiService } from "@/features/admin"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Save,
  Coins,
  User,
  CreditCard,
  History,
  Trash2
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/integrations/supabase/client"
import { Profile } from "@/shared/types" // Importar o tipo Profile

interface UserDetails extends Profile {} // Usar o tipo Profile diretamente

interface CreditsPlan {
  user_id: string
  plan_type: string
  credits_balance: number
  credit_cost: number
  created_at: string
}

interface CreditTransaction {
  id: string
  user_id: string
  transaction_type: string
  operation_type: string
  credits_amount: number
  cost_in_reais: number
  description: string | null
  created_at: string
}

const AdminUserDetails = () => {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<UserDetails | null>(null)
  const [creditsPlan, setCreditsPlan] = useState<CreditsPlan | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])

  // Estados para edição
  const [editedUser, setEditedUser] = useState<Partial<UserDetails>>({})

  // Estados para adicionar créditos
  const [creditsToAdd, setCreditsToAdd] = useState("")
  const [creditDescription, setCreditDescription] = useState("")
  const [addingCredits, setAddingCredits] = useState(false)

  useEffect(() => {
    if (userId) {
      loadUserData()
    }
  }, [userId])

  const loadUserData = async () => {
    try {
      setLoading(true)

      // Carregar dados do usuário
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!) // Adicionado asserção de não-nulo
        .single()

      if (userError) throw userError
      setUser(userData as UserDetails) // Cast para o tipo correto
      setEditedUser(userData as Partial<UserDetails>) // Cast para o tipo correto

      // Carregar plano de créditos
      const { data: planData, error: planError } = await supabase
        .from('credits_plans')
        .select('*')
        .eq('user_id', userId!) // Adicionado asserção de não-nulo
        .maybeSingle()

      if (planError && planError.code !== 'PGRST116') throw planError
      setCreditsPlan(planData as CreditsPlan) // Cast para o tipo correto

      // Carregar transações
      const { data: transData, error: transError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId!) // Adicionado asserção de não-nulo
        .order('created_at', { ascending: false })
        .limit(50)

      if (transError) throw transError
      setTransactions(transData as CreditTransaction[] || []) // Cast para o tipo correto

    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveUser = async () => {
    try {
      setSaving(true)

      const { error } = await supabase
        .from('profiles')
        .update(editedUser as Partial<Profile>) // Cast para o tipo correto
        .eq('id', userId!) // Adicionado asserção de não-nulo

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Dados do usuário atualizados com sucesso"
      })

      await loadUserData()
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddCredits = async () => {
    if (!creditsToAdd || parseFloat(creditsToAdd) <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido de créditos",
        variant: "destructive"
      })
      return
    }

    if (!creditDescription.trim()) {
      toast({
        title: "Descrição obrigatória",
        description: "Por favor, adicione uma descrição para esta transação",
        variant: "destructive"
      })
      return
    }

    try {
      setAddingCredits(true)

      const currentBalance = creditsPlan?.credits_balance || 0
      const newBalance = currentBalance + parseFloat(creditsToAdd)

      await AdminApiService.updateUserCredits(
        userId!,
        newBalance,
        creditDescription
      )

      toast({
        title: "Créditos adicionados",
        description: `${creditsToAdd} créditos adicionados com sucesso`
      })

      setCreditsToAdd("")
      setCreditDescription("")
      await loadUserData()
    } catch (error) {
      toast({
        title: "Erro ao adicionar créditos",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
    } finally {
      setAddingCredits(false)
    }
  }

  const handleDeleteUser = async () => {
    try {
      // Remover permanentemente o usuário
      const { error } = await supabase.auth.admin.deleteUser(userId!)
      
      if (error) throw error

      toast({
        title: "Usuário removido",
        description: "O usuário foi removido com sucesso"
      })

      navigate('/dashboard/admin/users')
    } catch (error) {
      toast({
        title: "Erro ao remover usuário",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Usuário não encontrado</h2>
          <Button className="mt-4" onClick={() => navigate('/dashboard/admin/users')}>
            Voltar para lista
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/admin/users')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Detalhes do Usuário</h1>
            <p className="text-muted-foreground mt-1">
              {user.full_name || user.id}
            </p>
          </div>
        </div>
        <Badge variant={user.user_type === 'admin' ? 'default' : 'secondary'}>
          {user.user_type}
        </Badge>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="credits">
            <Coins className="h-4 w-4 mr-2" />
            Créditos
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <History className="h-4 w-4 mr-2" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>
                Edite as informações do usuário
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    value={editedUser.full_name || ""}
                    onChange={(e) => setEditedUser({ ...editedUser, full_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                  <Input
                    id="cpf_cnpj"
                    value={editedUser.cpf_cnpj || ""}
                    onChange={(e) => setEditedUser({ ...editedUser, cpf_cnpj: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={editedUser.phone || ""}
                    onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="oab_number">Número OAB</Label>
                  <Input
                    id="oab_number"
                    value={editedUser.oab_number || ""}
                    onChange={(e) => setEditedUser({ ...editedUser, oab_number: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_type">Tipo de Usuário</Label>
                  <Select
                    value={editedUser.user_type}
                    onValueChange={(value: 'user' | 'lawyer' | 'admin') => setEditedUser({ ...editedUser, user_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="lawyer">Advogado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Desativar Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmar Desativação</DialogTitle>
                      <DialogDescription>
                        Tem certeza que deseja desativar este usuário? Esta ação pode ser revertida.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {}}>
                        Cancelar
                      </Button>
                      <Button variant="destructive" onClick={handleDeleteUser}>
                        Desativar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button onClick={handleSaveUser} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credits" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Saldo Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {creditsPlan?.credits_balance?.toFixed(2) || "0.00"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">créditos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tipo de Plano
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">
                  {creditsPlan?.plan_type || "Sem plano"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Custo por Crédito
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {creditsPlan?.credit_cost?.toFixed(2) || "1.50"}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Adicionar Créditos</CardTitle>
              <CardDescription>
                Adicione créditos manualmente à conta do usuário
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="credits_amount">Quantidade de Créditos</Label>
                  <Input
                    id="credits_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 100.00"
                    value={creditsToAdd}
                    onChange={(e) => setCreditsToAdd(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição / Motivo</Label>
                <Textarea
                  id="description"
                  placeholder="Ex: Ajuste manual - promoção de boas-vindas"
                  value={creditDescription}
                  onChange={(e) => setCreditDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleAddCredits}
                disabled={addingCredits}
                className="w-full"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {addingCredits ? "Adicionando..." : "Adicionar Créditos"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>
                Últimas {transactions.length} transações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma transação encontrada
                  </p>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              transaction.transaction_type === 'purchase'
                                ? 'default'
                                : 'secondary'
                            }>
                              {transaction.transaction_type}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {transaction.operation_type}
                            </span>
                          </div>
                          {transaction.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {transaction.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(transaction.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            transaction.credits_amount > 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {transaction.credits_amount > 0 ? '+' : ''}
                            {transaction.credits_amount.toFixed(2)}
                          </div>
                          {transaction.cost_in_reais > 0 && (
                            <div className="text-sm text-muted-foreground">
                              R$ {transaction.cost_in_reais.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminUserDetails