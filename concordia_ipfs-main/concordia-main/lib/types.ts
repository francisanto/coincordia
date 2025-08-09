
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
