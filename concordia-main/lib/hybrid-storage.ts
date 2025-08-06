
// All data is stored in Greenfield with proper bucket-based access control
import { GroupMetadata } from './simple-storage';

class HybridStorageService {
  async loadGroups(userAddress?: string): Promise<GroupMetadata[]> {
    // Only load groups the user has access to
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      if (!userAddress) {
        console.log('❌ No user address provided, cannot load groups');
        return [];
      }
      
      console.log('🔄 Loading groups for user:', userAddress);
      const response = await fetch(`${apiUrl}/groups?address=${userAddress}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.groups && result.groups.length > 0) {
          console.log('✅ Successfully loaded user groups from Greenfield:', result.groups.length);
          return result.groups;
        }
      } else if (response.status === 403) {
        console.log('🔒 Access denied for user:', userAddress);
        return [];
      }
      
      console.log('📭 No groups found or accessible for user:', userAddress);
      return [];
    } catch (error) {
      console.error('❌ Error loading groups from Greenfield:', error);
      return [];
    }
  }

  async getGroup(groupId: string, userAddress?: string): Promise<{ metadata: GroupMetadata; fullData?: any } | null> {
    // Only load group if user has access
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      if (!userAddress) {
        console.log('❌ No user address provided, cannot access group');
        return null;
      }
      
      console.log('🔄 Loading group details:', groupId, 'for user:', userAddress);
      
      // First check if user has access to this group
      const accessResponse = await fetch(`${apiUrl}/groups/${groupId}/access?address=${userAddress}`);
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
          console.log('✅ Successfully loaded group from Greenfield:', groupId);
          return { metadata: result.metadata, fullData: result.metadata };
        }
      }
      
      console.log('❌ Group not found or access denied:', groupId);
      return null;
    } catch (error) {
      console.error('❌ Error getting group from Greenfield:', error);
      return null;
    }
  }
  
  async saveGroup(groupData: any, userAddress: string): Promise<boolean> {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      console.log('💾 Saving group to Greenfield:', groupData.id, 'by user:', userAddress);
      
      const response = await fetch(`${apiUrl}/groups/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: groupData.id,
          groupData: {
            ...groupData,
            creator: userAddress, // Ensure creator is set to current user
            updatedAt: new Date().toISOString(),
          },
          userAddress: userAddress, // Include user address for access control
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('✅ Group saved successfully to Greenfield');
        return true;
      } else if (response.status === 403) {
        console.error('🔒 Access denied: User cannot save to this group');
        return false;
      } else {
        console.error('❌ Failed to save group:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error saving group to Greenfield:', error);
      return false;
    }
  }

  async joinGroup(groupId: string, userAddress: string, nickname: string): Promise<boolean> {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      console.log('🤝 Joining group:', groupId, 'user:', userAddress);
      
      const response = await fetch(`${apiUrl}/groups/join`, {
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
      if (result.success) {
        console.log('✅ Successfully joined group');
        return true;
      } else {
        console.error('❌ Failed to join group:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error joining group:', error);
      return false;
    }
  }

  async deleteGroup(groupId: string, userAddress: string): Promise<boolean> {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      console.log('🗑️ Deleting group:', groupId, 'by user:', userAddress);
      
      const response = await fetch(`${apiUrl}/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'User-Address': userAddress,
        },
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('✅ Group deleted successfully');
        return true;
      } else if (response.status === 403) {
        console.error('🔒 Access denied: Only group creator can delete group');
        return false;
      } else {
        console.error('❌ Failed to delete group:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error deleting group:', error);
      return false;
    }
  }

  // Admin-only functions
  async getAllGroupsAdmin(adminKey: string): Promise<GroupMetadata[]> {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      console.log('👑 Admin loading all groups');
      
      const response = await fetch(`${apiUrl}/admin/groups?admin_key=${adminKey}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.groups) {
          console.log('✅ Admin loaded all groups:', result.groups.length);
          return result.groups;
        }
      } else if (response.status === 403) {
        console.error('🔒 Admin access denied: Invalid admin key');
        return [];
      }
      
      console.log('📭 No groups found for admin');
      return [];
    } catch (error) {
      console.error('❌ Error loading all groups as admin:', error);
      return [];
    }
  }
}

export const hybridStorageService = new HybridStorageService();
