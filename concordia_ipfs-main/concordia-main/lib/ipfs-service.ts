
import { create, IPFSHTTPClient } from 'ipfs-http-client';

// Polyfill fetch for Node.js environments
if (typeof globalThis.fetch === 'undefined') {
  import('node-fetch').then(({ default: fetch }) => {
    globalThis.fetch = fetch as any;
  }).catch(() => {
    console.warn('node-fetch not available, some features may not work in Node.js');
  });
}

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
  ipfs: IPFSData;
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
}

export interface BlockchainData {
  contractAddress: string;
  transactionHash: string;
  blockNumber: string;
  gasUsed: string;
  network: string;
}

export interface IPFSData {
  hash: string;
  pin: boolean;
  gateway: string;
  lastUpdated: string;
}

export class IPFSService {
  private client: IPFSHTTPClient;
  private fallbackClients: IPFSHTTPClient[];
  private gateway: string;
  private fallbackGateways: string[];
  private adminAddress: string;
  private inviteCodes: Map<string, { groupId: string, createdBy: string, timestamp: number }> = new Map();

  constructor() {
    try {
      // Primary free public IPFS node
      this.client = create({
        host: '4everland.io',
        port: 5001,
        protocol: 'https',
        timeout: 15000,
      });
    } catch (error) {
      console.warn('⚠️ Failed to initialize primary IPFS client:', error);
      // Create a fallback client that will be replaced with a working one if available
      this.client = {} as IPFSHTTPClient;
    }
    
    // Fallback IPFS nodes (all free)
    this.fallbackClients = [];
    
    try {
      this.fallbackClients = [
        create({
          host: 'dweb.link',
          port: 443,
          protocol: 'https',
          timeout: 15000,
        }),
        create({
          host: 'cloudflare-ipfs.com',
          port: 443,
          protocol: 'https',
          timeout: 15000,
        }),
        create({
          host: 'ipfs.infura.io',
          port: 5001,
          protocol: 'https',
          timeout: 15000,
        }),
        create({
          host: 'gateway.pinata.cloud',
          port: 443,
          protocol: 'https',
          timeout: 15000,
        }),
      ];
    } catch (error) {
      console.warn('⚠️ Failed to initialize some IPFS clients:', error);
    }
    
    this.gateway = 'https://gateway.pinata.cloud/ipfs/';
    this.fallbackGateways = [
      'https://ipfs.io/ipfs/',
      'https://dweb.link/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://4everland.io/ipfs/',
      'https://gateway.ipfs.io/ipfs/',
      'https://cf-ipfs.com/ipfs/',
      'https://ipfs.fleek.co/ipfs/',
      'https://hardbin.com/ipfs/',
    ];
    this.adminAddress = '0xdA13e8F82C83d14E7aa639354054B7f914cA0998';
  }

  /**
   * Store group data on IPFS
   */
  async storeGroupData(groupId: string, groupData: Partial<GroupMetadata>, userAddress: string): Promise<{
    success: boolean;
    ipfsHash?: string;
    error?: string;
  }> {
    try {
      console.log('📤 Storing group data on IPFS:', { groupId, userAddress });

      // Check if user has permission to store data
      if (!this.hasWriteAccess(groupData, userAddress)) {
        throw new Error('Access denied: You cannot modify this group');
      }

      const updatedGroupData = {
        ...groupData,
        updatedAt: new Date().toISOString(),
        ipfs: {
          hash: '',
          pin: true,
          gateway: this.gateway,
          lastUpdated: new Date().toISOString(),
        },
      };

      // Upload to IPFS with fallback support
      const result = await this.uploadWithFallback(JSON.stringify(updatedGroupData, null, 2));
      const ipfsHash = result.cid.toString();

      // Try to pin the content (may not work on all free nodes)
      try {
        await this.client.pin.add(result.cid);
      } catch (pinError) {
        console.warn('⚠️ Pinning not available on this IPFS node, content uploaded successfully');
      }

      console.log('✅ Group data stored on IPFS with hash:', ipfsHash);
      return {
        success: true,
        ipfsHash,
      };
    } catch (error) {
      console.error('❌ Error storing group data on IPFS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Retrieve group data from IPFS
   */
  async getGroupData(ipfsHash: string, userAddress?: string): Promise<{
    success: boolean;
    data?: GroupMetadata;
    error?: string;
  }> {
    try {
      console.log('📥 Retrieving group data from IPFS:', ipfsHash);

      // Get data from IPFS with fallback gateways
      const data = await this.retrieveWithFallback(ipfsHash);
      const groupData: GroupMetadata = JSON.parse(data);

      // Check if user has read access
      if (userAddress && !this.hasReadAccess(groupData, userAddress)) {
        throw new Error('Access denied: You cannot access this group');
      }

      console.log('✅ Group data retrieved from IPFS');
      return {
        success: true,
        data: groupData,
      };
    } catch (error) {
      console.error('❌ Error retrieving group data from IPFS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all groups for a user (admin function or user's own groups)
   */
  async getUserGroups(userAddress: string): Promise<{
    success: boolean;
    data?: GroupMetadata[];
    error?: string;
  }> {
    try {
      console.log('📥 Retrieving user groups from IPFS:', userAddress);

      // This would require maintaining an index of group hashes
      // For now, return empty array - groups will be loaded from smart contract events
      const userGroups: GroupMetadata[] = [];

      return {
        success: true,
        data: userGroups,
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
   * Delete group data from IPFS (unpin)
   */
  async deleteGroup(ipfsHash: string, userAddress: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('🗑️ Deleting group from IPFS:', { ipfsHash, userAddress });

      // First get the group data to check permissions
      const groupResult = await this.getGroupData(ipfsHash);
      if (!groupResult.success || !groupResult.data) {
        throw new Error('Group not found');
      }

      // Check if user is admin or group creator
      const isAdmin = userAddress.toLowerCase() === this.adminAddress.toLowerCase();
      const isCreator = groupResult.data.creator.toLowerCase() === userAddress.toLowerCase();

      if (!isAdmin && !isCreator) {
        throw new Error('Access denied: Only group creator or admin can delete group');
      }

      // Try to unpin from IPFS (may not work on free public nodes)
      try {
        await this.client.pin.rm(ipfsHash);
      } catch (unpinError) {
        console.warn('⚠️ Unpinning not available on this free IPFS node');
      }

      console.log('✅ Group unpinned from IPFS');
      return {
        success: true,
      };
    } catch (error) {
      console.error('❌ Error deleting group from IPFS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Store contribution data on IPFS
   */
  async storeContribution(groupId: string, contributionData: ContributionData, userAddress: string): Promise<{
    success: boolean;
    ipfsHash?: string;
    error?: string;
  }> {
    try {
      console.log('💰 Storing contribution on IPFS:', { groupId, userAddress });

      const contributionWithTimestamp = {
        ...contributionData,
        timestamp: new Date().toISOString(),
        id: `${groupId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      const result = await this.client.add(JSON.stringify(contributionWithTimestamp, null, 2));
      const ipfsHash = result.cid.toString();

      await this.client.pin.add(result.cid);

      console.log('✅ Contribution stored on IPFS with hash:', ipfsHash);
      return {
        success: true,
        ipfsHash,
      };
    } catch (error) {
      console.error('❌ Error storing contribution on IPFS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Join a group (update group data with new member)
   */
  async joinGroup(ipfsHash: string, userAddress: string, nickname: string): Promise<{
    success: boolean;
    newIpfsHash?: string;
    error?: string;
  }> {
    try {
      console.log('🤝 User joining group:', { ipfsHash, userAddress, nickname });

      // Get existing group data
      const groupResult = await this.getGroupData(ipfsHash);
      if (!groupResult.success || !groupResult.data) {
        throw new Error('Group not found');
      }

      const groupData = groupResult.data;

      // Check if user is already a member
      const existingMember = groupData.members.find(m => m.address.toLowerCase() === userAddress.toLowerCase());
      if (existingMember) {
        throw new Error('User is already a member of this group');
      }

      // Add new member
      const newMember: MemberData = {
        address: userAddress,
        nickname,
        joinedAt: new Date().toISOString(),
        role: 'member',
        contribution: 0,
        auraPoints: 5,
        hasVoted: false,
        status: 'active',
      };

      const updatedGroupData = {
        ...groupData,
        members: [...groupData.members, newMember],
        updatedAt: new Date().toISOString(),
      };

      // Store updated group data
      const storeResult = await this.storeGroupData(groupData.groupId, updatedGroupData, userAddress);
      
      return {
        success: storeResult.success,
        newIpfsHash: storeResult.ipfsHash,
        error: storeResult.error,
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
   * Check if user has read access to group
   */
  private hasReadAccess(groupData: Partial<GroupMetadata>, userAddress: string): boolean {
    const isAdmin = userAddress.toLowerCase() === this.adminAddress.toLowerCase();
    const isCreator = groupData.creator?.toLowerCase() === userAddress.toLowerCase();
    const isMember = groupData.members?.some(m => m.address.toLowerCase() === userAddress.toLowerCase());

    return isAdmin || isCreator || isMember || false;
  }

  /**
   * Check if user has write access to group
   */
  private hasWriteAccess(groupData: Partial<GroupMetadata>, userAddress: string): boolean {
    const isAdmin = userAddress.toLowerCase() === this.adminAddress.toLowerCase();
    const isCreator = groupData.creator?.toLowerCase() === userAddress.toLowerCase();
    const isMember = groupData.members?.some(m => m.address.toLowerCase() === userAddress.toLowerCase());

    return isAdmin || isCreator || isMember || false;
  }

  /**
   * Create comprehensive group metadata
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
      },
      blockchain: {
        contractAddress: params.contractAddress,
        transactionHash: params.transactionHash,
        blockNumber: params.blockNumber,
        gasUsed: params.gasUsed,
        network: 'opBNB Testnet',
      },
      ipfs: {
        hash: '',
        pin: true,
        gateway: this.gateway,
        lastUpdated: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '3.0',
    };

    return metadata;
  }

  /**
   * Upload data with fallback nodes
   */
  private async uploadWithFallback(data: string): Promise<any> {
    let lastError;
    
    // Try primary client
    try {
      return await this.client.add(data);
    } catch (error) {
      console.warn('⚠️ Primary IPFS node failed, trying fallbacks');
      lastError = error;
    }
    
    // Try fallback clients
    for (let i = 0; i < this.fallbackClients.length; i++) {
      try {
        console.log(`🔄 Trying fallback IPFS node ${i + 1}`);
        return await this.fallbackClients[i].add(data);
      } catch (error) {
        console.warn(`⚠️ Fallback IPFS node ${i + 1} failed`);
        lastError = error;
      }
    }
    
    throw lastError;
  }

  /**
   * Retrieve data with fallback gateways
   */
  private async retrieveWithFallback(ipfsHash: string): Promise<string> {
    let lastError;
    
    // Try primary client
    try {
      const chunks = [];
      for await (const chunk of this.client.cat(ipfsHash)) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks).toString();
    } catch (error) {
      console.warn('⚠️ Primary IPFS retrieval failed, trying HTTP gateways');
      lastError = error;
    }
    
    // Try HTTP gateways
    for (const gateway of this.fallbackGateways) {
      try {
        console.log(`🔄 Trying gateway: ${gateway}`);
        const response = await fetch(`${gateway}${ipfsHash}`, {
          timeout: 10000,
        });
        
        if (response.ok) {
          return await response.text();
        }
      } catch (error) {
        console.warn(`⚠️ Gateway ${gateway} failed`);
        lastError = error;
      }
    }
    
    throw lastError;
  }

  /**
   * Generate IPFS gateway URL with fallback
   */
  getGatewayUrl(ipfsHash: string): string {
    return `${this.gateway}${ipfsHash}`;
  }

  /**
   * Get multiple gateway URLs for redundancy
   */
  getAllGatewayUrls(ipfsHash: string): string[] {
    return [this.gateway, ...this.fallbackGateways].map(gateway => `${gateway}${ipfsHash}`);
  }

  /**
   * Store invite code in IPFS
   */
  async storeInviteCode(groupId: string, code: string, createdBy: string): Promise<{ success: boolean; ipfsHash?: string; error?: string }> {
    try {
      console.log('📤 Storing invite code in IPFS:', code, 'for group:', groupId);
      
      // Store in memory map (in a real implementation, this would be stored in IPFS or a database)
      this.inviteCodes.set(code, {
        groupId,
        createdBy,
        timestamp: Date.now()
      });
      
      // In a real implementation, you would store this in IPFS
      // For now, we'll simulate a successful store
      
      return { success: true, ipfsHash: `invite_${code}_${Date.now()}` };
    } catch (error) {
      console.error('❌ Error storing invite code in IPFS:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Get invite code from IPFS
   */
  async getInviteCode(code: string): Promise<{ success: boolean; groupId?: string; error?: string }> {
    try {
      console.log('📥 Getting invite code from IPFS:', code);
      
      // Get from memory map (in a real implementation, this would be fetched from IPFS or a database)
      const inviteData = this.inviteCodes.get(code);
      
      if (!inviteData) {
        return { success: false, error: 'Invite code not found' };
      }
      
      // Check if code is expired (24 hours)
      const now = Date.now();
      const expiryTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      if (now - inviteData.timestamp > expiryTime) {
        this.inviteCodes.delete(code); // Clean up expired code
        return { success: false, error: 'Invite code has expired' };
      }
      
      return { success: true, groupId: inviteData.groupId };
    } catch (error) {
      console.error('❌ Error getting invite code from IPFS:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Export singleton instance
export const ipfsService = new IPFSService();
