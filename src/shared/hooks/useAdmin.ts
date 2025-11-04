import { useAuth } from './useAuth'

export const useAdmin = () => {
  const { profile, loading } = useAuth()
  
  return {
    isAdmin: profile?.user_type === 'admin',
    loading
  }
}
