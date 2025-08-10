// MongoDB storage service for Concordia groups
import { type GroupMetadata } from '@/types/group';

class MongoDBStorageService {
  async loadGroups(userAddress?: string): Promise<GroupMetadata[]> {
    // Only load groups the user has access to
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      if (!apiUrl) {
        console.error('❌ API URL not configured properly');
        return [];
      }
      
      if (!userAddress) {
        console.log('❌ No user address provided, cannot load groups');
        return [];
      }
      
      console.log('🔄 Loading groups for user:', userAddress);
      const response = await fetch(`${apiUrl}/groups?address=${userAddress}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.groups && Array.isArray(result.groups)) {
          if (result.groups.length > 0) {
            console.log('✅ Successfully loaded user groups from MongoDB:', result.groups.length);
          } else {
            console.log('📭 No groups found for user:', userAddress);
          }
          return result.groups;
        } else {
          console.error('❌ Invalid response format from API');
          return [];
        }
      } else if (response.status === 403) {
        console.log('🔒 Access denied for user:', userAddress);
        return [];
      } else {
        console.error('❌ API request failed with status:', response.status);
        return [];
      }
    } catch (error) {
      console.error('❌ Error loading groups from MongoDB:', error);
      return [];
    }
  }

  async getGroup(groupId: string, userAddress?: string): Promise<{ metadata: GroupMetadata; fullData?: any } | null> {
    // Only load group if user has access
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      if (!apiUrl) {
        console.error('❌ API URL not configured properly');
        return null;
      }
      
      if (!userAddress) {
        console.log('❌ No user address provided, cannot access group');
        return null;
      }
      
      console.log('🔄 Loading group details:', groupId, 'for user:', userAddress);
      
      // First check if user has access to this group
      const accessResponse = await fetch(`${apiUrl}/groups/${groupId}/access?address=${userAddress}`);
      
      if (!accessResponse.ok) {
        console.error('❌ Failed to check access rights:', accessResponse.status);
        return null;
      }
      
      const accessResult = await accessResponse.json();
      
      if (!accessResult.canRead) {
        console.log('🔒 User does not have read access to group:', groupId);
        return null;
      }
      
      // User has access, load the group data
      const response = await fetch(`${apiUrl}/groups/${groupId}`, {
        headers: {
          'User-Address': userAddress,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.metadata) {
          console.log('✅ Successfully loaded group from MongoDB:', groupId);
          return { metadata: result.metadata, fullData: result.metadata };
        }
      }
      
      console.log('❌ Group not found or access denied:', groupId);
      return null;
    } catch (error) {
      console.error('❌ Error loading group from MongoDB:', error);
      return null;
    }
  }

  async saveGroup(groupData: any, userAddress: string): Promise<boolean> {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      if (!apiUrl) {
        console.error('❌ API URL not configured properly');
        return false;
      }
      
      if (!userAddress) {
        console.error('❌ No user address provided');
        return false;
      }
      
      console.log('💾 Saving group to MongoDB:', groupData.name || groupData.id);
      
      const response = await fetch(`${apiUrl}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Address': userAddress,
        },
        body: JSON.stringify(groupData),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ Successfully saved group to MongoDB');
          return true;
        } else {
          console.error('❌ Failed to save group:', result.error);
          return false;
        }
      } else {
        console.error('❌ API request failed with status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Error saving group to MongoDB:', error);
      return false;
    }
  }

  async joinGroup(groupId: string, userAddress: string, nickname: string): Promise<boolean> {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      if (!apiUrl) {
        console.error('❌ API URL not configured properly');
        return false;
      }
      
      if (!groupId) {
        console.error('❌ Invalid group ID provided');
        return false;
      }
      
      if (!userAddress) {
        console.error('❌ Invalid user address provided');
        return false;
      }
      
      console.log('🤝 Joining group:', groupId, 'user:', userAddress);
      
      const response = await fetch(`${apiUrl}/groups/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId,
          userAddress,
          nickname: nickname || 'Anonymous',
        }),
      });
      
      if (!response.ok) {
        console.error('❌ API request failed with status:', response.status);
        return false;
      }
      
      const result = await response.json();
      if (result.success) {
        console.log('✅ Successfully joined group');
        return true;
      } else {
        console.error('❌ Failed to join group:', result.error || 'Unknown error');
        return false;
      }
    } catch (error) {
      console.error('❌ Error joining group:', error);
      return false;
    }
  }

  async deleteGroup(groupId: string, userAddress: string): Promise<boolean> {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      if (!apiUrl) {
        console.error('❌ API URL not configured properly');
        return false;
      }
      
      if (!userAddress) {
        console.error('❌ No user address provided');
        return false;
      }
      
      console.log('🗑️ Deleting group from MongoDB:', groupId);
      
      const response = await fetch(`${apiUrl}/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'User-Address': userAddress,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ Successfully deleted group from MongoDB');
          return true;
        } else {
          console.error('❌ Failed to delete group:', result.error);
          return false;
        }
      } else {
        console.error('❌ API request failed with status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Error deleting group from MongoDB:', error);
      return false;
    }
  }

  async getAllGroupsAdmin(adminKey: string): Promise<GroupMetadata[]> {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      if (!apiUrl) {
        console.error('❌ API URL not configured properly');
        return [];
      }
      
      console.log('🔑 Loading all groups as admin');
      
      const response = await fetch(`${apiUrl}/admin/groups`, {
        headers: {
          'Admin-Key': adminKey,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.groups && Array.isArray(result.groups)) {
          console.log('✅ Successfully loaded all groups as admin:', result.groups.length);
          return result.groups;
        } else {
          console.error('❌ Invalid response format from admin API');
          return [];
        }
      } else {
        console.error('❌ Admin API request failed with status:', response.status);
        return [];
      }
    } catch (error) {
      console.error('❌ Error loading groups as admin:', error);
      return [];
    }
  }
}

export const mongodbStorageService = new MongoDBStorageService();
