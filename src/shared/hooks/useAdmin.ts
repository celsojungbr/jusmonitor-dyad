import { useAuth } from './useAuth'
import { useEffect, useState } from 'react'
import { ApiClient } from '@/shared/services/apiClient'

export const useAdmin = () => {
  const { profile, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean>(profile?.user_type === 'admin')

  // Sync local state when profile loads/changes
  useEffect(() => {
    setIsAdmin(profile?.user_type === 'admin')
  }, [profile?.user_type])

  // Fallback: verify from backend once if not admin yet but not loading
  useEffect(() => {
    if (!loading && !isAdmin) {
      ApiClient.isAdmin().then(setIsAdmin).catch(() => {/* ignore */})
    }
  }, [loading, isAdmin])

  return { isAdmin, loading }
}
