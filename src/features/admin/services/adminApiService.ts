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

    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const { count: activeUsers } = await supabase
      .from('credits_plans')
      .select('*', { count: 'exact', head: true })
      .gt('credits_balance', 0)

    const { count: totalProcesses } = await supabase
      .from('processes')
      .select('*', { count: 'exact', head: true })

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

  static async checkApiBalance() {
    const userId = await ApiClient.getCurrentUserId()
    
    return ApiClient.callEdgeFunction('check-api-balance', { userId })
  }

  static async getFeatureConfigs() {
    const { supabase } = await import('@/integrations/supabase/client')
    
    const { data, error } = await supabase
      .from('edge_function_config')
      .select('*')
      .order('function_name')
    
    if (error) throw error
    return data
  }

  static async updateFeatureConfig(
    functionName: string,
    enabledApis: string[],
    apiPriority: string[],
    fallbackEnabled: boolean,
    status: 'active' | 'inactive'
  ) {
    const { supabase } = await import('@/integrations/supabase/client')
    
    const { data: oldConfig } = await supabase
      .from('edge_function_config')
      .select('*')
      .eq('function_name', functionName)
      .single()
    
    const { data, error } = await supabase
      .from('edge_function_config')
      .update({
        enabled_apis: enabledApis,
        api_priority: apiPriority,
        fallback_enabled: fallbackEnabled,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('function_name', functionName)
      .select()
      .single()
    
    if (error) throw error

    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase
      .from('system_logs')
      .insert({
        user_id: user?.id,
        log_type: 'admin_action',
        action: 'update_edge_function_config',
        metadata: {
          function_name: functionName,
          old_status: oldConfig?.status,
          new_status: status,
          old_enabled_apis: oldConfig?.enabled_apis,
          new_enabled_apis: enabledApis,
          old_api_priority: oldConfig?.api_priority,
          new_api_priority: apiPriority
        }
      })
    
    return data
  }

  static async deleteFeatureConfig(functionName: string) {
    const { supabase } = await import('@/integrations/supabase/client')
    
    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase
      .from('system_logs')
      .insert({
        user_id: user?.id,
        log_type: 'admin_action',
        action: 'delete_edge_function_config',
        metadata: {
          function_name: functionName
        }
      })
    
    const { error } = await supabase
      .from('edge_function_config')
      .delete()
      .eq('function_name', functionName)
    
    if (error) throw error
    return { success: true }
  }

  static async getApiLogs(logType?: 'api_call' | 'user_action' | 'error' | 'admin_action', provider?: string, limit: number = 100) {
    const { supabase } = await import('@/integrations/supabase/client')
    
    let query = supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (logType) {
      query = query.eq('log_type', logType)
    }
    
    if (provider) {
      query = query.or(`action.ilike.%${provider}%,metadata->>provider.eq.${provider}`)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return { logs: data }
  }

  static async getEscavadorLogs(limit: number = 50) {
    const { supabase } = await import('@/integrations/supabase/client')
    
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .or('action.ilike.%escavador%,metadata->>provider.eq.escavador')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  }

  static async getAllProcesses() {
    const { supabase } = await import('@/integrations/supabase/client')

    const { data, error } = await supabase
      .from('processes')
      .select('*')
      .order('last_update', { ascending: false })

    if (error) throw error

    return data
  }

  static async getProcessConsultations(processId: string) {
    const { supabase } = await import('@/integrations/supabase/client')

    const { data, error } = await supabase
      .from('user_searches')
      .select(`
        *,
        profile:profiles(full_name, email)
      `)
      .contains('metadata', { processId })
      .order('created_at', { ascending: false })

    if (error) throw error

    return data
  }

  static async getAllTransactions() {
    const { supabase } = await import('@/integrations/supabase/client')

    const { data, error } = await supabase
      .from('credit_transactions')
      .select(`
        *,
        profile:profiles(full_name, email)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data
  }

  static async updateUserCredits(userId: string, creditsAmount: number, description: string) {
    const { supabase } = await import('@/integrations/supabase/client')

    const { error: updateError } = await supabase
      .from('credits_plans')
      .update({ credits_balance: creditsAmount })
      .eq('user_id', userId)

    if (updateError) throw updateError

    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        transaction_type: 'purchase',
        operation_type: 'admin_adjustment',
        credits_amount: creditsAmount,
        cost_in_reais: 0,
        description
      })

    if (transactionError) throw transactionError

    return { success: true }
  }
}