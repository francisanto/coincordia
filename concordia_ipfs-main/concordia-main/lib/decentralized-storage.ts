
import { arweaveService, GroupMetadata } from './arweave-service'
import connectToDatabase from './mongodb'
import Group from './models/Group'

const ADMIN_WALLET = '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'

interface StorageNode {
  name: string;
  endpoint: string;
  type: 'mongodb' | 'arweave' | 'sia';
  isActive: boolean;
}

class DecentralizedStorageService {
  private storageNodes: StorageNode[] = [
    {
      name: 'MongoDB Primary',
      endpoint: process.env.MONGODB_URI || 'mongodb://localhost:27017/concordia',
      type: 'mongodb',
      isActive: true,
    },
    {
      name: 'Arweave Mainnet',
      endpoint: 'https://arweave.net',
      type: 'arweave',
      isActive: true,
    },
  ];

  async storeGroupData(groupData: any, userAddress: string): Promise<{
    success: boolean;
    groupId?: string;
    error?: string;
  }> {
    try {
      // Check access permissions
      if (!this.hasWriteAccess(groupData, userAddress)) {
        throw new Error('Access denied: You cannot store data for this group');
      }

      console.log('🔄 Storing group data in MongoDB...');
      
      // Connect to MongoDB
      await connectToDatabase();
      
      // Check if group already exists
      let group = await Group.findOne({ groupId: groupData.groupId });
      
      if (group) {
        // Update existing group
        Object.assign(group, groupData);
        group.updatedAt = new Date().toISOString();
      } else {
        // Create new group
        group = new Group({
          ...groupData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      await group.save();

      console.log('✅ Data stored successfully in MongoDB');

      return {
        success: true,
        groupId: groupData.groupId
      };
    } catch (error) {
      console.error('❌ Error storing group data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async loadGroupData(groupId: string, userAddress: string): Promise<{
    success: boolean;
    data?: GroupMetadata;
    error?: string;
  }> {
    try {
      console.log('🔄 Loading group data from MongoDB...');
      
      // Connect to MongoDB
      await connectToDatabase();
      
      // Find group by groupId
      const group = await Group.findOne({ groupId });
      
      if (!group) {
        throw new Error('Group not found');
      }

      // Verify user has read access
      if (!this.hasReadAccess(group.toObject(), userAddress)) {
        throw new Error('Access denied: You cannot access this group');
      }

      console.log('✅ Group data loaded successfully');
      return {
        success: true,
        data: group.toObject()
      };
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
      
      // Connect to MongoDB
      await connectToDatabase();
      
      // Find groups where user is creator or member
      const groups = await Group.find({
        $or: [
          { creator: userAddress.toLowerCase() },
          { 'members.address': userAddress.toLowerCase() }
        ]
      });
      
      return groups.map(group => group.toObject());
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
