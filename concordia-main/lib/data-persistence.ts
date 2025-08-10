// This file provides a simple interface for storing and retrieving data
// It uses the API client to interact with the MongoDB backend

import { apiClient } from "./api"

export const dataPersistence = {
  // Store data using the appropriate API endpoint based on the key
  storeData: async (key: string, data: any) => {
    try {
      // Determine the appropriate API endpoint based on the key
      if (key.startsWith('group:')) {
        const groupId = key.split(':')[1]
        await apiClient.updateGroup(groupId, data)
      } else if (key.startsWith('user:')) {
        const address = key.split(':')[1]
        await apiClient.updateUserProfile(address, data)
      } else if (key.startsWith('aura:')) {
        const userId = key.split(':')[1]
        await apiClient.createAuraReward({ userId, ...data })
      } else {
        console.warn(`No specific API endpoint for key: ${key}, data not stored`)
        return false
      }
      return true
    } catch (error) {
      console.error(`Error storing data for key: ${key}`, error)
      return false
    }
  },

  // Get data using the appropriate API endpoint based on the key
  getData: async (key: string) => {
    try {
      // Determine the appropriate API endpoint based on the key
      let response
      if (key.startsWith('group:')) {
        const groupId = key.split(':')[1]
        response = await apiClient.getGroup(groupId)
      } else if (key.startsWith('user:')) {
        const address = key.split(':')[1]
        response = await apiClient.getUserProfile(address)
      } else if (key.startsWith('aura:')) {
        const userId = key.split(':')[1]
        response = await apiClient.getUserAuraRewards(userId)
      } else {
        console.warn(`No specific API endpoint for key: ${key}, data not retrieved`)
        return null
      }
      
      return response.success ? response.data : null
    } catch (error) {
      console.error(`Error getting data for key: ${key}`, error)
      return null
    }
  },

  // Remove data using the appropriate API endpoint based on the key
  // Note: This is a placeholder as deletion might require specific API endpoints
  removeData: async (key: string) => {
    try {
      // For now, we'll just log this as most data shouldn't be deleted
      // but rather marked as inactive or archived
      console.warn(`Data removal for key: ${key} is not implemented yet`)
      return true
    } catch (error) {
      console.error(`Error removing data for key: ${key}`, error)
      return false
    }
  },
}