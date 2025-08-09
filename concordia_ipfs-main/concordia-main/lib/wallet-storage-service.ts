
import { ipfsService, GroupMetadata } from './ipfs-service'

const ADMIN_WALLET = '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'

interface WalletStorageIndex {
  [walletAddress: string]: {
    groups: string[]; // Array of IPFS hashes
    lastUpdated: string;
  }
}

interface GroupIndex {
  [groupId: string]: {
    ipfsHash: string;
    creator: string;
    members: string[];
    name: string;
    lastUpdated: string;
  }
}

class WalletStorageService {
  private storageIndexHash: string | null = null;
  private groupIndexHash: string | null = null;

  /**
   * Initialize storage indexes from IPFS
   */
  async initializeStorage(): Promise<void> {
    try {
      console.log('🔄 Initializing wallet storage service...');
      
      // Try to load existing indexes from a known IPFS hash
      // In production, this could be stored in a simple config or ENV var
      const knownIndexHash = process.env.NEXT_PUBLIC_STORAGE_INDEX_HASH;
      
      if (knownIndexHash) {
        this.storageIndexHash = knownIndexHash;
        console.log('✅ Storage service initialized with existing index');
      } else {
        // Create new indexes
        await this.createNewIndexes();
        console.log('✅ Storage service initialized with new indexes');
      }
    } catch (error) {
      console.error('❌ Failed to initialize storage service:', error);
      // Continue without existing data - will create new indexes
      await this.createNewIndexes();
    }
  }

  /**
   * Save group data and update all relevant indexes
   */
  async saveGroup(groupData: GroupMetadata, userAddress: string): Promise<{
    success: boolean;
    ipfsHash?: string;
    error?: string;
  }> {
    try {
      console.log('💾 Saving group with wallet storage:', groupData.groupId);

      // Check permissions
      if (!this.hasWriteAccess(groupData, userAddress)) {
        throw new Error('Access denied: You cannot modify this group');
      }

      // Store group data in IPFS
      const storeResult = await ipfsService.storeGroupData(
        groupData.groupId,
        groupData,
        userAddress
      );

      if (!storeResult.success) {
        throw new Error(storeResult.error || 'Failed to store group data');
      }

      // Update indexes
      await this.updateIndexes(groupData, storeResult.ipfsHash!, userAddress);

      console.log('✅ Group saved successfully:', storeResult.ipfsHash);
      return {
        success: true,
        ipfsHash: storeResult.ipfsHash
      };

    } catch (error) {
      console.error('❌ Error saving group:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Load all groups for a specific wallet
   */
  async loadUserGroups(userAddress: string): Promise<GroupMetadata[]> {
    try {
      console.log('👤 Loading groups for wallet:', userAddress);

      const isAdmin = userAddress.toLowerCase() === ADMIN_WALLET.toLowerCase();
      
      if (isAdmin) {
        return await this.loadAllGroupsAdmin();
      }

      const walletIndex = await this.getWalletIndex();
      const groupIndex = await this.getGroupIndex();
      
      const userEntry = walletIndex[userAddress.toLowerCase()];
      if (!userEntry || !userEntry.groups.length) {
        console.log('📭 No groups found for user');
        return [];
      }

      // Load all groups this user has access to
      const userGroups: GroupMetadata[] = [];
      
      for (const groupId in groupIndex) {
        const group = groupIndex[groupId];
        
        // Check if user is creator or member
        if (group.creator.toLowerCase() === userAddress.toLowerCase() ||
            group.members.some(member => member.toLowerCase() === userAddress.toLowerCase())) {
          
          try {
            const groupData = await this.loadGroupData(group.ipfsHash);
            if (groupData) {
              userGroups.push(groupData);
            }
          } catch (error) {
            console.warn('⚠️ Failed to load group:', groupId, error);
          }
        }
      }

      console.log('✅ Loaded user groups:', userGroups.length);
      return userGroups;

    } catch (error) {
      console.error('❌ Error loading user groups:', error);
      return [];
    }
  }

  /**
   * Load specific group data
   */
  async loadGroup(groupId: string, userAddress: string): Promise<{
    success: boolean;
    data?: GroupMetadata;
    error?: string;
  }> {
    try {
      console.log('📥 Loading group:', groupId, 'for user:', userAddress);

      const groupIndex = await this.getGroupIndex();
      const groupInfo = groupIndex[groupId];

      if (!groupInfo) {
        return { success: false, error: 'Group not found' };
      }

      // Check access permissions
      if (!this.hasReadAccess(groupInfo, userAddress)) {
        return { success: false, error: 'Access denied' };
      }

      const groupData = await this.loadGroupData(groupInfo.ipfsHash);
      if (!groupData) {
        return { success: false, error: 'Failed to load group data' };
      }

      console.log('✅ Group loaded successfully');
      return { success: true, data: groupData };

    } catch (error) {
      console.error('❌ Error loading group:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Join a group using group code
   */
  async joinGroup(groupCode: string, userAddress: string, nickname: string): Promise<{
    success: boolean;
    groupId?: string;
    error?: string;
  }> {
    try {
      console.log('🤝 Joining group with code:', groupCode);

      // Find group by code
      const groupId = await this.findGroupByCode(groupCode);
      if (!groupId) {
        return { success: false, error: 'Invalid group code' };
      }

      // Load current group data
      const loadResult = await this.loadGroup(groupId, ADMIN_WALLET); // Admin access to load group
      if (!loadResult.success || !loadResult.data) {
        return { success: false, error: 'Group not found' };
      }

      const groupData = loadResult.data;

      // Check if user is already a member
      const isAlreadyMember = groupData.members.some(
        member => member.address.toLowerCase() === userAddress.toLowerCase()
      );

      if (isAlreadyMember) {
        return { success: false, error: 'You are already a member of this group' };
      }

      // Check member limit
      if (groupData.members.length >= 10) {
        return { success: false, error: 'Group is full (maximum 10 members)' };
      }

      // Add new member
      const newMember = {
        address: userAddress,
        nickname: nickname,
        joinedAt: new Date().toISOString(),
        role: 'member' as const,
        contribution: 0,
        auraPoints: 0,
        hasVoted: false,
        status: 'active' as const
      };

      groupData.members.push(newMember);
      groupData.updatedAt = new Date().toISOString();

      // Save updated group
      const saveResult = await this.saveGroup(groupData, userAddress);
      if (!saveResult.success) {
        return { success: false, error: saveResult.error };
      }

      console.log('✅ Successfully joined group');
      return { success: true, groupId: groupData.groupId };

    } catch (error) {
      console.error('❌ Error joining group:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Generate and store group code
   */
  async generateGroupCode(groupId: string, creatorAddress: string): Promise<{
    success: boolean;
    code?: string;
    error?: string;
  }> {
    try {
      console.log('🔑 Generating group code for:', groupId);

      // Verify creator access
      const groupIndex = await this.getGroupIndex();
      const groupInfo = groupIndex[groupId];

      if (!groupInfo || groupInfo.creator.toLowerCase() !== creatorAddress.toLowerCase()) {
        const isAdmin = creatorAddress.toLowerCase() === ADMIN_WALLET.toLowerCase();
        if (!isAdmin) {
          return { success: false, error: 'Only group creator can generate codes' };
        }
      }

      // Generate 6-character code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Store code mapping in IPFS
      await this.storeGroupCode(code, groupId);

      console.log('✅ Group code generated:', code);
      return { success: true, code };

    } catch (error) {
      console.error('❌ Error generating group code:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Admin function: Load all groups
   */
  async loadAllGroupsAdmin(): Promise<GroupMetadata[]> {
    try {
      console.log('👑 Admin loading all groups');

      const groupIndex = await this.getGroupIndex();
      const allGroups: GroupMetadata[] = [];

      for (const groupInfo of Object.values(groupIndex)) {
        try {
          const groupData = await this.loadGroupData(groupInfo.ipfsHash);
          if (groupData) {
            allGroups.push(groupData);
          }
        } catch (error) {
          console.warn('⚠️ Failed to load group:', groupInfo, error);
        }
      }

      console.log('✅ Admin loaded all groups:', allGroups.length);
      return allGroups;

    } catch (error) {
      console.error('❌ Error loading all groups as admin:', error);
      return [];
    }
  }

  // Private helper methods

  private async createNewIndexes(): Promise<void> {
    const emptyWalletIndex: WalletStorageIndex = {};
    const emptyGroupIndex: GroupIndex = {};

    // Store empty indexes in IPFS
    const walletIndexResult = await ipfsService.storeGroupData(
      'wallet-index',
      { data: emptyWalletIndex, type: 'wallet-index' } as any,
      ADMIN_WALLET
    );

    const groupIndexResult = await ipfsService.storeGroupData(
      'group-index', 
      { data: emptyGroupIndex, type: 'group-index' } as any,
      ADMIN_WALLET
    );

    if (walletIndexResult.success && groupIndexResult.success) {
      this.storageIndexHash = walletIndexResult.ipfsHash!;
      this.groupIndexHash = groupIndexResult.ipfsHash!;
    }
  }

  private async getWalletIndex(): Promise<WalletStorageIndex> {
    if (!this.storageIndexHash) {
      return {};
    }

    try {
      const result = await ipfsService.getGroupData(this.storageIndexHash, ADMIN_WALLET);
      if (result.success && result.data) {
        return (result.data as any).data || {};
      }
    } catch (error) {
      console.warn('⚠️ Failed to load wallet index:', error);
    }
    
    return {};
  }

  private async getGroupIndex(): Promise<GroupIndex> {
    if (!this.groupIndexHash) {
      return {};
    }

    try {
      const result = await ipfsService.getGroupData(this.groupIndexHash, ADMIN_WALLET);
      if (result.success && result.data) {
        return (result.data as any).data || {};
      }
    } catch (error) {
      console.warn('⚠️ Failed to load group index:', error);
    }
    
    return {};
  }

  private async updateIndexes(
    groupData: GroupMetadata, 
    ipfsHash: string, 
    userAddress: string
  ): Promise<void> {
    // Update group index
    const groupIndex = await this.getGroupIndex();
    groupIndex[groupData.groupId] = {
      ipfsHash,
      creator: groupData.creator,
      members: groupData.members.map(m => m.address),
      name: groupData.name,
      lastUpdated: new Date().toISOString()
    };

    // Update wallet index for all members
    const walletIndex = await this.getWalletIndex();
    
    for (const member of groupData.members) {
      const memberAddress = member.address.toLowerCase();
      if (!walletIndex[memberAddress]) {
        walletIndex[memberAddress] = { groups: [], lastUpdated: new Date().toISOString() };
      }
      
      if (!walletIndex[memberAddress].groups.includes(groupData.groupId)) {
        walletIndex[memberAddress].groups.push(groupData.groupId);
        walletIndex[memberAddress].lastUpdated = new Date().toISOString();
      }
    }

    // Store updated indexes
    await this.storeIndexes(walletIndex, groupIndex);
  }

  private async storeIndexes(walletIndex: WalletStorageIndex, groupIndex: GroupIndex): Promise<void> {
    try {
      const walletIndexResult = await ipfsService.storeGroupData(
        'wallet-index',
        { data: walletIndex, type: 'wallet-index' } as any,
        ADMIN_WALLET
      );

      const groupIndexResult = await ipfsService.storeGroupData(
        'group-index',
        { data: groupIndex, type: 'group-index' } as any,
        ADMIN_WALLET
      );

      if (walletIndexResult.success && groupIndexResult.success) {
        this.storageIndexHash = walletIndexResult.ipfsHash!;
        this.groupIndexHash = groupIndexResult.ipfsHash!;
        
        // Log the new index hashes for reference
        console.log('📝 Updated storage indexes:');
        console.log('Wallet Index:', this.storageIndexHash);
        console.log('Group Index:', this.groupIndexHash);
      }
    } catch (error) {
      console.error('❌ Failed to store indexes:', error);
    }
  }

  private async loadGroupData(ipfsHash: string): Promise<GroupMetadata | null> {
    try {
      const result = await ipfsService.getGroupData(ipfsHash, ADMIN_WALLET);
      return result.success ? result.data || null : null;
    } catch (error) {
      console.error('❌ Failed to load group data:', error);
      return null;
    }
  }

  private async storeGroupCode(code: string, groupId: string): Promise<void> {
    // Store in a simple code-to-groupId mapping in IPFS
    const codeMapping = { [code]: groupId };
    await ipfsService.storeGroupData(
      `group-code-${code}`,
      { data: codeMapping, type: 'group-code' } as any,
      ADMIN_WALLET
    );
  }

  private async findGroupByCode(code: string): Promise<string | null> {
    try {
      const result = await ipfsService.getGroupData(`group-code-${code}`, ADMIN_WALLET);
      if (result.success && result.data) {
        const mapping = (result.data as any).data;
        return mapping[code] || null;
      }
    } catch (error) {
      console.warn('⚠️ Group code not found:', code);
    }
    return null;
  }

  private hasWriteAccess(groupData: any, userAddress: string): boolean {
    const isAdmin = userAddress.toLowerCase() === ADMIN_WALLET.toLowerCase();
    const isCreator = groupData.creator?.toLowerCase() === userAddress.toLowerCase();
    const isMember = groupData.members?.some((m: any) => 
      m.address?.toLowerCase() === userAddress.toLowerCase()
    );

    return isAdmin || isCreator || isMember;
  }

  private hasReadAccess(groupInfo: any, userAddress: string): boolean {
    const isAdmin = userAddress.toLowerCase() === ADMIN_WALLET.toLowerCase();
    const isCreator = groupInfo.creator?.toLowerCase() === userAddress.toLowerCase();
    const isMember = groupInfo.members?.some((address: string) => 
      address.toLowerCase() === userAddress.toLowerCase()
    );

    return isAdmin || isCreator || isMember;
  }
}

export const walletStorageService = new WalletStorageService();
