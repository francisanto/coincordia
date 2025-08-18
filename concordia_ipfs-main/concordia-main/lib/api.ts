const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: string
}

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const config: RequestInit = {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      }

      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return { success: true, data }
    } catch (error) {
      console.error("API request failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // Group Management
  async storeGroup(groupId: string, groupData: any) {
    return this.request("/groups/store", {
      method: "POST",
      body: JSON.stringify({ groupId, groupData }),
    })
  }

  async getGroup(groupId: string) {
    return this.request(`/groups/${groupId}`)
  }

  async retrieveGroup(options: { groupId?: string, ipfsHash?: string, arweaveId?: string, userAddress: string }) {
    const params = new URLSearchParams()
    if (options.groupId) params.append('groupId', options.groupId)
    if (options.ipfsHash) params.append('ipfsHash', options.ipfsHash)
    if (options.arweaveId) params.append('arweaveId', options.arweaveId)
    if (options.userAddress) params.append('userAddress', options.userAddress)
    
    return this.request(`/groups/retrieve?${params.toString()}`)
  }
  
  async checkArweaveStatus(transactionId: string, userAddress: string) {
    const params = new URLSearchParams()
    params.append('transactionId', transactionId)
    params.append('userAddress', userAddress)
    
    return this.request(`/groups/arweave-status?${params.toString()}`)
  }

  async updateGroup(groupId: string, updateData: any) {
    return this.request(`/groups/${groupId}`, {
      method: "PUT",
      body: JSON.stringify({ updateData }),
    })
  }

  // Contribution Management
  async storeContribution(groupId: string, contributionData: any) {
    return this.request("/contributions/store", {
      method: "POST",
      body: JSON.stringify({ groupId, contributionData }),
    })
  }

  async getContributions(groupId: string) {
    return this.request(`/contributions/${groupId}`)
  }

  // Invite Management
  async storeInvite(groupId: string, inviteData: any) {
    return this.request("/invites/store", {
      method: "POST",
      body: JSON.stringify({ groupId, inviteData }),
    })
  }

  async getInvites(groupId: string) {
    return this.request(`/invites/${groupId}`)
  }

  // Blockchain Integration
  async getBlockchainGroup(groupId: string) {
    return this.request(`/blockchain/groups/${groupId}`)
  }

  async getUserGroups(address: string) {
    return this.request(`/blockchain/users/${address}/groups`)
  }

  // Analytics
  async getAnalytics(groupId: string) {
    return this.request(`/analytics/${groupId}`)
  }

  // File Upload
  async uploadFile(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return this.request("/upload", {
      method: "POST",
      headers: {}, // Remove Content-Type to let browser set it for FormData
      body: formData,
    })
  }

  // Health Check
  async healthCheck() {
    return this.request("/health")
  }
}

export const apiClient = new ApiClient()

// Utility functions for common operations
export const groupApi = {
  create: (groupId: string, data: any) => apiClient.storeGroup(groupId, data),
  get: (groupId: string) => apiClient.getGroup(groupId),
  update: (groupId: string, data: any) => apiClient.updateGroup(groupId, data),
  getBlockchainData: (groupId: string) => apiClient.getBlockchainGroup(groupId),
}

export const contributionApi = {
  store: (groupId: string, data: any) => apiClient.storeContribution(groupId, data),
  getAll: (groupId: string) => apiClient.getContributions(groupId),
}

export const inviteApi = {
  send: (groupId: string, data: any) => apiClient.storeInvite(groupId, data),
  getAll: (groupId: string) => apiClient.getInvites(groupId),
}

export const userApi = {
  getGroups: (address: string) => apiClient.getUserGroups(address),
}

export const analyticsApi = {
  get: (groupId: string) => apiClient.getAnalytics(groupId),
}

// Add default export for apiClient
export default apiClient;
