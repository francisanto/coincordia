import { apiClient } from './api';

export interface MongoDBStatusResponse {
  success: boolean;
  status?: 'pending' | 'confirmed' | 'failed';
  error?: string;
  timestamp?: string;
}

/**
 * Utility function to check the status of a MongoDB document
 * @param documentId The MongoDB document ID to check
 * @param userAddress The user's wallet address for authentication
 * @returns Promise with the document status information
 */
export async function checkMongoDBStatus(documentId: string, userAddress: string): Promise<MongoDBStatusResponse> {
  if (!documentId) {
    return { success: false, error: 'No document ID provided' };
  }

  try {
    // Call the API endpoint that checks MongoDB status
    const response = await apiClient.retrieveGroup({
      mongoDbId: documentId,
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
      return {
        success: true,
        status: 'pending',
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Error checking MongoDB status:', error);
    return {
      success: false,
      status: 'failed',
      error: 'Failed to check document status',
      timestamp: new Date().toISOString()
    };
  }
}