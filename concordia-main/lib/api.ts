const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: string
}

class ApiClient {
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
  async createGroup(groupData: any) {
    return this.request("/groups", {
      method: "POST",
      body: JSON.stringify(groupData),
    })
  }

  async getGroup(groupId: string) {
    return this.request(`/groups/${groupId}`)
  }

  async updateGroup(groupId: string, updateData: any) {
    return this.request(`/groups/${groupId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    })
  }

  // Contribution Management
  async addContribution(groupId: string, contributionData: any) {
    return this.request(`/groups/${groupId}/contributions`, {
      method: "POST",
      body: JSON.stringify(contributionData),
    })
  }

  async getContributions(groupId: string) {
    return this.request(`/groups/${groupId}/contributions`)
  }

  // Invite Management
  async generateInvite(groupId: string) {
    return this.request(`/groups/${groupId}/invite`, {
      method: "POST",
      body: JSON.stringify({ groupId }),
    })
  }

  async joinWithInvite(inviteCode: string, userAddress: string) {
    return this.request(`/groups/join`, {
      method: "POST",
      body: JSON.stringify({ inviteCode, userAddress }),
    })
  }

  // User Management
  async getUserProfile(address: string) {
    return this.request(`/users/${address}`)
  }

  async updateUserProfile(address: string, userData: any) {
    return this.request(`/users/${address}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    })
  }

  async getUserGroups(address: string) {
    return this.request(`/users/${address}/groups`)
  }

  async updateUserAuraPoints(address: string, operation: 'add' | 'subtract' | 'set', amount: number) {
    return this.request(`/users/${address}/aura`, {
      method: "PUT",
      body: JSON.stringify({ operation, amount }),
    })
  }

  // Aura Rewards
  async getUserAuraRewards(userId: string) {
    return this.request(`/aura/${userId}`)
  }

  async createAuraReward(rewardData: any) {
    return this.request(`/aura`, {
      method: "POST",
      body: JSON.stringify(rewardData),
    })
  }

  async updateAuraRewardStatus(rewardId: string, status: string, transactionHash?: string) {
    return this.request(`/aura/${rewardId}`, {
      method: "PUT",
      body: JSON.stringify({ status, transactionHash }),
    })
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
  create: (data: any) => apiClient.createGroup(data),
  get: (groupId: string) => apiClient.getGroup(groupId),
  update: (groupId: string, data: any) => apiClient.updateGroup(groupId, data),
  addContribution: (groupId: string, data: any) => apiClient.addContribution(groupId, data),
  getContributions: (groupId: string) => apiClient.getContributions(groupId),
  generateInvite: (groupId: string) => apiClient.generateInvite(groupId),
  joinWithInvite: (inviteCode: string, userAddress: string) => apiClient.joinWithInvite(inviteCode, userAddress),
}

export const userApi = {
  getProfile: (address: string) => apiClient.getUserProfile(address),
  updateProfile: (address: string, data: any) => apiClient.updateUserProfile(address, data),
  getGroups: (address: string) => apiClient.getUserGroups(address),
  updateAuraPoints: (address: string, operation: 'add' | 'subtract' | 'set', amount: number) => 
    apiClient.updateUserAuraPoints(address, operation, amount),
}

export const auraApi = {
  getRewards: (userId: string) => apiClient.getUserAuraRewards(userId),
  createReward: (rewardData: any) => apiClient.createAuraReward(rewardData),
  updateRewardStatus: (rewardId: string, status: string, transactionHash?: string) => 
    apiClient.updateAuraRewardStatus(rewardId, status, transactionHash),
}
