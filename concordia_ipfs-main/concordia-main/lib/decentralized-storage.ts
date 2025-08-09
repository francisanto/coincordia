
import { ipfsService, GroupMetadata } from './ipfs-service'

const ADMIN_WALLET = '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'

interface StorageNode {
  name: string;
  endpoint: string;
  type: 'ipfs' | 'arweave' | 'sia';
  isActive: boolean;
}

class DecentralizedStorageService {
  private storageNodes: StorageNode[] = [
    {
      name: 'IPFS Primary',
      endpoint: 'https://4everland.io',
      type: 'ipfs',
      isActive: true,
    },
    {
      name: 'IPFS Cloudflare',
      endpoint: 'https://cloudflare-ipfs.com',
      type: 'ipfs',
      isActive: true,
    },
    {
      name: 'IPFS DWeb',
      endpoint: 'https://dweb.link',
      type: 'ipfs',
      isActive: true,
    },
  ];

  async storeGroupData(groupData: any, userAddress: string): Promise<{
    success: boolean;
    hash?: string;
    gatewayUrls?: string[];
    error?: string;
  }> {
    try {
      // Check access permissions
      if (!this.hasWriteAccess(groupData, userAddress)) {
        throw new Error('Access denied: You cannot store data for this group');
      }

      console.log('🔄 Storing group data across decentralized networks...');
      
      // Primary storage: IPFS
      const ipfsResult = await ipfsService.storeGroupData(
        groupData.groupId, 
        groupData, 
        userAddress
      );

      if (!ipfsResult.success) {
        throw new Error(ipfsResult.error || 'Failed to store in IPFS');
      }

      const gatewayUrls = ipfsService.getAllGatewayUrls(ipfsResult.ipfsHash!);

      console.log('✅ Data stored successfully on IPFS');
      console.log('🌐 Available on multiple gateways:', gatewayUrls.length);

      return {
        success: true,
        hash: ipfsResult.ipfsHash,
        gatewayUrls,
      };
    } catch (error) {
      console.error('❌ Error storing group data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async loadGroupData(hash: string, userAddress: string): Promise<{
    success: boolean;
    data?: GroupMetadata;
    error?: string;
  }> {
    try {
      console.log('🔄 Loading group data from decentralized storage...');
      
      const result = await ipfsService.getGroupData(hash, userAddress);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load group data');
      }

      // Verify user has read access
      if (!this.hasReadAccess(result.data!, userAddress)) {
        throw new Error('Access denied: You cannot access this group');
      }

      console.log('✅ Group data loaded successfully');
      return result;
    } catch (error) {
      console.error('❌ Error loading group data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getUserGroups(userAddress: string): Promise<GroupMetadata[]> {
    try {
      console.log('🔄 Loading user groups for:', userAddress);
      
      // This would need to be enhanced with a proper indexing system
      // For now, return empty array - groups are loaded via API
      return [];
    } catch (error) {
      console.error('❌ Error loading user groups:', error);
      return [];
    }
  }

  private hasReadAccess(groupData: GroupMetadata, userAddress: string): boolean {
    const isAdmin = userAddress.toLowerCase() === ADMIN_WALLET.toLowerCase();
    const isCreator = groupData.creator?.toLowerCase() === userAddress.toLowerCase();
    const isMember = groupData.members?.some(m => 
      m.address.toLowerCase() === userAddress.toLowerCase()
    );

    return isAdmin || isCreator || isMember || false;
  }

  private hasWriteAccess(groupData: any, userAddress: string): boolean {
    const isAdmin = userAddress.toLowerCase() === ADMIN_WALLET.toLowerCase();
    const isCreator = groupData.creator?.toLowerCase() === userAddress.toLowerCase();
    const isMember = groupData.members?.some((m: any) => 
      m.address?.toLowerCase() === userAddress.toLowerCase()
    );

    return isAdmin || isCreator || isMember || false;
  }

  getStorageStatus(): {
    totalNodes: number;
    activeNodes: number;
    nodes: StorageNode[];
  } {
    const activeNodes = this.storageNodes.filter(node => node.isActive);
    
    return {
      totalNodes: this.storageNodes.length,
      activeNodes: activeNodes.length,
      nodes: this.storageNodes,
    };
  }
}

export const decentralizedStorageService = new DecentralizedStorageService();
