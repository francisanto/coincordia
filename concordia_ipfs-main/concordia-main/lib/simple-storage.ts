
// Simple storage service that works in production without localStorage
export class SimpleStorage {
  private static API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

  static async saveGroup(groupData: any): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/groups/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      });

      if (!response.ok) {
        throw new Error(`Storage failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to save group:', error);
      throw error;
    }
  }

  static async getGroups(walletAddress: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.API_BASE}/groups/wallet/${walletAddress}`);
      
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error(`Failed to load groups: ${response.status}`);
      }

      const data = await response.json();
      return data.groups || [];
    } catch (error) {
      console.error('Failed to load groups:', error);
      return [];
    }
  }

  static async deleteGroup(groupId: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/groups/${groupId}/delete`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to delete group:', error);
      throw error;
    }
  }

  static async updateGroup(groupId: string, groupData: any): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/groups/${groupId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      });

      if (!response.ok) {
        throw new Error(`Update failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to update group:', error);
      throw error;
    }
  }
}

// Export for compatibility
export default SimpleStorage;
