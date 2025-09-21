
import { useContractEvent } from 'wagmi'
import { CONCORDIA_CONTRACT_ABI } from '@/lib/contract-abi'
import { connectToMongoDB } from '@/lib/mongodb'

const CONCORDIA_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x58ae7520F81DC3464574960B792D43A82BF0C3f1") as `0x${string}`;

// Helper function to clean up MongoDB data for a group
async function cleanupGroupData(groupId: string) {
  try {
    const client = await connectToMongoDB();
    if (!client) {
      console.error('❌ Failed to connect to MongoDB');
      return;
    }
    
    const db = client.db();
    const collection = db.collection('groups');
    
    // Delete the group
    const result = await collection.deleteOne({ id: groupId });
    
    if (result.deletedCount === 0) {
      console.warn(`⚠️ Group ${groupId} not found in MongoDB`);
    }
    
    // Also delete any contributions for this group
    const contributionsCollection = db.collection('contributions');
    const contribResult = await contributionsCollection.deleteMany({ groupId });
    
    console.log('✅ Successfully cleaned up MongoDB data for group:', groupId, {
      groupsDeleted: result.deletedCount,
      contributionsDeleted: contribResult.deletedCount
    });
  } catch (error) {
    console.error('❌ Failed to clean up MongoDB data:', error);
  }
}

export function useGroupDeletionHandler() {
  // Watch for group deletion events (withdrawal completion or emergency withdrawal)
  useContractEvent({
    address: CONCORDIA_CONTRACT_ADDRESS,
    abi: CONCORDIA_CONTRACT_ABI,
    eventName: 'GroupDeleted',
    onLogs: (logs: any[]) => {
      logs.forEach(async (log: any) => {
        try {
          // Ensure log.args exists before destructuring
          if (!log.args) {
            console.error('❌ Group deletion event missing args');
            return;
          }
          
          const { groupId, ipfsHash, deletedBy } = log.args as {
            groupId: bigint;
            ipfsHash: string;
            deletedBy: string;
          };

          if (!groupId) {
            console.error('❌ Group deletion event missing groupId');
            return;
          }

          console.log('🗑️ Group deletion event detected:', {
            groupId: groupId.toString(),
            ipfsHash: ipfsHash || '',
            deletedBy: deletedBy || ''
          });

          // Delete the group data from MongoDB
          await cleanupGroupData(groupId.toString());
          
          // Show notification if in browser environment
          if (typeof window !== 'undefined') {
            console.log(`✅ Group ${groupId.toString()} has been deleted`);
          }
        } catch (error) {
          console.error('❌ Error handling group deletion event:', error);
        }
      });
    },
  } as any);

  // Watch for withdrawal completion events
  useContractEvent({
    address: CONCORDIA_CONTRACT_ADDRESS,
    abi: CONCORDIA_CONTRACT_ABI,
    eventName: 'WithdrawalExecuted',
    onLogs: (logs: any[]) => {
      logs.forEach((log: any) => {
        try {
          // Ensure log.args exists before destructuring
          if (!log.args) {
            console.error('❌ Withdrawal event missing args');
            return;
          }
          
          const { groupId, totalAmount } = log.args as {
            groupId: bigint;
            totalAmount: bigint;
          };

          if (!groupId) {
            console.error('❌ Withdrawal event missing groupId');
            return;
          }

          console.log('💰 Withdrawal completed for group:', groupId.toString(), 'Amount:', (totalAmount || BigInt(0)).toString());
          
          // Notify user about successful completion
          if (typeof window !== 'undefined') {
            const event = new CustomEvent('groupCompleted', {
              detail: { groupId: groupId.toString(), amount: (totalAmount || BigInt(0)).toString() }
            });
            window.dispatchEvent(event);
            
            // Show notification
            console.log(`✅ Withdrawal completed for group ${groupId.toString()}`);
          }
        } catch (error) {
          console.error('❌ Error handling withdrawal event:', error);
        }
      });
    },
  } as any);

  // Watch for emergency withdrawal events
  useContractEvent({
    address: CONCORDIA_CONTRACT_ADDRESS,
    abi: CONCORDIA_CONTRACT_ABI,
    eventName: 'EmergencyWithdrawal',
    onLogs: (logs: any[]) => {
      logs.forEach((log: any) => {
        try {
          // Ensure log.args exists before destructuring
          if (!log.args) {
            console.error('❌ Emergency withdrawal event missing args');
            return;
          }
          
          const { groupId, executor, penaltyAmount } = log.args as {
            groupId: bigint;
            executor: string;
            penaltyAmount: bigint;
          };

          if (!groupId) {
            console.error('❌ Emergency withdrawal event missing groupId');
            return;
          }

          console.log('🚨 Emergency withdrawal for group:', groupId.toString(), 'Executor:', executor || 'unknown', 'Penalty:', (penaltyAmount || BigInt(0)).toString());
          
          // Notify user about emergency withdrawal
          if (typeof window !== 'undefined') {
            const event = new CustomEvent('emergencyWithdrawal', {
              detail: { 
                groupId: groupId.toString(), 
                executor: executor || 'unknown', 
                penalty: (penaltyAmount || BigInt(0)).toString() 
              }
            });
            window.dispatchEvent(event);
            
            // Show notification
            console.log(`🚨 Emergency withdrawal executed for group ${groupId.toString()}`);
          }
          
          // Clean up MongoDB data for this group
          cleanupGroupData(groupId.toString());
        } catch (error) {
          console.error('❌ Error handling emergency withdrawal event:', error);
        }
      });
    },
  } as any);
}
