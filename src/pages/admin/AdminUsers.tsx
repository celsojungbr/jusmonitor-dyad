import { useEffect, useState } from "react"
import { AdminTable } from "@/components/admin/AdminTable"
import { AdminApiService } from "@/features/admin"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Plus } from "lucide-react"

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await AdminApiService.getAllUsers()
      setUsers(data || [])
    } catch (error) {
      toast({
        title: "Erro ao carregar usuários",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.cpf_cnpj?.includes(searchTerm)
  )

  const columns = [
    {
      key: "full_name",
      label: "Nome",
      render: (user: any) => user.full_name || "-"
    },
    {
      key: "user_type",
      label: "Tipo",
      render: (user: any) => (
        <Badge variant={user.user_type === 'admin' ? 'default' : 'secondary'}>
          {user.user_type}
        </Badge>
      )
    },
    {
      key: "cpf_cnpj",
      label: "CPF/CNPJ",
      render: (user: any) => user.cpf_cnpj || "-"
    },
    {
      key: "oab_number",
      label: "OAB",
      render: (user: any) => user.oab_number || "-"
    },
    {
      key: "created_at",
      label: "Data de Cadastro",
      render: (user: any) => new Date(user.created_at).toLocaleDateString('pt-BR')
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
          <p className="text-muted-foreground mt-2">
            {users.length} usuários cadastrados
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CPF/CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <AdminTable
        data={filteredUsers}
        columns={columns}
        onRowClick={(user) => console.log('Editar usuário:', user)}
      />
    </div>
  )
}

export default AdminUsers
