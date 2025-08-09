
// Secure API Storage Service - Cross-device compatible with access controls
import { GroupMetadata, MemberData, ContributionData } from './types'

export interface StorageResult<T = any> {
  success: boolean
  data?: T
  error?: string
  hash?: string
}

class OnlineStorageService {
  private static instance: OnlineStorageService | null = null
  private baseUrl = '/api'

  static getInstance(): OnlineStorageService {
    if (!OnlineStorageService.instance) {
      OnlineStorageService.instance = new OnlineStorageService()
    }
    return OnlineStorageService.instance
  }

  async initialize(): Promise<void> {
    console.log('🔐 Secure API storage service ready')
  }

  async saveGroup(groupId: string, groupData: GroupMetadata, userAddress?: string): Promise<StorageResult> {
    try {
      console.log('💾 Saving group to secure API:', groupId)

      if (!userAddress) {
        return { success: false, error: 'User address required for secure storage' }
      }

      const data = {
        ...groupData,
        id: groupId,
        updatedAt: new Date().toISOString()
      }

      const response = await fetch(`${this.baseUrl}/groups`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Address': userAddress
        },
        body: JSON.stringify({ id: groupId, ...data })
      })

      if (response.ok) {
        console.log('✅ Group saved successfully:', groupId)
        return {
          success: true,
          data,
          hash: `secure-${groupId}-${Date.now()}`
        }
      }

      const error = await response.text()
      console.error('❌ Failed to save group:', error)
      return { success: false, error: `Failed to save: ${error}` }
    } catch (error) {
      console.error('❌ Error saving to secure API:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async loadGroup(groupId: string, userAddress?: string): Promise<StorageResult<GroupMetadata>> {
    try {
      console.log('📥 Loading group from secure API:', groupId)

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (userAddress) {
        headers['X-User-Address'] = userAddress
      }

      const response = await fetch(`${this.baseUrl}/groups/${groupId}`, { headers })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Group loaded from secure API:', groupId)
        return { success: true, data }
      }

      if (response.status === 404) {
        return { success: false, error: 'Group not found' }
      }

      if (response.status === 403) {
        return { success: false, error: 'Access denied' }
      }

      const error = await response.text()
      return { success: false, error: `Failed to load: ${error}` }
    } catch (error) {
      console.error('❌ Error loading group:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async loadAllGroups(userAddress?: string): Promise<StorageResult<GroupMetadata[]>> {
    try {
      console.log('📥 Loading all accessible groups from secure API')

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (userAddress) {
        headers['X-User-Address'] = userAddress
      }

      const response = await fetch(`${this.baseUrl}/groups`, { headers })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Groups loaded:', result.length)
        return { success: true, data: result }
      }

      return { success: true, data: [] }
    } catch (error) {
      console.error('❌ Error loading groups:', error)
      return { success: true, data: [] }
    }
  }

  async getUserGroups(userAddress: string): Promise<StorageResult<GroupMetadata[]>> {
    try {
      console.log('👤 Loading user groups:', userAddress)

      const response = await fetch(`${this.baseUrl}/groups/wallet/${userAddress}`, {
        headers: { 'X-User-Address': userAddress }
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ User groups loaded:', result.length)
        return { success: true, data: result }
      }

      return { success: true, data: [] }
    } catch (error) {
      console.error('❌ Error loading user groups:', error)
      return { success: true, data: [] }
    }
  }

  async deleteGroup(groupId: string, userAddress?: string): Promise<StorageResult> {
    try {
      console.log('🗑️ Deleting group:', groupId)

      if (!userAddress) {
        return { success: false, error: 'User address required for secure operations' }
      }

      const response = await fetch(`${this.baseUrl}/groups/${groupId}/delete`, {
        method: 'DELETE',
        headers: { 'X-User-Address': userAddress }
      })

      if (response.ok) {
        console.log('✅ Group deleted successfully:', groupId)
        return { success: true }
      }

      const error = await response.text()
      return { success: false, error: `Failed to delete: ${error}` }
    } catch (error) {
      console.error('❌ Error deleting group:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async updateGroup(groupId: string, updates: Partial<GroupMetadata>, userAddress?: string): Promise<StorageResult> {
    try {
      console.log('🔄 Updating group:', groupId)

      if (!userAddress) {
        return { success: false, error: 'User address required for secure operations' }
      }

      const response = await fetch(`${this.baseUrl}/groups/${groupId}/update`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Address': userAddress
        },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        console.log('✅ Group updated successfully:', groupId)
        return { success: true }
      }

      const error = await response.text()
      return { success: false, error: `Failed to update: ${error}` }
    } catch (error) {
      console.error('❌ Error updating group:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getStorageStatus(): Promise<{ status: string; details: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      if (response.ok) {
        const data = await response.json()
        return {
          status: 'connected',
          details: data
        }
      }
      return {
        status: 'disconnected',
        details: { error: 'Health check failed' }
      }
    } catch (error) {
      return {
        status: 'disconnected',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
}

export const onlineStorageService = OnlineStorageService.getInstance()
