
import { secureStorageService, StorageResult } from './secure-storage'
import { GroupMetadata } from './types'

class PersistentStorageService {
  private static instance: PersistentStorageService | null = null

  static getInstance(): PersistentStorageService {
    if (!PersistentStorageService.instance) {
      PersistentStorageService.instance = new PersistentStorageService()
    }
    return PersistentStorageService.instance
  }

  // Save group with secure API storage
  async saveGroup(groupId: string, groupData: GroupMetadata, userAddress: string): Promise<StorageResult> {
    try {
      console.log('💾 Saving group:', groupId)
      return await secureStorageService.saveGroup(groupId, groupData, userAddress)
    } catch (error) {
      console.error('❌ Error in persistent save:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // Load group with secure API storage
  async loadGroup(groupId: string, userAddress?: string): Promise<StorageResult<GroupMetadata>> {
    try {
      console.log('📥 Loading group:', groupId)
      return await secureStorageService.loadGroup(groupId, userAddress)
    } catch (error) {
      console.error('❌ Error in persistent load:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // Load all user groups
  async getUserGroups(userAddress: string): Promise<StorageResult<GroupMetadata[]>> {
    try {
      console.log('👤 Loading user groups:', userAddress)
      return await secureStorageService.getUserGroups(userAddress)
    } catch (error) {
      console.error('❌ Error loading user groups:', error)
      return { success: true, data: [] }
    }
  }

  // Delete group
  async deleteGroup(groupId: string, userAddress: string): Promise<StorageResult> {
    try {
      console.log('🗑️ Deleting group:', groupId)
      return await secureStorageService.deleteGroup(groupId, userAddress)
    } catch (error) {
      console.error('❌ Error deleting group:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // Update group
  async updateGroup(groupId: string, updates: Partial<GroupMetadata>, userAddress: string): Promise<StorageResult> {
    try {
      console.log('🔄 Updating group:', groupId)
      return await secureStorageService.updateGroup(groupId, updates, userAddress)
    } catch (error) {
      console.error('❌ Error updating group:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // Get storage status
  async getStorageStatus(): Promise<{ secure: any }> {
    const secureStatus = await secureStorageService.getStorageStatus()
    return { secure: secureStatus }
  }
}

export const persistentStorageService = PersistentStorageService.getInstance()
