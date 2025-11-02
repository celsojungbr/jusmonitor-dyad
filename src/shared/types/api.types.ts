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
