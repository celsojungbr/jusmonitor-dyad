import { ApiClient } from '@/shared/services/apiClient'
import {
  GetProcessDetailsRequest,
  GetProcessDetailsResponse,
  DownloadAttachmentRequest,
  DownloadAttachmentResponse,
  CaptureAttachmentsRequest,
  CaptureAttachmentsResponse,
  GeneratePdfDossierRequest,
  GeneratePdfDossierResponse
} from '@/shared/types'

export class ProcessoService {
  static async getProcessDetails(cnjNumber: string): Promise<GetProcessDetailsResponse> {
    const userId = await ApiClient.getCurrentUserId()

    const request: GetProcessDetailsRequest = {
      cnjNumber,
      userId
    }

    return ApiClient.callEdgeFunction<GetProcessDetailsRequest, GetProcessDetailsResponse>(
      'get-process-details',
      request
    )
  }

  static async getUserProcesses() {
    const userId = await ApiClient.getCurrentUserId()
    const { supabase } = await import('@/integrations/supabase/client')

    const { data, error } = await supabase
      .from('user_processes')
      .select(`
        *,
        process:processes(*)
      `)
      .eq('user_id', userId)
      .order('added_at', { ascending: false })

    if (error) throw error

    return data
  }

  static async downloadAttachment(attachmentId: string): Promise<DownloadAttachmentResponse> {
    const userId = await ApiClient.getCurrentUserId()

    const request: DownloadAttachmentRequest = {
      attachmentId,
      userId
    }

    return ApiClient.callEdgeFunction<DownloadAttachmentRequest, DownloadAttachmentResponse>(
      'download-attachments',
      request
    )
  }


  static async removeProcessFromList(processId: string) {
    const userId = await ApiClient.getCurrentUserId()
    const { supabase } = await import('@/integrations/supabase/client')

    const { error } = await supabase
      .from('user_processes')
      .delete()
      .eq('user_id', userId)
      .eq('process_id', processId)

    if (error) throw error
  }

  static async captureAttachments(cnjNumber: string): Promise<CaptureAttachmentsResponse> {
    const userId = await ApiClient.getCurrentUserId()

    const request: CaptureAttachmentsRequest = {
      cnjNumber,
      userId
    }

    return ApiClient.callEdgeFunction<CaptureAttachmentsRequest, CaptureAttachmentsResponse>(
      'capture-attachments',
      request
    )
  }

  static async generatePdfDossier(
    cnjNumber: string,
    includeAttachments: boolean = false
  ): Promise<GeneratePdfDossierResponse> {
    const userId = await ApiClient.getCurrentUserId()

    const request: GeneratePdfDossierRequest = {
      cnjNumber,
      userId,
      includeAttachments
    }

    return ApiClient.callEdgeFunction<GeneratePdfDossierRequest, GeneratePdfDossierResponse>(
      'generate-pdf-dossier',
      request
    )
  }
}
