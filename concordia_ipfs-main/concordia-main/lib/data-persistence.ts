import { connectToMongoDB } from './mongodb';
import { v4 as uuidv4 } from 'uuid';
import { SavingsGroup } from '@/components/group-dashboard';

class DataPersistenceService {
  private collectionName = 'groups';

  // Load groups from MongoDB
  async loadGroups(): Promise<SavingsGroup[]> {
    try {
      console.log('📥 Loading groups from MongoDB');
      const client = await connectToMongoDB();
      const collection = client.db().collection(this.collectionName);
      const groups = await collection.find({}).toArray();
      
      return groups as unknown as SavingsGroup[];
    } catch (error) {
      console.error('❌ Error loading groups from MongoDB:', error);
      throw error;
    }
  }

  // Save group to MongoDB
  async saveGroup(group: SavingsGroup): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('💾 Saving group to MongoDB:', group.id);
      const client = await connectToMongoDB();
      const collection = client.db().collection(this.collectionName);
      
      // Add MongoDB metadata
      const groupWithMetadata = {
        ...group,
        mongodb: {
          documentId: group.id,
          collection: this.collectionName,
          lastUpdated: new Date().toISOString()
        }
      };
      
      // Insert or update the group
      await collection.updateOne(
        { id: group.id },
        { $set: groupWithMetadata },
        { upsert: true }
      );
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving group to MongoDB:', error);
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Delete group from MongoDB
  async deleteGroup(groupId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🗑️ Deleting group from MongoDB:', groupId);
      const client = await connectToMongoDB();
      const collection = client.db().collection(this.collectionName);
      
      await collection.deleteOne({ id: groupId });
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting group from MongoDB:', error);
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Migrate groups to MongoDB
  async migrateToMongoDB(groups: SavingsGroup[]): Promise<{ migrated: number; failed: number }> {
    try {
      console.log('🔄 Starting migration to MongoDB');
      console.log(`📊 Found ${groups.length} groups to migrate`);
      
      let migrated = 0;
      let failed = 0;
      
      // Migrate each group
      for (const group of groups) {
        try {
          const result = await this.saveGroup(group);
          if (result.success) {
            migrated++;
            console.log(`✅ Migrated group: ${group.id}`);
          } else {
            failed++;
            console.error(`❌ Failed to migrate group: ${group.id}`, result.error);
          }
        } catch (error) {
          failed++;
          console.error(`❌ Error migrating group: ${group.id}`, error);
        }
      }
      
      return { migrated, failed };
    } catch (error) {
      console.error('❌ Error during migration:', error);
      return { migrated: 0, failed: 0 };
    }
  }

  // Save contribution to MongoDB
  async saveContribution(groupId: string, contributionData: any): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('💾 Saving contribution to MongoDB for group:', groupId);
      const client = await connectToMongoDB();
      const collection = client.db().collection('contributions');
      
      // Add MongoDB metadata
      const contributionWithMetadata = {
        ...contributionData,
        groupId,
        id: uuidv4(),
        mongodb: {
          documentId: uuidv4(),
          collection: 'contributions',
          lastUpdated: new Date().toISOString()
        }
      };
      
      // Insert the contribution
      await collection.insertOne(contributionWithMetadata);
      
      // Update the group's contributions count
      const groupsCollection = client.db().collection(this.collectionName);
      await groupsCollection.updateOne(
        { id: groupId },
        { $inc: { contributionsCount: 1 } }
      );
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving contribution to MongoDB:', error);
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get a single group by ID
  async getGroup(groupId: string): Promise<SavingsGroup | null> {
    try {
      console.log('📥 Getting group from MongoDB:', groupId);
      const client = await connectToMongoDB();
      const collection = client.db().collection(this.collectionName);
      const group = await collection.findOne({ id: groupId });
      
      return group as unknown as SavingsGroup || null;
    } catch (error) {
      console.error('❌ Error getting group from MongoDB:', error);
      return null;
    }
  }

  // Update group in MongoDB
  async updateGroup(groupId: string, groupData: SavingsGroup): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Updating group in MongoDB:', groupId);
      const client = await connectToMongoDB();
      const collection = client.db().collection(this.collectionName);
      
      // Add MongoDB metadata
      const groupWithMetadata = {
        ...groupData,
        updatedAt: new Date().toISOString(),
        mongodb: {
          documentId: groupId,
          collection: this.collectionName,
          lastUpdated: new Date().toISOString()
        }
      };
      
      // Update the group
      await collection.updateOne(
        { id: groupId },
        { $set: groupWithMetadata },
        { upsert: true }
      );
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating group in MongoDB:', error);
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Update group metadata in MongoDB
  async updateGroupMetadata(groupId: string, updates: any): Promise<{ success: boolean; error?: string; metadataHash?: string }> {
    try {
      console.log('🔄 Updating group metadata in MongoDB:', groupId);
      const client = await connectToMongoDB();
      const collection = client.db().collection(this.collectionName);
      
      // Find the group
      const group = await collection.findOne({ id: groupId });
      
      if (!group) {
        return { 
          success: false, 
          error: 'Group not found' 
        };
      }
      
      // Update the group with the new metadata
      const updatedGroup = {
        ...group,
        ...updates,
        updatedAt: new Date().toISOString(),
        mongodb: {
          ...group.mongodb,
          lastUpdated: new Date().toISOString()
        }
      };
      
      // Update in MongoDB
      await collection.updateOne(
        { id: groupId },
        { $set: updatedGroup }
      );
      
      console.log('✅ Group metadata updated successfully in MongoDB:', groupId);
      return { 
        success: true,
        metadataHash: updatedGroup.mongodb.documentId
      };
    } catch (error) {
      console.error('❌ Error updating group metadata in MongoDB:', error);
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

export const dataPersistenceService = new DataPersistenceService();