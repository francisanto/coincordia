
import { ethers } from 'ethers';

export interface GroupMetadata {
  groupId: string;
  name: string;
  description: string;
  creator: string;
  goalAmount: number;
  duration: number;
  withdrawalDate: string;
  dueDay: number;
  members: MemberData[];
  contributions: ContributionData[];
  settings: GroupSettings;
  blockchain: BlockchainData;
  greenfield: GreenfieldData;
  createdAt: string;
  updatedAt: string;
  version: string;
}

export interface MemberData {
  address: string;
  nickname: string;
  joinedAt: string;
  role: 'creator' | 'member';
  contribution: number;
  auraPoints: number;
  hasVoted: boolean;
  status?: 'active' | 'inactive';
}

export interface ContributionData {
  id: string;
  contributor: string;
  memberAddress?: string;
  amount: number;
  timestamp: string;
  auraPoints: number;
  isEarly: boolean;
  transactionHash: string;
  status?: 'pending' | 'confirmed' | 'failed';
}

export interface GroupSettings {
  dueDay: number;
  duration: string;
  withdrawalDate: string;
  isActive: boolean;
  maxMembers: number;
  bucketName: string; // Each group has its own bucket
}

export interface BlockchainData {
  contractAddress: string;
  transactionHash: string;
  blockNumber: string;
  gasUsed: string;
  network: string;
}

export interface GreenfieldData {
  objectId: string;
  objectName: string;
  metadataHash: string;
  bucketName: string; // Group-specific bucket
  endpoint: string;
  isOwner?: boolean;
}

export class GreenfieldService {
  private apiBaseUrl: string;
  private contractAddress: string;
  private adminBucketName: string; // Main admin bucket for all groups metadata
  private adminWallet: string; // Admin wallet with full access

  constructor() {
    this.apiBaseUrl = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || '';
    this.contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
    this.adminBucketName = 'concordia-admin-data'; // Admin bucket for all groups overview
    this.adminWallet = '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'; // Admin wallet address
  }

  /**
   * Create a new bucket for a group (called when group is created)
   */
  async createGroupBucket(groupId: string, creatorAddress: string): Promise<{
    success: boolean;
    bucketName?: string;
    bucketId?: string;
    error?: string;
  }> {
    try {
      console.log('🪣 Creating new bucket for group:', groupId);

      const bucketName = `concordia-group-${groupId.toLowerCase()}`;
      
      const response = await fetch(`${this.apiBaseUrl}/api/buckets/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bucketName,
          groupId,
          creatorAddress,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create group bucket');
      }

      console.log('✅ Group bucket created successfully:', bucketName);
      return {
        success: true,
        bucketName,
        bucketId: result.bucketId,
      };
    } catch (error) {
      console.error('❌ Error creating group bucket:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Store group data in its own bucket
   */
  async storeGroupData(groupId: string, groupData: Partial<GroupMetadata>, userAddress: string): Promise<{
    success: boolean;
    objectId?: string;
    metadataHash?: string;
    error?: string;
  }> {
    try {
      console.log('📤 Storing group data in group bucket:', { groupId, userAddress });

      // Check if user is group creator or member
      const hasAccess = await this.checkGroupAccess(groupId, userAddress);
      if (!hasAccess.canWrite) {
        throw new Error('Access denied: You cannot write to this group');
      }

      const response = await fetch(`${this.apiBaseUrl}/api/groups/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId,
          groupData: {
            ...groupData,
            updatedAt: new Date().toISOString(),
          },
          userAddress,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to store group data');
      }

      // Also update admin bucket with group metadata
      await this.updateAdminBucket(groupId, groupData, 'update');

      console.log('✅ Group data stored successfully:', result);
      return {
        success: true,
        objectId: result.objectId,
        metadataHash: result.metadataHash,
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
   * Get group data from its bucket (users can only read their own groups)
   */
  async getGroupData(groupId: string, userAddress?: string): Promise<{
    success: boolean;
    data?: GroupMetadata;
    error?: string;
  }> {
    try {
      console.log('📥 Retrieving group data from group bucket:', groupId, userAddress);

      // Check access rights
      if (userAddress) {
        const hasAccess = await this.checkGroupAccess(groupId, userAddress);
        if (!hasAccess.canRead) {
          throw new Error('Access denied: You cannot access this group');
        }
      }

      const response = await fetch(`${this.apiBaseUrl}/api/groups/${groupId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Address': userAddress || '',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to retrieve group data');
      }

      console.log('✅ Group data retrieved successfully');
      return {
        success: true,
        data: result.metadata,
      };
    } catch (error) {
      console.error('❌ Error retrieving group data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all groups for a user (only groups they are members of)
   */
  async getUserGroups(userAddress: string): Promise<{
    success: boolean;
    data?: GroupMetadata[];
    error?: string;
  }> {
    try {
      console.log('📥 Retrieving user groups:', userAddress);

      const response = await fetch(`${this.apiBaseUrl}/api/groups?address=${userAddress}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to retrieve user groups');
      }

      console.log('✅ User groups retrieved successfully:', result.groups?.length || 0);
      return {
        success: true,
        data: result.groups || [],
      };
    } catch (error) {
      console.error('❌ Error retrieving user groups:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Admin only: Get all groups from all buckets
   */
  async getAllGroupsAdmin(adminKey: string): Promise<{
    success: boolean;
    data?: GroupMetadata[];
    error?: string;
  }> {
    try {
      console.log('👑 Admin retrieving all groups');

      const response = await fetch(`${this.apiBaseUrl}/api/admin/groups?admin_key=${adminKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to retrieve all groups');
      }

      console.log('✅ All groups retrieved successfully:', result.groups?.length || 0);
      return {
        success: true,
        data: result.groups || [],
      };
    } catch (error) {
      console.error('❌ Error retrieving all groups:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Join a group (add member to group's bucket)
   */
  async joinGroup(groupId: string, userAddress: string, nickname: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('🤝 User joining group:', { groupId, userAddress, nickname });

      const response = await fetch(`${this.apiBaseUrl}/api/groups/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId,
          userAddress,
          nickname,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to join group');
      }

      console.log('✅ Successfully joined group');
      return {
        success: true,
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
   * Check if user is admin
   */
  private isAdmin(userAddress: string): boolean {
    return userAddress.toLowerCase() === this.adminWallet.toLowerCase();
  }

  /**
   * Check if user has access to a group
   */
  async checkGroupAccess(groupId: string, userAddress: string): Promise<{
    canRead: boolean;
    canWrite: boolean;
    isCreator: boolean;
    isAdmin: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/groups/${groupId}/access?address=${userAddress}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          canRead: false,
          canWrite: false,
          isCreator: false,
          error: result.error,
        };
      }

      return {
        canRead: result.canRead || this.isAdmin(userAddress),
        canWrite: result.canWrite || this.isAdmin(userAddress),
        isCreator: result.isCreator || false,
        isAdmin: this.isAdmin(userAddress),
      };
    } catch (error) {
      console.error('❌ Error checking group access:', error);
      return {
        canRead: this.isAdmin(userAddress),
        canWrite: this.isAdmin(userAddress),
        isCreator: false,
        isAdmin: this.isAdmin(userAddress),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update admin bucket with group metadata
   */
  private async updateAdminBucket(groupId: string, groupData: Partial<GroupMetadata>, action: 'create' | 'update' | 'delete'): Promise<void> {
    try {
      console.log('👑 Updating admin bucket:', { groupId, action });

      await fetch(`${this.apiBaseUrl}/api/admin/update-bucket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId,
          groupData,
          action,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.warn('⚠️ Failed to update admin bucket:', error);
      // Don't throw error as this is secondary operation
    }
  }

  /**
   * Store contribution in group bucket
   */
  async storeContribution(groupId: string, contributionData: ContributionData, userAddress: string): Promise<{
    success: boolean;
    contributionId?: string;
    error?: string;
  }> {
    try {
      console.log('💰 Storing contribution in group bucket:', { groupId, userAddress });

      // Check if user has write access
      const hasAccess = await this.checkGroupAccess(groupId, userAddress);
      if (!hasAccess.canWrite) {
        throw new Error('Access denied: You cannot add contributions to this group');
      }

      const response = await fetch(`${this.apiBaseUrl}/api/contributions/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId,
          contributionData,
          userAddress,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to store contribution');
      }

      console.log('✅ Contribution stored successfully');
      return {
        success: true,
        contributionId: result.contributionId,
      };
    } catch (error) {
      console.error('❌ Error storing contribution:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete group and its bucket (creator only)
   */
  async deleteGroup(groupId: string, userAddress: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('🗑️ Deleting group and bucket:', { groupId, userAddress });

      const response = await fetch(`${this.apiBaseUrl}/api/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'User-Address': userAddress,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete group');
      }

      // Update admin bucket
      await this.updateAdminBucket(groupId, {}, 'delete');

      console.log('✅ Group deleted successfully');
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
   * Generate metadata hash for data integrity
   */
  generateMetadataHash(data: any): string {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return ethers.keccak256(ethers.toUtf8Bytes(dataString));
  }

  /**
   * Create comprehensive group metadata with proper bucket assignment
   */
  createGroupMetadata(params: {
    groupId: string;
    name: string;
    description: string;
    creator: string;
    goalAmount: number;
    duration: string;
    withdrawalDate: string;
    dueDay: number;
    contractAddress: string;
    transactionHash: string;
    blockNumber: string;
    gasUsed: string;
    bucketName: string; // Group-specific bucket
  }): GroupMetadata {
    const metadata: GroupMetadata = {
      groupId: params.groupId,
      name: params.name,
      description: params.description,
      creator: params.creator,
      goalAmount: params.goalAmount,
      duration: params.duration === '1-month' ? 30 : 
                params.duration === '3-months' ? 90 : 
                params.duration === '6-months' ? 180 : 365,
      withdrawalDate: params.withdrawalDate,
      dueDay: params.dueDay,
      members: [
        {
          address: params.creator,
          nickname: 'Creator',
          joinedAt: new Date().toISOString(),
          role: 'creator',
          contribution: 0,
          auraPoints: 5,
          hasVoted: false,
          status: 'active',
        },
      ],
      contributions: [],
      settings: {
        dueDay: params.dueDay,
        duration: params.duration,
        withdrawalDate: params.withdrawalDate,
        isActive: true,
        maxMembers: 10,
        bucketName: params.bucketName, // Each group has its own bucket
      },
      blockchain: {
        contractAddress: params.contractAddress,
        transactionHash: params.transactionHash,
        blockNumber: params.blockNumber,
        gasUsed: params.gasUsed,
        network: 'opBNB Testnet',
      },
      greenfield: {
        objectId: `${params.groupId}-data`,
        objectName: `groups/${params.groupId}/data.json`,
        metadataHash: '',
        bucketName: params.bucketName, // Group-specific bucket
        endpoint: 'https://gnfd-testnet-sp1.bnbchain.org',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '2.0',
    };

    // Generate metadata hash
    metadata.greenfield.metadataHash = this.generateMetadataHash(metadata);

    return metadata;
  }
}

// Export singleton instance
export const greenfieldService = new GreenfieldService();
