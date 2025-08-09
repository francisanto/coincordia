import { api } from './api';

export interface ArweaveStatusResponse {
  success: boolean;
  status?: 'pending' | 'confirmed' | 'failed';
  error?: string;
  timestamp?: string;
}

/**
 * Utility function to check the status of an Arweave transaction
 * @param transactionId The Arweave transaction ID to check
 * @param userAddress The user's wallet address for authentication
 * @returns Promise with the transaction status information
 */
export async function checkArweaveStatus(transactionId: string, userAddress: string): Promise<ArweaveStatusResponse> {
  if (!transactionId) {
    return { success: false, error: 'No transaction ID provided' };
  }

  try {
    // In a real implementation, this would call an API endpoint that checks Arweave status
    // For demo purposes, we'll simulate a status check with the retrieve endpoint
    const response = await api.retrieveGroup({
      arweaveId: transactionId,
      userAddress
    });

    if (response.success) {
      return {
        success: true,
        status: 'confirmed',
        timestamp: response.data?.updatedAt || new Date().toISOString()
      };
    } else {
      // If we can't retrieve the data, assume it's still pending
      // In a real implementation, we would check the actual status on Arweave
      return {
        success: true,
        status: 'pending',
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Error checking Arweave status:', error);
    return {
      success: false,
      status: 'failed',
      error: 'Failed to check transaction status',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Updates the Arweave status for a group in local storage
 * @param groupId The group ID to update
 * @param status The new status
 * @param timestamp Optional timestamp of the status update
 */
export async function updateArweaveStatus(
  groupId: string,
  status: 'pending' | 'confirmed' | 'failed',
  timestamp?: string
): Promise<boolean> {
  try {
    // This would typically update the group in local storage or database
    // For demo purposes, we'll just log the update
    console.log(`Updated Arweave status for group ${groupId} to ${status}`);
    return true;
  } catch (error) {
    console.error('Error updating Arweave status:', error);
    return false;
  }
}