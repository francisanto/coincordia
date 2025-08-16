// types/group.ts

export interface GroupMetadata {
    id: string;
    name: string;
    description: string;
    goalAmount: number;
    dueDay: number;
    duration: number;
    withdrawalDate: number;
    creator: string;
    isActive: boolean;
    createdAt: number;
    totalContributions: number;
    memberCount: number;
  }
  