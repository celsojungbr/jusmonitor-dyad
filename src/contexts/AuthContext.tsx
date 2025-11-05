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

            // Garantir plano de créditos com possível bônus de promoção ativa
            const { data: existingPlan } = await supabase
              .from('credits_plans')
              .select('*')
              .eq('user_id', userId)
              .maybeSingle();

            let initialCredits = 0;
            const nowIso = new Date().toISOString();

            const { data: activeBonus } = await supabase
              .from('promotions')
              .select('bonus_credits,start_date,end_date,is_active')
              .eq('promotion_type', 'bonus_credits')
              .eq('is_active', true)
              .lte('start_date', nowIso)
              .gte('end_date', nowIso)
              .limit(1)
              .maybeSingle();

            if (activeBonus?.bonus_credits && activeBonus.bonus_credits > 0) {
              initialCredits = activeBonus.bonus_credits;
            }

            if (!existingPlan) {
              await supabase
                .from('credits_plans')
                .insert({
                  user_id: userId,
                  plan_type: 'prepaid',
                  credits_balance: initialCredits,
                  credit_cost: 0.50,
                });
            } else if (existingPlan.credits_balance === 0) {
              // Apenas aplicar bônus se for realmente novo (sem transações)
              const { count } = await supabase
                .from('credit_transactions')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', userId);
              if ((count ?? 0) === 0 && initialCredits > 0) {
                await supabase
                  .from('credits_plans')
                  .update({ credits_balance: initialCredits })
                  .eq('user_id', userId);
              }
            }

            setProfile(newProfile)
            return
          }
        }
        throw error
      }
      
      setProfile(data)
      // Garantir créditos iniciais se houver promoção ativa para novos usuários
      const { data: planCheck } = await supabase
        .from('credits_plans')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const nowIso2 = new Date().toISOString();
      const { data: activeBonus2 } = await supabase
        .from('promotions')
        .select('bonus_credits,start_date,end_date,is_active')
        .eq('promotion_type', 'bonus_credits')
        .eq('is_active', true)
        .lte('start_date', nowIso2)
        .gte('end_date', nowIso2)
        .limit(1)
        .maybeSingle();

      const bonusAmount2 = activeBonus2?.bonus_credits && activeBonus2.bonus_credits > 0 ? activeBonus2.bonus_credits : 0;

      if (planCheck && planCheck.credits_balance === 0 && bonusAmount2 > 0) {
        const { count: txCount } = await supabase
          .from('credit_transactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);

        if ((txCount ?? 0) === 0) {
          await supabase
            .from('credits_plans')
            .update({ credits_balance: bonusAmount2 })
            .eq('user_id', userId);
        }
      }
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