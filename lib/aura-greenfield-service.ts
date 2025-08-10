import { GreenfieldDirectService } from './greenfield-direct'

const greenfieldService = new GreenfieldDirectService()

export interface AuraPurchase {
  id: string
  userId: string
  rewardId: string
  rewardName: string
  auraPointsSpent: number
  purchaseDate: string
  status: "pending" | "active" | "expired" | "used"
  redemptionCode: string
  validUntil: string
  category: string
  discount: string
  originalPrice: number
  discountedPrice: number
  metadata?: any
}

export interface AuraReward {
  id: string
  name: string
  description: string
  category: string
  auraPointsCost: number
  discount: string
  originalPrice: number
  discountedPrice: number
  validity: string
  availability: number
  image: string
  terms: string[]
}

export interface UserAuraData {
  userId: string
  totalAuraPoints: number
  earnedAuraPoints: number
  spentAuraPoints: number
  purchases: AuraPurchase[]
  lastUpdated: string
}

class AuraGreenfieldService {
  private bucketName = "0x000000000000000000000000000000000000000000000000000000000000566f"
  private basePath = "aura"

  // Save user's Aura purchase to Greenfield
  async saveAuraPurchase(purchase: AuraPurchase): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("💫 Saving Aura purchase to Greenfield:", purchase.id)
      
      const fileName = `${this.basePath}/purchases/${purchase.userId}/${purchase.id}.json`
      const purchaseData = {
        ...purchase,
        greenfield: {
          objectName: fileName,
          bucketName: this.bucketName,
          endpoint: "https://gnfd-testnet-sp1.bnbchain.org",
          publicRead: false, // Private data
          createdAt: new Date().toISOString(),
        }
      }

      const result = await greenfieldService.uploadObject(
        this.bucketName,
        fileName,
        JSON.stringify(purchaseData, null, 2)
      )

      if (result.success) {
        console.log("✅ Aura purchase saved to Greenfield:", purchase.id)
        
        // Update user's Aura data
        await this.updateUserAuraData(purchase.userId, purchase.auraPointsSpent)
        
        return { success: true }
      } else {
        console.error("❌ Failed to save Aura purchase:", result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error("❌ Error saving Aura purchase:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  // Get all Aura purchases for a user
  async getUserAuraPurchases(userId: string): Promise<{ success: boolean; data?: AuraPurchase[]; error?: string }> {
    try {
      console.log("💫 Loading Aura purchases for user:", userId)
      
      const prefix = `${this.basePath}/purchases/${userId}/`
      const result = await greenfieldService.listObjects(this.bucketName, prefix)
      
      if (!result.success || !result.data) {
        console.log("No Aura purchases found for user:", userId)
        return { success: true, data: [] }
      }

      const purchases: AuraPurchase[] = []
      
      for (const object of result.data) {
        try {
          const objectResult = await greenfieldService.getObject(this.bucketName, object.name)
          if (objectResult.success && objectResult.data) {
            const purchaseData = JSON.parse(objectResult.data)
            purchases.push(purchaseData)
          }
        } catch (error) {
          console.warn("Failed to load purchase:", object.name, error)
        }
      }

      // Sort by purchase date (newest first)
      purchases.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())

      console.log("✅ Loaded Aura purchases:", purchases.length)
      return { success: true, data: purchases }
    } catch (error) {
      console.error("❌ Error loading Aura purchases:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  // Get user's Aura data (points, purchases, etc.)
  async getUserAuraData(userId: string): Promise<{ success: boolean; data?: UserAuraData; error?: string }> {
    try {
      console.log("💫 Loading Aura data for user:", userId)
      
      const fileName = `${this.basePath}/users/${userId}/aura-data.json`
      const result = await greenfieldService.getObject(this.bucketName, fileName)
      
      if (!result.success) {
        // Create new Aura data if it doesn't exist
        const newAuraData: UserAuraData = {
          userId,
          totalAuraPoints: 0,
          earnedAuraPoints: 0,
          spentAuraPoints: 0,
          purchases: [],
          lastUpdated: new Date().toISOString()
        }
        
        await this.saveUserAuraData(newAuraData)
        return { success: true, data: newAuraData }
      }

      const auraData: UserAuraData = JSON.parse(result.data!)
      console.log("✅ Loaded Aura data:", auraData)
      return { success: true, data: auraData }
    } catch (error) {
      console.error("❌ Error loading Aura data:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  // Save user's Aura data
  async saveUserAuraData(auraData: UserAuraData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("💫 Saving Aura data for user:", auraData.userId)
      
      const fileName = `${this.basePath}/users/${auraData.userId}/aura-data.json`
      const dataToSave = {
        ...auraData,
        lastUpdated: new Date().toISOString(),
        greenfield: {
          objectName: fileName,
          bucketName: this.bucketName,
          endpoint: "https://gnfd-testnet-sp1.bnbchain.org",
          publicRead: false,
          updatedAt: new Date().toISOString(),
        }
      }

      const result = await greenfieldService.uploadObject(
        this.bucketName,
        fileName,
        JSON.stringify(dataToSave, null, 2)
      )

      if (result.success) {
        console.log("✅ Aura data saved to Greenfield:", auraData.userId)
        return { success: true }
      } else {
        console.error("❌ Failed to save Aura data:", result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error("❌ Error saving Aura data:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  // Update user's Aura data when points are spent
  async updateUserAuraData(userId: string, pointsSpent: number): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("💫 Updating Aura data for user:", userId, "Points spent:", pointsSpent)
      
      const currentData = await this.getUserAuraData(userId)
      if (!currentData.success || !currentData.data) {
        return { success: false, error: "Failed to load current Aura data" }
      }

      const updatedData: UserAuraData = {
        ...currentData.data,
        totalAuraPoints: Math.max(0, currentData.data.totalAuraPoints - pointsSpent),
        spentAuraPoints: currentData.data.spentAuraPoints + pointsSpent,
        lastUpdated: new Date().toISOString()
      }

      return await this.saveUserAuraData(updatedData)
    } catch (error) {
      console.error("❌ Error updating Aura data:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  // Add Aura points to user (when they contribute to groups)
  async addAuraPoints(userId: string, pointsToAdd: number): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("💫 Adding Aura points for user:", userId, "Points to add:", pointsToAdd)
      
      const currentData = await this.getUserAuraData(userId)
      if (!currentData.success || !currentData.data) {
        return { success: false, error: "Failed to load current Aura data" }
      }

      const updatedData: UserAuraData = {
        ...currentData.data,
        totalAuraPoints: currentData.data.totalAuraPoints + pointsToAdd,
        earnedAuraPoints: currentData.data.earnedAuraPoints + pointsToAdd,
        lastUpdated: new Date().toISOString()
      }

      return await this.saveUserAuraData(updatedData)
    } catch (error) {
      console.error("❌ Error adding Aura points:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  // Get available rewards catalog
  async getAvailableRewards(): Promise<{ success: boolean; data?: AuraReward[]; error?: string }> {
    try {
      console.log("💫 Loading available rewards catalog")
      
      const fileName = `${this.basePath}/rewards/catalog.json`
      const result = await greenfieldService.getObject(this.bucketName, fileName)
      
      if (!result.success) {
        // Return default rewards if catalog doesn't exist
        const defaultRewards: AuraReward[] = [
          {
            id: "flight-15",
            name: "Flight Discount Voucher",
            description: "15% off on domestic flights",
            category: "travel",
            auraPointsCost: 50,
            discount: "15%",
            originalPrice: 200,
            discountedPrice: 170,
            validity: "6 months",
            availability: 100,
            image: "✈️",
            terms: ["Valid for domestic flights only", "Minimum booking amount: $100", "Cannot be combined with other offers"]
          },
          {
            id: "movie-30",
            name: "Movie Ticket Discount",
            description: "30% off on movie tickets",
            category: "entertainment",
            auraPointsCost: 15,
            discount: "30%",
            originalPrice: 15,
            discountedPrice: 10.5,
            validity: "1 month",
            availability: 1000,
            image: "🎬",
            terms: ["Valid for all movie theaters", "Maximum 2 tickets per redemption", "Valid for any movie"]
          },
          {
            id: "coffee-50",
            name: "Coffee Shop Discount",
            description: "50% off on coffee drinks",
            category: "lifestyle",
            auraPointsCost: 5,
            discount: "50%",
            originalPrice: 8,
            discountedPrice: 4,
            validity: "1 month",
            availability: 2000,
            image: "☕",
            terms: ["Valid at participating coffee shops", "One drink per redemption", "Valid for any coffee drink"]
          }
        ]
        
        // Save default catalog
        await this.saveRewardsCatalog(defaultRewards)
        return { success: true, data: defaultRewards }
      }

      const rewards: AuraReward[] = JSON.parse(result.data!)
      console.log("✅ Loaded rewards catalog:", rewards.length, "rewards")
      return { success: true, data: rewards }
    } catch (error) {
      console.error("❌ Error loading rewards catalog:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  // Save rewards catalog
  async saveRewardsCatalog(rewards: AuraReward[]): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("💫 Saving rewards catalog")
      
      const fileName = `${this.basePath}/rewards/catalog.json`
      const catalogData = {
        rewards,
        lastUpdated: new Date().toISOString(),
        greenfield: {
          objectName: fileName,
          bucketName: this.bucketName,
          endpoint: "https://gnfd-testnet-sp1.bnbchain.org",
          publicRead: true, // Public catalog
        }
      }

      const result = await greenfieldService.uploadObject(
        this.bucketName,
        fileName,
        JSON.stringify(catalogData, null, 2)
      )

      if (result.success) {
        console.log("✅ Rewards catalog saved to Greenfield")
        return { success: true }
      } else {
        console.error("❌ Failed to save rewards catalog:", result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error("❌ Error saving rewards catalog:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  // Update purchase status (e.g., mark as used)
  async updatePurchaseStatus(purchaseId: string, userId: string, status: AuraPurchase['status']): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("💫 Updating purchase status:", purchaseId, "Status:", status)
      
      const fileName = `${this.basePath}/purchases/${userId}/${purchaseId}.json`
      const result = await greenfieldService.getObject(this.bucketName, fileName)
      
      if (!result.success || !result.data) {
        return { success: false, error: "Purchase not found" }
      }

      const purchase: AuraPurchase = JSON.parse(result.data)
      purchase.status = status
      purchase.lastUpdated = new Date().toISOString()

      const updateResult = await greenfieldService.uploadObject(
        this.bucketName,
        fileName,
        JSON.stringify(purchase, null, 2)
      )

      if (updateResult.success) {
        console.log("✅ Purchase status updated:", purchaseId, status)
        return { success: true }
      } else {
        console.error("❌ Failed to update purchase status:", updateResult.error)
        return { success: false, error: updateResult.error }
      }
    } catch (error) {
      console.error("❌ Error updating purchase status:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  // Get purchase statistics for a user
  async getUserPurchaseStats(userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log("💫 Loading purchase statistics for user:", userId)
      
      const purchases = await this.getUserAuraPurchases(userId)
      if (!purchases.success || !purchases.data) {
        return { success: false, error: "Failed to load purchases" }
      }

      const stats = {
        totalPurchases: purchases.data.length,
        activePurchases: purchases.data.filter(p => p.status === "active").length,
        totalPointsSpent: purchases.data.reduce((sum, p) => sum + p.auraPointsSpent, 0),
        totalSavings: purchases.data.reduce((sum, p) => sum + (p.originalPrice - p.discountedPrice), 0),
        categories: purchases.data.reduce((acc, p) => {
          acc[p.category] = (acc[p.category] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        monthlySpending: purchases.data.reduce((acc, p) => {
          const month = new Date(p.purchaseDate).toISOString().slice(0, 7)
          acc[month] = (acc[month] || 0) + p.auraPointsSpent
          return acc
        }, {} as Record<string, number>)
      }

      console.log("✅ Purchase statistics loaded:", stats)
      return { success: true, data: stats }
    } catch (error) {
      console.error("❌ Error loading purchase statistics:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }
}

export const auraGreenfieldService = new AuraGreenfieldService() 