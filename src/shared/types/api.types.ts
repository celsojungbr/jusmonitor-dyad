// API Request/Response Types

import { Process, ProcessMovement, ProcessAttachment, Monitoring, SearchType, MonitoringFrequency } from './database.types'

// ============================================
// SEARCH PROCESSES
// ============================================
export interface SearchProcessesRequest {
  searchType: SearchType
  searchValue: string
  userId: string
}

export interface SearchProcessesResponse {
  success: boolean
  from_cache: boolean
  credits_consumed: number
  results_count: number
  processes: Process[]
}

// ============================================
// GET PROCESS DETAILS
// ============================================
export interface GetProcessDetailsRequest {
  cnjNumber: string
  userId: string
}

export interface GetProcessDetailsResponse {
  success: boolean
  from_cache: boolean
  credits_consumed: number
  process: Process
  movements: ProcessMovement[]
  attachments: ProcessAttachment[]
}

// ============================================
// DOWNLOAD ATTACHMENT
// ============================================
export interface DownloadAttachmentRequest {
  attachmentId: string
  userId: string
}

export interface DownloadAttachmentResponse {
  success: boolean
  download_url: string
  credits_consumed: number
  attachment_name: string
}

// ============================================
// CREATE MONITORING
// ============================================
export interface CreateMonitoringRequest {
  monitoringType: SearchType
  value: string
  frequency: MonitoringFrequency
  userId: string
  processId?: string
}

export interface CreateMonitoringResponse {
  success: boolean
  monitoring: Monitoring
  credits_consumed: number
}

// ============================================
// REGISTRATION DATA (Dados Cadastrais)
// ============================================
export interface SearchRegistrationDataRequest {
  documentType: 'cpf' | 'cnpj'
  document: string
  userId: string
}

export interface SearchRegistrationDataResponse {
  success: boolean
  from_cache: boolean
  credits_consumed: number
  data: {
    name: string
    document: string
    document_type: string
    addresses: any[]
    contacts: any[]
    registration_status: string
    additional_data: any
    last_update: string
  }
}

// ============================================
// CRIMINAL RECORDS (Consultas Penais)
// ============================================
export interface SearchCriminalRecordsRequest {
  cpf: string
  userId: string
}

export interface SearchCriminalRecordsResponse {
  success: boolean
  from_cache: boolean
  credits_consumed: number
  data: {
    cpf: string
    warrants: any[]
    criminal_executions: any[]
    has_active_warrants: boolean
    last_update: string
  }
}

// ============================================
// DIÁRIOS OFICIAIS
// ============================================
export interface SearchDiariosOficiaisRequest {
  searchType: 'cpf' | 'cnpj' | 'oab' | 'nome'
  searchValue: string
  userId: string
}

export interface SearchDiariosOficiaisResponse {
  success: boolean
  from_cache: boolean
  credits_consumed: number
  source: string
  results_count: number
  results: any[]
  processes_mentioned?: string[]
}

// ============================================
// CAPTURE ATTACHMENTS
// ============================================
export interface CaptureAttachmentsRequest {
  cnjNumber: string
  userId: string
}

export interface CaptureAttachmentsResponse {
  success: boolean
  job_id: string
  status: string
  estimated_time?: string
  message: string
}

// ============================================
// GENERATE PDF DOSSIER
// ============================================
export interface GeneratePdfDossierRequest {
  cnjNumber: string
  userId: string
  includeAttachments?: boolean
}

export interface GeneratePdfDossierResponse {
  success: boolean
  credits_consumed: number
  pdf_html: string
  process_data: any
  movements_count: number
  attachments_count: number
  message: string
}

// ============================================
// AI CHAT
// ============================================
export interface AiChatRequest {
  processId: string
  userMessage: string
  userId: string
}

export interface AiChatResponse {
  success: boolean
  message: string
  credits_consumed: number
}

// ============================================
// MANAGE CREDENTIALS
// ============================================
export interface ManageCredentialsRequest {
  action: 'create' | 'list' | 'get' | 'update' | 'delete'
  credentialId?: string
  tribunal?: string
  credentialType?: 'password' | 'certificate'
  credentials?: {
    username?: string
    password?: string
    certificate?: string
  }
  userId: string
}

export interface ManageCredentialsResponse {
  success: boolean
  credential?: any
  credentials?: any[]
}

// ============================================
// ADMIN API CONFIG
// ============================================
export interface AdminApiConfigRequest {
  action: 'list' | 'get' | 'update' | 'test' | 'update_edge_function' | 'list_edge_functions'
  configId?: string
  apiName?: 'judit' | 'escavador'
  apiKey?: string
  endpointUrl?: string
  isActive?: boolean
  priority?: number
  rateLimit?: number
  timeout?: number
  fallbackApi?: string
  userId: string
  functionName?: string
  enabledApis?: string[]
  apiPriority?: string[]
  fallbackEnabled?: boolean
}

export interface AdminApiConfigResponse {
  success: boolean
  configuration?: any
  configurations?: any[]
  status?: 'healthy' | 'error' | 'unreachable'
  status_code?: number
  latency_ms?: number
  message?: string
}

// ============================================
// ERROR RESPONSE
// ============================================
export interface ApiErrorResponse {
  error: string
  required?: number
  available?: number
}
