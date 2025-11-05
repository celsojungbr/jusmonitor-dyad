import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { AuthService } from '@/shared/services/authService'
import { Profile } from '@/shared/types'
import { supabase } from '@/integrations/supabase/client'

/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application.
 * 
 * @example
 * ```typescript
 * import { useAuth } from '@/contexts/AuthContext'
 * 
 * function MyComponent() {
 *   const { user, profile, isAuthenticated, isAdmin, signOut } = useAuth()
 *   
 *   if (!isAuthenticated) {
 *     return <div>Please login</div>
 *   }
 *   
 *   return (
 *     <div>
 *       <p>Welcome, {profile?.full_name}!</p>
 *       <button onClick={signOut}>Logout</button>
 *     </div>
 *   )
 * }
 * ```
 */
interface AuthContextType {
  /** Supabase user object (contains email, id, etc.) */
  user: User | null
  /** Current session with JWT token */
  session: Session | null
  /** User profile from database (contains full_name, user_type, etc.) */
  profile: Profile | null
  /** Loading state while checking authentication */
  loading: boolean
  /** True if user is logged in */
  isAuthenticated: boolean
  /** True if user has admin role */
  isAdmin: boolean
  /** True if user has lawyer role */
  isLawyer: boolean
  /** True if user has regular user role */
  isUser: boolean
  /** Function to sign out the user */
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Se o perfil não existe (erro PGRST116), tentar criar
        if (error.code === 'PGRST116') {
          console.log('Perfil não encontrado, criando...')
          
          // Obter dados do usuário
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user) {
            const fullName = user.user_metadata?.full_name ||
                           user.user_metadata?.name ||
                           user.email?.split('@')[0] ||
                           'Usuário'

            // Criar perfil
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                full_name: fullName,
                user_type: 'user',
                cpf_cnpj: '',
              })
              .select()
              .single()

            if (insertError) throw insertError

            // Criar plano de créditos
            await supabase
              .from('credits_plans')
              .insert({
                user_id: userId,
                plan_type: 'prepaid',
                credits_balance: 0,
                credit_cost: 0.50,
              })

            setProfile(newProfile)
            return
          }
        }
        throw error
      }
      
      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    await AuthService.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user,
    isAdmin: profile?.user_type === 'admin',
    isLawyer: profile?.user_type === 'lawyer',
    isUser: profile?.user_type === 'user',
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}