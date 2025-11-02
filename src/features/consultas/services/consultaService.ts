import { ApiClient } from '@/shared/services/apiClient'
import {
  SearchProcessesRequest,
  SearchProcessesResponse,
  SearchType
} from '@/shared/types'

export class ConsultaService {
  static async searchProcesses(
    searchType: SearchType,
    searchValue: string
  ): Promise<SearchProcessesResponse> {
    const userId = await ApiClient.getCurrentUserId()

    const request: SearchProcessesRequest = {
      searchType,
      searchValue,
      userId
    }

    return ApiClient.callEdgeFunction<SearchProcessesRequest, SearchProcessesResponse>(
      'search-processes',
      request
    )
  }

  static async getRecentSearches() {
    const userId = await ApiClient.getCurrentUserId()
    const { supabase } = await import('@/integrations/supabase/client')

    const { data, error } = await supabase
      .from('user_searches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error

    return data
  }

  static async getSearchHistory(searchType?: SearchType) {
    const userId = await ApiClient.getCurrentUserId()
    const { supabase } = await import('@/integrations/supabase/client')

    let query = supabase
      .from('user_searches')
      .select('*')
      .eq('user_id', userId)

    if (searchType) {
      query = query.eq('search_type', searchType)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return data
  }
}
