
import { GroupMetadata, MemberData, ContributionData } from './types'
import { ipfsOnlyStorageService } from './hybrid-storage'

export interface StorageResult<T = any> {
  success: boolean
  data?: T
  error?: string
  hash?: string
}

class DataPersistenceService {
  private readonly ADMIN_WALLET = '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'

  /**
   * Save group data to IPFS
   */
  async saveGroup(groupData: GroupMetadata, userAddress: string): Promise<StorageResult<string>> {
    try {
      console.log('💾 Saving group to IPFS...', groupData.groupId)
      
      const result = await ipfsOnlyStorageService.storeGroupData(groupData, userAddress)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to save group data'
        }
      }

      console.log('✅ Group saved successfully to IPFS')
      return {
        success: true,
        data: result.hash,
        hash: result.hash
      }
    } catch (error) {
      console.error('❌ Error saving group:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Load all groups for a user
   */
  async loadGroups(userAddress: string): Promise<StorageResult<GroupMetadata[]>> {
    try {
      console.log('📥 Loading groups from IPFS...', userAddress)
      
      const groups = await ipfsOnlyStorageService.getUserGroups(userAddress)
      
      console.log(`✅ Loaded ${groups.length} groups from IPFS`)
      return {
        success: true,
        data: groups
      }
    } catch (error) {
      console.error('❌ Error loading groups:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: []
      }
    }
  }

  /**
   * Load a specific group by hash
   */
  async loadGroup(hash: string, userAddress: string): Promise<StorageResult<GroupMetadata>> {
    try {
      console.log('📥 Loading group from IPFS...', hash)
      
      const result = await ipfsOnlyStorageService.loadGroupData(hash, userAddress)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to load group'
        }
      }

      console.log('✅ Group loaded successfully from IPFS')
      return {
        success: true,
        data: result.data
      }
    } catch (error) {
      console.error('❌ Error loading group:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update group data
   */
  async updateGroup(groupId: string, updates: Partial<GroupMetadata>, userAddress: string): Promise<StorageResult<string>> {
    try {
      console.log('🔄 Updating group in IPFS...', groupId)
      
      // For updates, we need to load the current data first, then save the updated version
      // This is a limitation of IPFS - we can't update in place
      const groups = await ipfsOnlyStorageService.getUserGroups(userAddress)
      const existingGroup = groups.find(g => g.groupId === groupId)
      
      if (!existingGroup) {
        return {
          success: false,
          error: 'Group not found'
        }
      }

      const updatedGroup = {
        ...existingGroup,
        ...updates,
        updatedAt: new Date().toISOString()
      }

      return await this.saveGroup(updatedGroup, userAddress)
    } catch (error) {
      console.error('❌ Error updating group:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Delete group data
   */
  async deleteGroup(groupId: string, userAddress: string): Promise<StorageResult<boolean>> {
    try {
      console.log('🗑️ Deleting group from IPFS...', groupId)
      
      // Find the group hash
      const groups = await ipfsOnlyStorageService.getUserGroups(userAddress)
      const group = groups.find(g => g.groupId === groupId)
      
      if (!group || !group.ipfs?.hash) {
        return {
          success: false,
          error: 'Group or hash not found'
        }
      }

      const result = await ipfsOnlyStorageService.deleteGroup(group.ipfs.hash, userAddress)
      
      console.log('✅ Group deleted from IPFS')
      return {
        success: result.success,
        data: result.success,
        error: result.error
      }
    } catch (error) {
      console.error('❌ Error deleting group:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Join a group using IPFS hash
   */
  async joinGroupByHash(hash: string, userAddress: string, nickname: string): Promise<StorageResult<GroupMetadata>> {
    try {
      console.log('🤝 Joining group via IPFS...', { hash, userAddress, nickname })
      
      const result = await ipfsOnlyStorageService.joinGroup(hash, userAddress, nickname)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to join group'
        }
      }

      // Load the updated group data
      if (result.newHash) {
        const groupResult = await ipfsOnlyStorageService.loadGroupData(result.newHash, userAddress)
        return {
          success: true,
          data: groupResult.data,
          hash: result.newHash
        }
      }

      return {
        success: false,
        error: 'No updated hash returned'
      }
    } catch (error) {
      console.error('❌ Error joining group:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get storage status and statistics
   */
  async getStorageStatus(): Promise<{
    type: string
    status: string
    totalGroups: number
    lastSync?: string
  }> {
    try {
      const status = ipfsOnlyStorageService.getStorageStatus()
      
      return {
        type: 'IPFS Only',
        status: 'Connected',
        totalGroups: status.groups,
        lastSync: new Date().toISOString()
      }
    } catch (error) {
      console.error('❌ Error getting storage status:', error)
      return {
        type: 'IPFS Only',
        status: 'Error',
        totalGroups: 0,
        lastSync: new Date().toISOString()
      }
    }
  }

  /**
   * Clear all local storage data (for testing)
   */
  async clearAllData(): Promise<StorageResult<boolean>> {
    try {
      localStorage.removeItem('concordia_ipfs_hashes')
      console.log('✅ All local storage cleared')
      return {
        success: true,
        data: true
      }
    } catch (error) {
      console.error('❌ Error clearing data:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

export const dataPersistenceService = new DataPersistenceService()
