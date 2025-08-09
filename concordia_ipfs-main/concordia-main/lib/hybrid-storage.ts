// Wallet-based storage service with IPFS backend
import { walletStorageService } from './wallet-storage-service'
import { GroupMetadata } from './ipfs-service'

const ADMIN_WALLET = '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'

class HybridStorageService {
  private storageKey = 'concordia_ipfs_hashes'

  /**
   * Store group data in IPFS and save hash locally for reference
   */
  async storeGroupData(groupData: any, userAddress: string): Promise<{
    success: boolean;
    hash?: string;
    error?: string;
  }> {
    try {
      console.log('🔄 Storing group data in IPFS...')

      // Store in IPFS
      const ipfsResult = await walletStorageService.storeGroupData(
        groupData.groupId,
        groupData,
        userAddress
      )

      if (!ipfsResult.success) {
        throw new Error(ipfsResult.error || 'Failed to store in IPFS')
      }

      // Save hash reference locally for quick access
      this.saveHashReference(groupData.groupId, ipfsResult.ipfsHash!)

      console.log('✅ Data stored successfully in IPFS')
      return {
        success: true,
        hash: ipfsResult.ipfsHash,
      }
    } catch (error) {
      console.error('❌ Error storing group data:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Load group data from IPFS
   */
  async loadGroupData(hash: string, userAddress: string): Promise<{
    success: boolean;
    data?: GroupMetadata;
    error?: string;
  }> {
    try {
      console.log('🔄 Loading group data from IPFS...')

      const result = await walletStorageService.getGroupData(hash, userAddress)

      if (!result.success) {
        throw new Error(result.error || 'Failed to load group data')
      }

      console.log('✅ Group data loaded successfully')
      return result
    } catch (error) {
      console.error('❌ Error loading group data:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get all group hashes for a user
   */
  async getUserGroups(userAddress: string): Promise<GroupMetadata[]> {
    try {
      console.log('🔄 Loading user groups...')

      const hashRefs = this.getHashReferences()
      const groups: GroupMetadata[] = []

      for (const [groupId, hash] of Object.entries(hashRefs)) {
        try {
          const result = await this.loadGroupData(hash, userAddress)
          if (result.success && result.data) {
            groups.push(result.data)
          }
        } catch (error) {
          console.warn(`Failed to load group ${groupId}:`, error)
        }
      }

      return groups
    } catch (error) {
      console.error('❌ Error loading user groups:', error)
      return []
    }
  }

  /**
   * Join a group
   */
  async joinGroup(groupCode: string, userAddress: string, nickname: string): Promise<boolean> {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
      console.log('🤝 Joining group with code:', groupCode, 'user:', userAddress)

      const response = await fetch(`${apiUrl}/groups/join-with-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupCode,
          userAddress,
          nickname,
        }),
      })

      const result = await response.json()
      if (result.success) {
        console.log('✅ Successfully joined group:', result.groupId)
        return true
      } else {
        console.error('❌ Failed to join group:', result.error)
        return false
      }
    } catch (error) {
      console.error('❌ Error joining group:', error)
      return false
    }
  }

  /**
   * Delete a group
   */
  async deleteGroup(hash: string, userAddress: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // First get group data to find groupId
      const groupData = await this.loadGroupData(hash, userAddress)
      if (groupData.success && groupData.data) {
        // Remove hash reference
        this.removeHashReference(groupData.data.groupId)
      }

      return await walletStorageService.deleteGroup(hash, userAddress)
    } catch (error) {
      console.error('❌ Error deleting group:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Save hash reference locally
   */
  private saveHashReference(groupId: string, hash: string): void {
    try {
      const hashRefs = this.getHashReferences()
      hashRefs[groupId] = hash
      localStorage.setItem(this.storageKey, JSON.stringify(hashRefs))
    } catch (error) {
      console.warn('Failed to save hash reference:', error)
    }
  }

  /**
   * Get hash references from localStorage
   */
  private getHashReferences(): Record<string, string> {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.warn('Failed to get hash references:', error)
      return {}
    }
  }

  /**
   * Remove hash reference
   */
  private removeHashReference(groupId: string): void {
    try {
      const hashRefs = this.getHashReferences()
      delete hashRefs[groupId]
      localStorage.setItem(this.storageKey, JSON.stringify(hashRefs))
    } catch (error) {
      console.warn('Failed to remove hash reference:', error)
    }
  }

  /**
   * Get storage status
   */
  getStorageStatus(): {
    type: string;
    status: string;
    groups: number;
  } {
    const hashRefs = this.getHashReferences()

    return {
      type: 'Wallet Storage (IPFS Backend)',
      status: 'Active',
      groups: Object.keys(hashRefs).length,
    }
  }

  /**
   * Load all groups accessible by the user
   */
  async loadGroups(userAddress?: string): Promise<GroupMetadata[]> {
    try {
      if (!userAddress) {
        console.log('❌ No user address provided, cannot load groups')
        return []
      }

      console.log('🔄 Loading groups for wallet:', userAddress)

      // Use wallet storage service directly or via API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
      const response = await fetch(`${apiUrl}/groups/wallet/${userAddress}`)

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.groups) {
          console.log('✅ Successfully loaded user groups:', result.groups.length)
          return result.groups
        }
      } else if (response.status === 403) {
        console.log('🔒 Access denied for user:', userAddress)
        return []
      }

      console.log('📭 No groups found for user:', userAddress)
      return []
    } catch (error) {
      console.error('❌ Error loading groups:', error)
      return []
    }
  }

  /**
   * Save a group with its data
   */
  async saveGroup(groupData: any, userAddress: string): Promise<boolean> {
    try {
      console.log('💾 Saving group with wallet storage:', groupData.id, 'by user:', userAddress)

      // Initialize wallet storage service
      await walletStorageService.initializeStorage()

      // Convert groupData to GroupMetadata format
      const groupMetadata: GroupMetadata = {
        groupId: groupData.id || groupData.groupId,
        name: groupData.name,
        description: groupData.description,
        creator: userAddress,
        goalAmount: groupData.goalAmount || groupData.targetAmount,
        duration: groupData.duration,
        withdrawalDate: groupData.withdrawalDate,
        dueDay: groupData.dueDay,
        members: groupData.members || [],
        contributions: groupData.contributions || [],
        settings: groupData.settings || {
          dueDay: groupData.dueDay,
          duration: groupData.duration,
          withdrawalDate: groupData.withdrawalDate,
          isActive: true,
          maxMembers: 10
        },
        blockchain: groupData.blockchain || {
          contractAddress: '',
          transactionHash: '',
          blockNumber: '',
          gasUsed: '',
          network: 'opBNB Testnet'
        },
        createdAt: groupData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '3.0'
      }

      const result = await walletStorageService.saveGroup(groupMetadata, userAddress)

      if (result.success) {
        console.log('✅ Group saved successfully with wallet storage')
        return true
      } else {
        console.error('❌ Failed to save group:', result.error)
        return false
      }
    } catch (error) {
      console.error('❌ Error saving group with wallet storage:', error)
      return false
    }
  }
}

export const hybridStorageService = new HybridStorageService()