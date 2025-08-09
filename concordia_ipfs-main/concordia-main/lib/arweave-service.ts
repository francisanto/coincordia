import Arweave from 'arweave';

// Types from the original IPFS service for compatibility
export interface GroupMetadata {
  groupId: string;
  name: string;
  description?: string;
  creator: string;
  members: MemberData[];
  contributions?: ContributionData[];
  settings?: GroupSettings;
  blockchain?: BlockchainData;
  arweave?: ArweaveData;
  createdAt: string;
  updatedAt: string;
}

export interface MemberData {
  address: string;
  nickname?: string;
  joinedAt: string;
  role: 'admin' | 'member';
  status: 'active' | 'inactive';
}

export interface ContributionData {
  id: string;
  contributor: string;
  amount: string;
  timestamp: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface GroupSettings {
  visibility: 'public' | 'private';
  joinType: 'open' | 'invite' | 'request';
  contributionPolicy: 'equal' | 'merit' | 'custom';
  votingThreshold: number;
  customSettings?: Record<string, any>;
}

export interface BlockchainData {
  chainId: string;
  contractAddress?: string;
  tokenAddress?: string;
  transactionHash?: string;
  blockNumber?: string;
  gasUsed?: string;
  network?: string;
}

export interface ArweaveData {
  transactionId: string;
  owner: string;
  lastUpdated: string;
}

export class ArweaveService {
  private arweave: Arweave;
  private adminAddress: string;

  constructor() {
    // Initialize Arweave client
    this.arweave = Arweave.init({
      host: 'arweave.net',
      port: 443,
      protocol: 'https'
    });
    
    this.adminAddress = '0xdA13e8F82C83d14E7aa639354054B7f914cA0998';
  }

  /**
   * Store group data on Arweave
   */
  async storeGroupData(groupId: string, groupData: Partial<GroupMetadata>, userAddress: string): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> {
    try {
      console.log('📤 Storing group data on Arweave:', { groupId, userAddress });

      // Check if user has permission to store data
      if (!this.hasWriteAccess(groupData, userAddress)) {
        throw new Error('Access denied: You cannot modify this group');
      }

      const updatedGroupData = {
        ...groupData,
        updatedAt: new Date().toISOString(),
        arweave: {
          transactionId: '',
          owner: userAddress,
          lastUpdated: new Date().toISOString(),
        },
      };

      // Get the Arweave key from environment variables
      const arweaveKeyString = process.env.ARWEAVE_KEY;
      if (!arweaveKeyString) {
        throw new Error('Arweave key not found in environment variables');
      }

      // Parse the JWK from the environment variable
      let key;
      try {
        key = JSON.parse(arweaveKeyString);
      } catch (e) {
        throw new Error('Invalid Arweave key format. Must be a valid JSON string.');
      }

      // Create a transaction with the group data
      const transaction = await this.arweave.createTransaction({
        data: JSON.stringify(updatedGroupData)
      }, key);

      // Add tags for easier querying
      transaction.addTag('Content-Type', 'application/json');
      transaction.addTag('App-Name', 'Concordia');
      transaction.addTag('Group-ID', groupId);
      transaction.addTag('User-Address', userAddress);
      transaction.addTag('Timestamp', new Date().toISOString());

      // Sign the transaction
      await this.arweave.transactions.sign(transaction, key);

      // Submit the transaction to the network
      const response = await this.arweave.transactions.post(transaction);

      if (response.status !== 200 && response.status !== 202) {
        throw new Error(`Failed to submit transaction: ${response.statusText}`);
      }

      const transactionId = transaction.id;
      console.log('✅ Group data stored on Arweave with transaction ID:', transactionId);
      
      return {
        success: true,
        transactionId,
      };
    } catch (error) {
      console.error('❌ Error storing group data on Arweave:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Retrieve group data from Arweave
   */
  async getGroupData(transactionId: string, userAddress?: string): Promise<{
    success: boolean;
    data?: GroupMetadata;
    error?: string;
  }> {
    try {
      console.log('📥 Retrieving group data from Arweave:', transactionId);

      // Get transaction data from Arweave
      const transaction = await this.arweave.transactions.get(transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Get the data from the transaction
      const data = await transaction.get('data', { decode: true, string: true });
      if (!data) {
        throw new Error('No data found in transaction');
      }

      // Parse the JSON data
      let groupData;
      try {
        groupData = JSON.parse(data as string) as GroupMetadata;
      } catch (e) {
        throw new Error('Invalid JSON data in transaction');
      }

      console.log('✅ Group data retrieved from Arweave');
      return {
        success: true,
        data: groupData,
      };
    } catch (error) {
      console.error('❌ Error retrieving group data from Arweave:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get user's groups from Arweave
   */
  async getUserGroups(userAddress: string): Promise<{
    success: boolean;
    groups?: GroupMetadata[];
    error?: string;
  }> {
    try {
      console.log('📥 Retrieving user groups from Arweave:', userAddress);

      // Query Arweave GraphQL for transactions with the user's address tag
      const query = `
        query {
          transactions(
            tags: [
              { name: "App-Name", values: ["Concordia"] },
              { name: "User-Address", values: ["${userAddress}"] }
            ],
            sort: TIMESTAMP_DESC
          ) {
            edges {
              node {
                id
                tags {
                  name
                  value
                }
              }
            }
          }
        }
      `;

      const response = await fetch('https://arweave.net/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.statusText}`);
      }

      const result = await response.json();
      const transactions = result.data?.transactions?.edges || [];

      // Fetch group data for each transaction
      const groups: GroupMetadata[] = [];
      const processedIds = new Set<string>(); // To avoid duplicates

      for (const edge of transactions) {
        const transactionId = edge.node.id;
        
        // Skip if we've already processed this transaction
        if (processedIds.has(transactionId)) continue;
        processedIds.add(transactionId);

        try {
          const groupResult = await this.getGroupData(transactionId);
          if (groupResult.success && groupResult.data) {
            groups.push(groupResult.data);
          }
        } catch (error) {
          console.warn(`Failed to fetch group data for transaction ${transactionId}:`, error);
          // Continue with other transactions
        }
      }

      console.log(`✅ Retrieved ${groups.length} groups for user from Arweave`);
      return {
        success: true,
        groups: groups,
      };
    } catch (error) {
      console.error('❌ Error retrieving user groups from Arweave:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        groups: [],
      };
    }
  }

  /**
   * Join a group stored on Arweave
   */
  async joinGroup(transactionId: string, userAddress: string, nickname: string): Promise<{
    success: boolean;
    newTransactionId?: string;
    error?: string;
  }> {
    try {
      console.log('🤝 User joining group:', { transactionId, userAddress, nickname });

      // Get the group data
      const groupResult = await this.getGroupData(transactionId);
      
      if (!groupResult.success || !groupResult.data) {
        throw new Error(groupResult.error || 'Failed to retrieve group data');
      }

      const groupData = groupResult.data;

      // Check if user is already a member
      const existingMember = groupData.members.find(m => m.address.toLowerCase() === userAddress.toLowerCase());
      
      if (existingMember) {
        return {
          success: true,
          newTransactionId: transactionId,
        };
      }

      // Add user to members
      const updatedGroupData = {
        ...groupData,
        members: [
          ...groupData.members,
          {
            address: userAddress,
            nickname: nickname || `Member-${groupData.members.length + 1}`,
            joinedAt: new Date().toISOString(),
            role: 'member',
            status: 'active',
          },
        ],
      };

      // Store updated group data
      const storeResult = await this.storeGroupData(
        groupData.groupId,
        updatedGroupData,
        userAddress
      );

      if (!storeResult.success) {
        throw new Error(storeResult.error || 'Failed to update group data');
      }

      return {
        success: true,
        newTransactionId: storeResult.transactionId,
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
   * Check if user has write access to the group
   */
  hasWriteAccess(groupData: Partial<GroupMetadata>, userAddress: string): boolean {
    // Admin always has access
    if (userAddress.toLowerCase() === this.adminAddress.toLowerCase()) {
      return true;
    }

    // Creator has access
    if (groupData.creator && groupData.creator.toLowerCase() === userAddress.toLowerCase()) {
      return true;
    }

    // Admin members have access
    if (groupData.members) {
      const isAdmin = groupData.members.some(
        member => 
          member.address.toLowerCase() === userAddress.toLowerCase() && 
          member.role === 'admin' &&
          member.status === 'active'
      );
      
      if (isAdmin) {
        return true;
      }
    }

    // For new groups, allow access
    if (!groupData.groupId || !groupData.creator) {
      return true;
    }

    return false;
  }

  /**
   * Create group metadata object
   */
  createGroupMetadata(params: {
    name: string;
    description?: string;
    creator: string;
  }): GroupMetadata {
    const timestamp = new Date().toISOString();
    const groupId = `group-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    return {
      groupId,
      name: params.name,
      description: params.description || '',
      creator: params.creator,
      members: [
        {
          address: params.creator,
          nickname: 'Creator',
          joinedAt: timestamp,
          role: 'admin',
          status: 'active',
        },
      ],
      contributions: [],
      settings: {
        visibility: 'public',
        joinType: 'open',
        contributionPolicy: 'equal',
        votingThreshold: 51,
      },
      arweave: {
        transactionId: '',
        owner: params.creator,
        lastUpdated: timestamp,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  /**
   * Get Arweave transaction URL
   */
  getTransactionUrl(transactionId: string): string {
    return `https://viewblock.io/arweave/tx/${transactionId}`;
  }

  /**
   * Get multiple explorer URLs for redundancy
   */
  getAllExplorerUrls(transactionId: string): string[] {
    return [
      `https://viewblock.io/arweave/tx/${transactionId}`,
      `https://arweave.net/${transactionId}`,
      `https://arweave.app/tx/${transactionId}`,
    ];
  }

  // Private helper methods for simulation

  private async simulateArweaveTransaction(data: string): Promise<{ id: string }> {
    // Generate a mock transaction ID
    const mockId = `AR${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}`;
    
    // In a real implementation, you would:
    // 1. Create a transaction with this.arweave.createTransaction({ data })
    // 2. Sign it with a wallet
    // 3. Submit it to the network
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { id: mockId };
  }

  private async simulateArweaveRetrieval(transactionId: string): Promise<GroupMetadata | null> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate mock data based on the transaction ID
    // In a real implementation, you would fetch the actual data from Arweave
    const mockData: GroupMetadata = {
      groupId: `group-${transactionId.substring(2, 8)}`,
      name: `Test Group ${transactionId.substring(2, 5)}`,
      description: 'A test group stored on Arweave',
      creator: this.adminAddress,
      members: [
        {
          address: this.adminAddress,
          nickname: 'Creator',
          joinedAt: new Date(Date.now() - 86400000).toISOString(),
          role: 'admin',
          status: 'active',
        },
      ],
      contributions: [],
      settings: {
        visibility: 'public',
        joinType: 'open',
        contributionPolicy: 'equal',
        votingThreshold: 51,
      },
      arweave: {
        transactionId,
        owner: this.adminAddress,
        lastUpdated: new Date(Date.now() - 86400000).toISOString(),
      },
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    };
    
    return mockData;
  }

  private async simulateFetchUserGroups(userAddress: string): Promise<GroupMetadata[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate mock groups
    // In a real implementation, you would query Arweave for transactions by the user
    const mockGroups: GroupMetadata[] = [
      {
        groupId: `group-${Date.now()}-1`,
        name: 'My First Group',
        description: 'A test group stored on Arweave',
        creator: userAddress,
        members: [
          {
            address: userAddress,
            nickname: 'Creator',
            joinedAt: new Date(Date.now() - 86400000).toISOString(),
            role: 'admin',
            status: 'active',
          },
        ],
        contributions: [],
        settings: {
          visibility: 'public',
          joinType: 'open',
          contributionPolicy: 'equal',
          votingThreshold: 51,
        },
        arweave: {
          transactionId: `AR${Date.now().toString(36)}1`,
          owner: userAddress,
          lastUpdated: new Date(Date.now() - 86400000).toISOString(),
        },
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        groupId: `group-${Date.now()}-2`,
        name: 'My Second Group',
        description: 'Another test group stored on Arweave',
        creator: this.adminAddress,
        members: [
          {
            address: this.adminAddress,
            nickname: 'Creator',
            joinedAt: new Date(Date.now() - 172800000).toISOString(),
            role: 'admin',
            status: 'active',
          },
          {
            address: userAddress,
            nickname: 'Member',
            joinedAt: new Date(Date.now() - 86400000).toISOString(),
            role: 'member',
            status: 'active',
          },
        ],
        contributions: [],
        settings: {
          visibility: 'public',
          joinType: 'open',
          contributionPolicy: 'equal',
          votingThreshold: 51,
        },
        arweave: {
          transactionId: `AR${Date.now().toString(36)}2`,
          owner: this.adminAddress,
          lastUpdated: new Date(Date.now() - 86400000).toISOString(),
        },
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
    
    return mockGroups;
  }
}

// Export singleton instance
export const arweaveService = new ArweaveService();