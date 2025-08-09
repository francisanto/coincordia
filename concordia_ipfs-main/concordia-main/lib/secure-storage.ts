
import { GroupMetadata, MemberData } from './types'

export interface StorageResult<T = any> {
  success: boolean
  data?: T
  error?: string
  hash?: string
}

class SecureStorageService {
  private static instance: SecureStorageService | null = null
  private baseUrl = '/api'
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService()
    }
    return SecureStorageService.instance
  }

  private getCacheKey(key: string): string {
    return `secure_storage_${key}`
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  async initialize(): Promise<void> {
    console.log('🔐 Secure storage service initialized')
  }

  async saveGroup(groupId: string, groupData: GroupMetadata, userAddress: string): Promise<StorageResult> {
    try {
      console.log('💾 Saving group securely:', groupId)

      // Validate user has write access
      if (!this.hasWriteAccess(groupData, userAddress)) {
        return {
          success: false,
          error: 'Access denied: You cannot modify this group'
        }
      }

      const data = {
        ...groupData,
        id: groupId,
        updatedAt: new Date().toISOString(),
        lastModifiedBy: userAddress
      }

      const response = await fetch(`${this.baseUrl}/groups`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Address': userAddress
        },
        body: JSON.stringify({ id: groupId, ...data })
      })

      if (response.ok) {
        this.setCache(this.getCacheKey(groupId), data)
        console.log('✅ Group saved successfully:', groupId)
        return {
          success: true,
          data,
          hash: `secure-${groupId}-${Date.now()}`
        }
      }

      const error = await response.text()
      return { success: false, error: `Failed to save: ${error}` }
    } catch (error) {
      console.error('❌ Error saving group:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async loadGroup(groupId: string, userAddress?: string): Promise<StorageResult<GroupMetadata>> {
    try {
      console.log('📥 Loading group securely:', groupId)

      // Check cache first
      const cached = this.getFromCache(this.getCacheKey(groupId))
      if (cached && userAddress && this.hasReadAccess(cached, userAddress)) {
        return { success: true, data: cached }
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (userAddress) {
        headers['X-User-Address'] = userAddress
      }

      const response = await fetch(`${this.baseUrl}/groups/${groupId}`, { headers })
      
      if (response.ok) {
        const data = await response.json()
        
        // Verify user has access to this group
        if (userAddress && !this.hasReadAccess(data, userAddress)) {
          return { success: false, error: 'Access denied: You cannot view this group' }
        }

        this.setCache(this.getCacheKey(groupId), data)
        return { success: true, data }
      }

      if (response.status === 404) {
        return { success: false, error: 'Group not found' }
      }

      return { success: false, error: 'Failed to load group' }
    } catch (error) {
      console.error('❌ Error loading group:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getUserGroups(userAddress: string): Promise<StorageResult<GroupMetadata[]>> {
    try {
      console.log('👤 Loading user groups:', userAddress)

      const response = await fetch(`${this.baseUrl}/groups/wallet/${userAddress}`, {
        headers: { 'X-User-Address': userAddress }
      })

      if (response.ok) {
        const groups = await response.json()
        // Filter groups user has access to
        const accessibleGroups = groups.filter((group: GroupMetadata) => 
          this.hasReadAccess(group, userAddress)
        )
        return { success: true, data: accessibleGroups }
      }

      return { success: true, data: [] }
    } catch (error) {
      console.error('❌ Error loading user groups:', error)
      return { success: true, data: [] }
    }
  }

  async deleteGroup(groupId: string, userAddress: string): Promise<StorageResult> {
    try {
      console.log('🗑️ Deleting group:', groupId)

      // Load group first to check permissions
      const groupResult = await this.loadGroup(groupId, userAddress)
      if (!groupResult.success || !groupResult.data) {
        return { success: false, error: 'Group not found' }
      }

      if (!this.hasDeleteAccess(groupResult.data, userAddress)) {
        return { success: false, error: 'Access denied: You cannot delete this group' }
      }

      const response = await fetch(`${this.baseUrl}/groups/${groupId}/delete`, {
        method: 'DELETE',
        headers: { 'X-User-Address': userAddress }
      })

      if (response.ok) {
        this.cache.delete(this.getCacheKey(groupId))
        return { success: true }
      }

      return { success: false, error: 'Failed to delete group' }
    } catch (error) {
      console.error('❌ Error deleting group:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async updateGroup(groupId: string, updates: Partial<GroupMetadata>, userAddress: string): Promise<StorageResult> {
    try {
      console.log('🔄 Updating group:', groupId)

      // Load group first to check permissions
      const groupResult = await this.loadGroup(groupId, userAddress)
      if (!groupResult.success || !groupResult.data) {
        return { success: false, error: 'Group not found' }
      }

      if (!this.hasWriteAccess(groupResult.data, userAddress)) {
        return { success: false, error: 'Access denied: You cannot modify this group' }
      }

      const response = await fetch(`${this.baseUrl}/groups/${groupId}/update`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Address': userAddress
        },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        this.cache.delete(this.getCacheKey(groupId))
        return { success: true }
      }

      return { success: false, error: 'Failed to update group' }
    } catch (error) {
      console.error('❌ Error updating group:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Access control methods
  private hasReadAccess(group: GroupMetadata, userAddress: string): boolean {
    const adminWallet = '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'
    
    // Admin has full access
    if (userAddress.toLowerCase() === adminWallet.toLowerCase()) {
      return true
    }

    // Group creator has access
    if (group.creator?.toLowerCase() === userAddress.toLowerCase()) {
      return true
    }

    // Group members have access
    if (group.members?.some(member => 
      member.address?.toLowerCase() === userAddress.toLowerCase()
    )) {
      return true
    }

    return false
  }

  private hasWriteAccess(group: GroupMetadata, userAddress: string): boolean {
    const adminWallet = '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'
    
    // Admin has full access
    if (userAddress.toLowerCase() === adminWallet.toLowerCase()) {
      return true
    }

    // Only group creator can modify
    return group.creator?.toLowerCase() === userAddress.toLowerCase()
  }

  private hasDeleteAccess(group: GroupMetadata, userAddress: string): boolean {
    const adminWallet = '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'
    
    // Admin has full access
    if (userAddress.toLowerCase() === adminWallet.toLowerCase()) {
      return true
    }

    // Only group creator can delete
    return group.creator?.toLowerCase() === userAddress.toLowerCase()
  }

  async getStorageStatus(): Promise<{ status: string; details: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      if (response.ok) {
        return {
          status: 'connected',
          details: {
            service: 'Secure API Storage',
            timestamp: new Date().toISOString(),
            cacheSize: this.cache.size
          }
        }
      }
      return {
        status: 'disconnected',
        details: { error: 'Health check failed' }
      }
    } catch (error) {
      return {
        status: 'disconnected',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
}

export const secureStorageService = SecureStorageService.getInstance()
