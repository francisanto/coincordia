// Wallet-based storage service with Arweave backend
import { arweaveService } from './arweave-service';
import { GroupMetadata } from './arweave-service';

// Simple Arweave-only storage service for direct Arweave operations
class ArweaveOnlyStorageService {
  async storeGroupData(groupData: any, userAddress: string): Promise<{
    success: boolean;
    hash?: string;
    error?: string;
  }> {
    try {
      console.log('📤 Storing group data directly in Arweave...');
      
      const result = await arweaveService.storeGroupData(
        groupData.groupId,
        groupData,
        userAddress
      );
      
      return {
        success: result.success,
        hash: result.transactionId,
        error: result.error
      };
    } catch (error) {
      console.error('❌ Error in Arweave-only storage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all groups for a user
   */
  async getUserGroups(userAddress: string): Promise<GroupMetadata[]> {
    try {
      console.log('📥 Getting user groups from Arweave...', userAddress);
      
      // In a real implementation, this would query Arweave for all groups
      // associated with this user address
      const result = await arweaveService.getUserGroups(userAddress);
      
      if (!result.success) {
        console.error('❌ Error getting user groups:', result.error);
        return [];
      }
      
      return result.data || [];
    } catch (error) {
      console.error('❌ Error getting user groups:', error);
      return [];
    }
  }

  /**
   * Load group data from Arweave
   */
  async loadGroupData(hash: string, userAddress: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      console.log('📥 Loading group data from Arweave...', hash);
      
      const result = await arweaveService.getGroupData(hash, userAddress);
      
      return {
        success: result.success,
        data: result.data,
        error: result.error
      };
    } catch (error) {
      console.error('❌ Error loading group data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export the Arweave-only storage service
export const arweaveOnlyStorageService = new ArweaveOnlyStorageService();

const ADMIN_WALLET = '0xdA13e8F82C83d14E7aa639354054B7f914cA0998';

class ArweaveHybridStorageService {
  private storageKey = 'concordia_arweave_transactions';

  /**
   * Store group data in Arweave and save transaction ID locally for reference
   */
  async storeGroupData(groupData: any, userAddress: string): Promise<{
    success: boolean;
    hash?: string;
    error?: string;
  }> {
    try {
      console.log('🔄 Storing group data in Arweave...');

      // Store in Arweave
      const arweaveResult = await arweaveService.storeGroupData(
        groupData.groupId,
        groupData,
        userAddress
      );

      if (!arweaveResult.success) {
        throw new Error(arweaveResult.error || 'Failed to store in Arweave');
      }

      // Save transaction reference locally for quick access
      this.saveTransactionReference(groupData.groupId, arweaveResult.transactionId!);

      console.log('✅ Data stored successfully in Arweave');
      return {
        success: true,
        hash: arweaveResult.transactionId,
      };
    } catch (error) {
      console.error('❌ Error storing group data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Load group data from Arweave
   */
  async loadGroupData(hash: string, userAddress: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      console.log('🔄 Loading group data from Arweave...');

      // Load from Arweave
      const result = await arweaveService.getGroupData(hash, userAddress);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to load group data');
      }

      console.log('✅ Group data loaded successfully');
      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error('❌ Error loading group data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all user groups from Arweave
   */
  async getUserGroups(userAddress: string): Promise<GroupMetadata[]> {
    try {
      console.log('🔄 Loading user groups from Arweave...');

      // Get transaction references from local storage
      const transactionRefs = this.getTransactionReferences();
      const userGroups: GroupMetadata[] = [];

      // First try to load groups from local references
      for (const groupId in transactionRefs) {
        try {
          const transactionId = transactionRefs[groupId];
          const result = await this.loadGroupData(transactionId, userAddress);
          
          if (result.success && result.data) {
            const group = result.data as GroupMetadata;
            
            // Check if user is a member
            const isMember = group.members.some(
              member => member.address.toLowerCase() === userAddress.toLowerCase()
            );
            
            if (isMember) {
              userGroups.push(group);
            }
          }
        } catch (error) {
          console.warn(`Failed to load group ${groupId}:`, error);
          // Continue with other groups
        }
      }

      // If no groups found locally, try to fetch from Arweave directly
      if (userGroups.length === 0) {
        const result = await arweaveService.getUserGroups(userAddress);
        
        if (result.success && result.groups) {
          // Save references locally for future quick access
          for (const group of result.groups) {
            if (group.arweave?.transactionId) {
              this.saveTransactionReference(group.groupId, group.arweave.transactionId);
            }
          }
          
          return result.groups;
        }
      }

      return userGroups;
    } catch (error) {
      console.error('❌ Error getting user groups:', error);
      return [];
    }
  }

  /**
   * Join a group using Arweave transaction ID
   */
  async joinGroup(transactionId: string, userAddress: string, nickname: string): Promise<{
    success: boolean;
    newHash?: string;
    error?: string;
  }> {
    try {
      console.log('🤝 Joining group via Arweave...');

      // Join group via Arweave service
      const result = await arweaveService.joinGroup(transactionId, userAddress, nickname);

      if (!result.success) {
        throw new Error(result.error || 'Failed to join group');
      }

      // If we have a new transaction ID, update our local reference
      if (result.newTransactionId) {
        // Load the group data to get the group ID
        const groupResult = await arweaveService.getGroupData(result.newTransactionId, userAddress);
        
        if (groupResult.success && groupResult.data) {
          this.saveTransactionReference(groupResult.data.groupId, result.newTransactionId);
        }
      }

      return {
        success: true,
        newHash: result.newTransactionId,
      };
    } catch (error) {
      console.error('❌ Error joining group:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete a group (not fully supported in Arweave as it's immutable)
   */
  async deleteGroup(transactionId: string, userAddress: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('🗑️ Marking group as deleted in Arweave...');

      // In Arweave, we can't delete data, but we can mark it as deleted
      // by creating a new transaction with a deletion flag
      const groupResult = await arweaveService.getGroupData(transactionId, userAddress);
      
      if (!groupResult.success || !groupResult.data) {
        throw new Error(groupResult.error || 'Failed to load group data');
      }

      const groupData = groupResult.data;
      
      // Mark as deleted
      const updatedGroupData = {
        ...groupData,
        status: 'deleted',
        deletedAt: new Date().toISOString(),
        deletedBy: userAddress,
      };

      // Store the updated data
      const storeResult = await arweaveService.storeGroupData(
        groupData.groupId,
        updatedGroupData,
        userAddress
      );

      if (!storeResult.success) {
        throw new Error(storeResult.error || 'Failed to mark group as deleted');
      }

      // Remove from local references
      this.removeTransactionReference(groupData.groupId);

      console.log('✅ Group marked as deleted');
      return {
        success: true,
      };
    } catch (error) {
      console.error('❌ Error deleting group:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
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
    const transactionRefs = this.getTransactionReferences();

    return {
      type: 'Wallet Storage (Arweave Backend)',
      status: 'Active',
      groups: Object.keys(transactionRefs).length,
    };
  }

  // Private helper methods

  private saveTransactionReference(groupId: string, transactionId: string): void {
    try {
      const refs = this.getTransactionReferences();
      refs[groupId] = transactionId;
      localStorage.setItem(this.storageKey, JSON.stringify(refs));
    } catch (error) {
      console.error('Failed to save transaction reference:', error);
    }
  }

  private removeTransactionReference(groupId: string): void {
    try {
      const refs = this.getTransactionReferences();
      delete refs[groupId];
      localStorage.setItem(this.storageKey, JSON.stringify(refs));
    } catch (error) {
      console.error('Failed to remove transaction reference:', error);
    }
  }

  private getTransactionReferences(): Record<string, string> {
    try {
      const refsJson = localStorage.getItem(this.storageKey);
      return refsJson ? JSON.parse(refsJson) : {};
    } catch (error) {
      console.error('Failed to get transaction references:', error);
      return {};
    }
  }
}

// Export singleton instance
export const arweaveHybridStorageService = new ArweaveHybridStorageService();
// Export for backward compatibility with IPFS implementation
export const ipfsOnlyStorageService = arweaveHybridStorageService;