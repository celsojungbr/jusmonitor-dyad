import { supabase } from '@/integrations/supabase/client'
import { UserType } from '../types'
import { getOAuthCallbackUrl, getEmailRedirectUrl } from '@/shared/utils/authRedirect'

export interface SignUpData {
  email: string
  password: string
  fullName: string
  cpfCnpj: string
  userType: UserType
  oabNumber?: string
  phone?: string
}

export interface SignInData {
  email: string
  password: string
}

export class AuthService {
  static async signUp(data: SignUpData) {
    const { email, password, fullName, cpfCnpj, userType, oabNumber, phone } = data

    console.log('🔵 Iniciando registro de usuário:', { email, fullName, userType })

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          cpf_cnpj: cpfCnpj,
          user_type: userType,
          oab_number: oabNumber,
          phone
        }
      }
    })

    if (authError) {
      console.error('❌ Erro no registro:', authError)
      throw authError
    }

    console.log('✅ Usuário criado com sucesso:', {
      userId: authData.user?.id,
      email: authData.user?.email,
      confirmed: authData.user?.email_confirmed_at ? 'Sim' : 'Não',
      session: authData.session ? 'Criada' : 'Não criada'
    })

    return authData
  }

  static async signIn(data: SignInData) {
    const { email, password } = data

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) throw authError

    return authData
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  static async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) throw error
  }

  static async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
  }

  static async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) throw error

    return session
  }

  static async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) throw error

    return user
  }

  static async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getOAuthCallbackUrl(),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })

    if (error) throw error

    return data
  }

  static async signInWithOtp(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getEmailRedirectUrl('/dashboard/consultas')
      }
    })

    if (error) throw error
  }

  static async signInWithMagicLink(email: string) {
    return this.signInWithOtp(email)
  }

  // Listener para mudanças no estado de autenticação
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}