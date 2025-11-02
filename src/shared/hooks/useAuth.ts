import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { AuthService } from '../services/authService'
import { Profile } from '../types'
import { supabase } from '@/integrations/supabase/client'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obter sessão inicial
    AuthService.getSession().then(session => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        // Buscar perfil do usuário
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            setProfile(data)
            setLoading(false)
          })
      } else {
        setLoading(false)
      }
    })

    // Listener para mudanças
    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          setProfile(data)
        } else {
          setProfile(null)
        }

        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const isAdmin = profile?.user_type === 'admin'
  const isLawyer = profile?.user_type === 'lawyer'
  const isUser = profile?.user_type === 'user'

  return {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user,
    isAdmin,
    isLawyer,
    isUser,
    signOut: AuthService.signOut
  }
}
