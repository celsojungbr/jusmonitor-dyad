import { ApiClient } from '@/shared/services/apiClient'
import {
  CreateMonitoringRequest,
  CreateMonitoringResponse,
  SearchType,
  MonitoringFrequency
} from '@/shared/types'

export class MonitoramentoService {
  static async createMonitoring(
    monitoringType: SearchType,
    value: string,
    frequency: MonitoringFrequency,
    processId?: string
  ): Promise<CreateMonitoringResponse> {
    const userId = await ApiClient.getCurrentUserId()

    const request: CreateMonitoringRequest = {
      monitoringType,
      value,
      frequency,
      userId,
      processId
    }

    return ApiClient.callEdgeFunction<CreateMonitoringRequest, CreateMonitoringResponse>(
      'create-monitoring',
      request
    )
  }

  static async getUserMonitorings() {
    const userId = await ApiClient.getCurrentUserId()
    const { supabase } = await import('@/integrations/supabase/client')

    const { data, error } = await supabase
      .from('monitorings')
      .select(`
        *,
        process:processes(cnj_number, status)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data
  }

  static async getMonitoringAlerts(monitoringId: string) {
    const { supabase } = await import('@/integrations/supabase/client')

    const { data, error } = await supabase
      .from('monitoring_alerts')
      .select('*')
      .eq('monitoring_id', monitoringId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data
  }

  static async getAllUnreadAlerts() {
    const userId = await ApiClient.getCurrentUserId()
    const { supabase } = await import('@/integrations/supabase/client')

    // First get the user's monitoring IDs
    const { data: monitorings, error: monitoringError } = await supabase
      .from('monitorings')
      .select('id')
      .eq('user_id', userId)

    if (monitoringError) throw monitoringError

    const monitoringIds = monitorings?.map(m => m.id) || []

    if (monitoringIds.length === 0) {
      return []
    }

    // Then get the unread alerts for those monitorings
    const { data, error } = await supabase
      .from('monitoring_alerts')
      .select(`
        *,
        monitoring:monitorings(*)
      `)
      .eq('is_read', false)
      .in('monitoring_id', monitoringIds)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data
  }

  static async pauseMonitoring(monitoringId: string) {
    const userId = await ApiClient.getCurrentUserId()
    const { supabase } = await import('@/integrations/supabase/client')

    const { error } = await supabase
      .from('monitorings')
      .update({ status: 'paused' })
      .eq('id', monitoringId)
      .eq('user_id', userId)

    if (error) throw error
  }

  static async resumeMonitoring(monitoringId: string) {
    const userId = await ApiClient.getCurrentUserId()
    const { supabase } = await import('@/integrations/supabase/client')

    const { error } = await supabase
      .from('monitorings')
      .update({ status: 'active' })
      .eq('id', monitoringId)
      .eq('user_id', userId)

    if (error) throw error
  }

  static async deleteMonitoring(monitoringId: string) {
    const userId = await ApiClient.getCurrentUserId()
    const { supabase } = await import('@/integrations/supabase/client')

    const { error } = await supabase
      .from('monitorings')
      .delete()
      .eq('id', monitoringId)
      .eq('user_id', userId)

    if (error) throw error
  }

  static async markAlertAsRead(alertId: string) {
    const { supabase } = await import('@/integrations/supabase/client')

    const { error } = await supabase
      .from('monitoring_alerts')
      .update({ is_read: true })
      .eq('id', alertId)

    if (error) throw error
  }
}
