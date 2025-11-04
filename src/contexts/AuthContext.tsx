import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { AuthService } from '@/shared/services/authService'
import { Profile } from '@/shared/types'
import { supabase } from '@/integrations/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isLawyer: boolean
  isUser: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Buscar sessão e perfil em paralelo
    const initializeAuth = async () => {
      try {
        const session = await AuthService.getSession()
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          // Buscar perfil apenas se houver usuário
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          setProfile(data)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listener para mudanças de autenticação
    const { data: { subscription } } = AuthService.onAuthStateChange(
      (event, session) => {
        // CRÍTICO: Apenas operações síncronas aqui
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Usar setTimeout para adiar chamadas ao Supabase
        if (session?.user) {
          setTimeout(async () => {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            setProfile(data)
          }, 0)
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const isAdmin = profile?.user_type === 'admin'
  const isLawyer = profile?.user_type === 'lawyer'
  const isUser = profile?.user_type === 'user'

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isAuthenticated: !!user,
        isAdmin,
        isLawyer,
        isUser,
        signOut: AuthService.signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
