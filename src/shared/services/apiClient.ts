import { supabase } from '@/integrations/supabase/client'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export class ApiClient {
  private static async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('No active session')
    }

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    }
  }

  static async callEdgeFunction<TRequest, TResponse>(
    functionName: string,
    payload: TRequest
  ): Promise<TResponse> {
    const headers = await this.getAuthHeaders()

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/${functionName}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      }
    )

    const responseData = await response.json().catch(() => ({ error: 'Unknown error' }))

    if (!response.ok) {
      // Criar erro com informações adicionais
      const error: any = new Error(responseData.error || `HTTP ${response.status}`)
      error.status = response.status
      error.data = responseData
      throw error
    }

    return responseData
  }

  static async getCurrentUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    return user.id
  }

  static async getCurrentUserProfile() {
    const userId = await this.getCurrentUserId()

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    return data
  }

  static async isAdmin(): Promise<boolean> {
    try {
      const profile = await this.getCurrentUserProfile()
      return profile.user_type === 'admin'
    } catch {
      return false
    }
  }
}
