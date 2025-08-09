
import { useWatchContractEvent } from 'wagmi'
import { CONCORDIA_CONTRACT_ABI } from '@/components/smart-contract-integration'
import { ipfsService } from './ipfs-service'

const CONCORDIA_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x76a9C6d5EE759b0b5Ef4c7D9963523d247cBeF88") as `0x${string}`;

export function useGroupDeletionHandler() {
  // Watch for group deletion events (withdrawal completion or emergency withdrawal)
  useWatchContractEvent({
    address: CONCORDIA_CONTRACT_ADDRESS,
    abi: CONCORDIA_CONTRACT_ABI,
    eventName: 'GroupDeleted',
    onLogs(logs) {
      logs.forEach(async (log) => {
        try {
          const { groupId, ipfsHash, deletedBy } = log.args as {
            groupId: bigint;
            ipfsHash: string;
            deletedBy: string;
          };

          console.log('🗑️ Group deletion event detected:', {
            groupId: groupId.toString(),
            ipfsHash,
            deletedBy
          });

          // Delete/unpin the group data from IPFS
          const result = await ipfsService.deleteGroup(ipfsHash, deletedBy);
          
          if (result.success) {
            console.log('✅ Successfully cleaned up IPFS data for completed group:', groupId.toString());
          } else {
            console.warn('⚠️ Failed to clean up IPFS data:', result.error);
          }
        } catch (error) {
          console.error('❌ Error handling group deletion event:', error);
        }
      });
    },
  });

  // Watch for withdrawal completion events
  useWatchContractEvent({
    address: CONCORDIA_CONTRACT_ADDRESS,
    abi: CONCORDIA_CONTRACT_ABI,
    eventName: 'WithdrawalExecuted',
    onLogs(logs) {
      logs.forEach((log) => {
        const { groupId, totalAmount } = log.args as {
          groupId: bigint;
          totalAmount: bigint;
        };

        console.log('💰 Withdrawal completed for group:', groupId.toString(), 'Amount:', totalAmount.toString());
        
        // Notify user about successful completion
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('groupCompleted', {
            detail: { groupId: groupId.toString(), amount: totalAmount.toString() }
          });
          window.dispatchEvent(event);
        }
      });
    },
  });

  // Watch for emergency withdrawal events
  useWatchContractEvent({
    address: CONCORDIA_CONTRACT_ADDRESS,
    abi: CONCORDIA_CONTRACT_ABI,
    eventName: 'EmergencyWithdrawal',
    onLogs(logs) {
      logs.forEach((log) => {
        const { groupId, executor, penaltyAmount } = log.args as {
          groupId: bigint;
          executor: string;
          penaltyAmount: bigint;
        };

        console.log('🚨 Emergency withdrawal for group:', groupId.toString(), 'Penalty:', penaltyAmount.toString());
        
        // Notify user about emergency withdrawal
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('emergencyWithdrawal', {
            detail: { groupId: groupId.toString(), executor, penalty: penaltyAmount.toString() }
          });
          window.dispatchEvent(event);
        }
      });
    },
  });
}
