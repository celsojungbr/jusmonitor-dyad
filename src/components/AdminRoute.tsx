import { Navigate } from "react-router-dom"
import { useAdmin } from "@/shared/hooks/useAdmin"

interface AdminRouteProps {
  children: React.ReactNode
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAdmin, loading } = useAdmin()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard/consultas" replace />
  }

  return <>{children}</>
}
