import { connectToMongoDB } from './mongodb';

export class GreenfieldService {
  private collectionName = 'groups';

  // Delete group data from MongoDB
  async deleteGroupData(groupId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🗑️ Deleting group data from MongoDB:', groupId);
      const client = await connectToMongoDB();
      const collection = client.db().collection(this.collectionName);
      
      // Delete the group
      const result = await collection.deleteOne({ id: groupId });
      
      if (result.deletedCount === 0) {
        return { 
          success: false, 
          error: 'Group not found' 
        };
      }
      
      // Also delete any contributions for this group
      const contributionsCollection = client.db().collection('contributions');
      await contributionsCollection.deleteMany({ groupId });
      
      console.log('✅ Group data deleted successfully from MongoDB:', groupId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting group data from MongoDB:', error);
      
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
