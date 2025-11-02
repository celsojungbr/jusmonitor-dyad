import { ApiClient } from '@/shared/services/apiClient'
import {
  ManageCredentialsRequest,
  ManageCredentialsResponse,
  CredentialType
} from '@/shared/types'

export class SenhaService {
  static async createCredential(
    tribunal: string,
    credentialType: CredentialType,
    credentials: {
      username?: string
      password?: string
      certificate?: string
    }
  ): Promise<ManageCredentialsResponse> {
    const userId = await ApiClient.getCurrentUserId()

    const request: ManageCredentialsRequest = {
      action: 'create',
      tribunal,
      credentialType,
      credentials,
      userId
    }

    return ApiClient.callEdgeFunction<ManageCredentialsRequest, ManageCredentialsResponse>(
      'manage-credentials',
      request
    )
  }

  static async listCredentials(): Promise<ManageCredentialsResponse> {
    const userId = await ApiClient.getCurrentUserId()

    const request: ManageCredentialsRequest = {
      action: 'list',
      userId
    }

    return ApiClient.callEdgeFunction<ManageCredentialsRequest, ManageCredentialsResponse>(
      'manage-credentials',
      request
    )
  }

  static async getCredential(credentialId: string): Promise<ManageCredentialsResponse> {
    const userId = await ApiClient.getCurrentUserId()

    const request: ManageCredentialsRequest = {
      action: 'get',
      credentialId,
      userId
    }

    return ApiClient.callEdgeFunction<ManageCredentialsRequest, ManageCredentialsResponse>(
      'manage-credentials',
      request
    )
  }

  static async updateCredential(
    credentialId: string,
    updates: {
      tribunal?: string
      credentialType?: CredentialType
      credentials?: {
        username?: string
        password?: string
        certificate?: string
      }
    }
  ): Promise<ManageCredentialsResponse> {
    const userId = await ApiClient.getCurrentUserId()

    const request: ManageCredentialsRequest = {
      action: 'update',
      credentialId,
      ...updates,
      userId
    }

    return ApiClient.callEdgeFunction<ManageCredentialsRequest, ManageCredentialsResponse>(
      'manage-credentials',
      request
    )
  }

  static async deleteCredential(credentialId: string): Promise<ManageCredentialsResponse> {
    const userId = await ApiClient.getCurrentUserId()

    const request: ManageCredentialsRequest = {
      action: 'delete',
      credentialId,
      userId
    }

    return ApiClient.callEdgeFunction<ManageCredentialsRequest, ManageCredentialsResponse>(
      'manage-credentials',
      request
    )
  }
}
