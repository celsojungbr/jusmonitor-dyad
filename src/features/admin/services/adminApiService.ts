import { ApiClient } from '@/shared/services/apiClient'
import {
  AdminApiConfigRequest,
  AdminApiConfigResponse,
  ApiName
} from '@/shared/types'

export class AdminApiService {
  static async listApiConfigurations(): Promise<AdminApiConfigResponse> {
    const userId = await ApiClient.getCurrentUserId()

    const request: AdminApiConfigRequest = {
      action: 'list',
      userId
    }

    return ApiClient.callEdgeFunction<AdminApiConfigRequest, AdminApiConfigResponse>(
      'admin-api-config',
      request
    )
  }

  static async getApiConfiguration(apiName: ApiName): Promise<AdminApiConfigResponse> {
    const userId = await ApiClient.getCurrentUserId()

    const request: AdminApiConfigRequest = {
      action: 'get',
      apiName,
      userId
    }

    return ApiClient.callEdgeFunction<AdminApiConfigRequest, AdminApiConfigResponse>(
      'admin-api-config',
      request
    )
  }

  static async updateApiConfiguration(
    apiName: ApiName,
    updates: {
      apiKey?: string
      endpointUrl?: string
      isActive?: boolean
      priority?: number
      rateLimit?: number
      timeout?: number
      fallbackApi?: string
    }
  ): Promise<AdminApiConfigResponse> {
    const userId = await ApiClient.getCurrentUserId()

    const request: AdminApiConfigRequest = {
      action: 'update',
      apiName,
      ...updates,
      userId
    }

    return ApiClient.callEdgeFunction<AdminApiConfigRequest, AdminApiConfigResponse>(
      'admin-api-config',
      request
    )
  }

  static async testApiConnection(apiName: ApiName): Promise<AdminApiConfigResponse> {
    const userId = await ApiClient.getCurrentUserId()

    const request: AdminApiConfigRequest = {
      action: 'test',
      apiName,
      userId
    }

    return ApiClient.callEdgeFunction<AdminApiConfigRequest, AdminApiConfigResponse>(
      'admin-api-config',
      request
    )
  }

  static async listEdgeFunctionConfigs(): Promise<AdminApiConfigResponse> {
    const userId = await ApiClient.getCurrentUserId()

    const request: AdminApiConfigRequest = {
      action: 'list_edge_functions',
      userId
    }

    return ApiClient.callEdgeFunction<AdminApiConfigRequest, AdminApiConfigResponse>(
      'admin-api-config',
      request
    )
  }

  static async updateEdgeFunctionConfig(
    functionName: string,
    enabledApis: string[],
    apiPriority: string[],
    fallbackEnabled: boolean
  ): Promise<AdminApiConfigResponse> {
    const userId = await ApiClient.getCurrentUserId()

    const request: AdminApiConfigRequest = {
      action: 'update_edge_function',
      functionName,
      enabledApis,
      apiPriority,
      fallbackEnabled,
      userId
    }

    return ApiClient.callEdgeFunction<AdminApiConfigRequest, AdminApiConfigResponse>(
      'admin-api-config',
      request
    )
  }

  // Métodos adicionais para queries diretas (usuários, logs, etc.)
  static async getAllUsers() {
    const { supabase } = await import('@/integrations/supabase/client')

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return data
  }

  static async getUserStats() {
    const { supabase } = await import('@/integrations/supabase/client')

    // Total de usuários
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Usuários ativos (com créditos)
    const { count: activeUsers } = await supabase
      .from('credits_plans')
      .select('*', { count: 'exact', head: true })
      .gt('credits_balance', 0)

    // Total de processos no DataLake
    const { count: totalProcesses } = await supabase
      .from('processes')
      .select('*', { count: 'exact', head: true })

    // Consumo de créditos hoje
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: creditsToday } = await supabase
      .from('credit_transactions')
      .select('credits_amount')
      .eq('transaction_type', 'consumption')
      .gte('created_at', today.toISOString())

    const totalCreditsToday = creditsToday?.reduce((sum, t) => sum + Math.abs(t.credits_amount), 0) || 0

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalProcesses: totalProcesses || 0,
      creditsConsumedToday: totalCreditsToday
    }
  }

  static async getSystemLogs(limit: number = 100) {
    const { supabase } = await import('@/integrations/supabase/client')

    const { data, error } = await supabase
      .from('system_logs')
      .select(`
        *,
        profile:profiles(full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return data
  }

  static async getAllMonitorings() {
    const { supabase } = await import('@/integrations/supabase/client')

    const { data, error } = await supabase
      .from('monitorings')
      .select(`
        *,
        profile:profiles(full_name, email)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data
  }
}
