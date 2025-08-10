"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { 
  Plane, 
  Train, 
  Bus, 
  Film, 
  Hotel, 
  ShoppingBag, 
  Gift, 
  Star, 
  Coins, 
  CreditCard,
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  ArrowRight,
  ShoppingCart,
  Wallet,
  Ticket,
  Award,
  Copy,
  Home,
  Sparkles
} from "lucide-react"

interface AuraReward {
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
  redemptionCode?: string
}

interface AuraPurchase {
  id: string
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
}

interface AuraRewardsProps {
  userAuraPoints: number
  onAuraPointsUpdate: (newPoints: number) => void
  onBackToDashboard?: () => void
}

const REWARD_CATEGORIES = [
  {
    id: "travel",
    name: "Travel & Transport",
    icon: Plane,
    color: "from-blue-500 to-cyan-500",
    gradient: "from-blue-500/20 to-cyan-500/20"
  },
  {
    id: "entertainment",
    name: "Entertainment",
    icon: Film,
    color: "from-purple-500 to-pink-500",
    gradient: "from-purple-500/20 to-pink-500/20"
  },
  {
    id: "accommodation",
    name: "Accommodation",
    icon: Hotel,
    color: "from-green-500 to-emerald-500",
    gradient: "from-green-500/20 to-emerald-500/20"
  },
  {
    id: "shopping",
    name: "Shopping",
    icon: ShoppingBag,
    color: "from-orange-500 to-red-500",
    gradient: "from-orange-500/20 to-red-500/20"
  },
  {
    id: "lifestyle",
    name: "Lifestyle",
    icon: Gift,
    color: "from-indigo-500 to-purple-500",
    gradient: "from-indigo-500/20 to-purple-500/20"
  }
]

// Updated budget-friendly rewards with lower point costs
const AVAILABLE_REWARDS: AuraReward[] = [
  // Travel & Transport
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
    id: "train-20",
    name: "Train Journey Discount",
    description: "20% off on train tickets",
    category: "travel",
    auraPointsCost: 30,
    discount: "20%",
    originalPrice: 80,
    discountedPrice: 64,
    validity: "3 months",
    availability: 200,
    image: "🚄",
    terms: ["Valid for all train classes", "Minimum booking amount: $30", "Valid for one-way or round trips"]
  },
  {
    id: "bus-25",
    name: "Bus Travel Discount",
    description: "25% off on bus tickets",
    category: "travel",
    auraPointsCost: 20,
    discount: "25%",
    originalPrice: 40,
    discountedPrice: 30,
    validity: "2 months",
    availability: 500,
    image: "🚌",
    terms: ["Valid for all bus routes", "No minimum booking amount", "Valid for single journey"]
  },
  {
    id: "hotel-10",
    name: "Hotel Booking Discount",
    description: "10% off on hotel bookings",
    category: "accommodation",
    auraPointsCost: 40,
    discount: "10%",
    originalPrice: 150,
    discountedPrice: 135,
    validity: "4 months",
    availability: 150,
    image: "🏨",
    terms: ["Valid for 3+ star hotels", "Minimum stay: 1 night", "Cannot be used for peak season"]
  },
  // Entertainment
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
    id: "concert-15",
    name: "Concert Ticket Discount",
    description: "15% off on concert tickets",
    category: "entertainment",
    auraPointsCost: 60,
    discount: "15%",
    originalPrice: 100,
    discountedPrice: 85,
    validity: "3 months",
    availability: 50,
    image: "🎵",
    terms: ["Valid for selected venues", "Subject to availability", "Cannot be transferred"]
  },
  // Shopping
  {
    id: "shopping-15",
    name: "Shopping Mall Discount",
    description: "15% off at participating stores",
    category: "shopping",
    auraPointsCost: 25,
    discount: "15%",
    originalPrice: 100,
    discountedPrice: 85,
    validity: "2 months",
    availability: 300,
    image: "🛍️",
    terms: ["Valid at participating stores", "Minimum purchase: $30", "Cannot be used for electronics"]
  },
  // Lifestyle
  {
    id: "spa-20",
    name: "Spa & Wellness Discount",
    description: "20% off on spa treatments",
    category: "lifestyle",
    auraPointsCost: 35,
    discount: "20%",
    originalPrice: 120,
    discountedPrice: 96,
    validity: "3 months",
    availability: 120,
    image: "💆",
    terms: ["Valid for all spa treatments", "Advance booking required", "Valid for one person"]
  },
  {
    id: "fitness-15",
    name: "Gym Membership Discount",
    description: "15% off on gym memberships",
    category: "lifestyle",
    auraPointsCost: 45,
    discount: "15%",
    originalPrice: 80,
    discountedPrice: 68,
    validity: "6 months",
    availability: 80,
    image: "💪",
    terms: ["Valid for 3-month minimum membership", "One-time use per person", "Valid at participating gyms"]
  },
  // Budget-friendly options
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
  },
  {
    id: "food-25",
    name: "Restaurant Discount",
    description: "25% off on restaurant bills",
    category: "lifestyle",
    auraPointsCost: 20,
    discount: "25%",
    originalPrice: 60,
    discountedPrice: 45,
    validity: "2 months",
    availability: 400,
    image: "🍽️",
    terms: ["Valid at participating restaurants", "Minimum bill: $20", "Cannot be combined with other offers"]
  },
  {
    id: "transport-30",
    name: "Public Transport Pass",
    description: "30% off on monthly transport pass",
    category: "travel",
    auraPointsCost: 25,
    discount: "30%",
    originalPrice: 50,
    discountedPrice: 35,
    validity: "3 months",
    availability: 300,
    image: "🚇",
    terms: ["Valid for monthly transport passes", "One pass per redemption", "Valid for all public transport"]
  }
]

export function AuraRewards({ userAuraPoints, onAuraPointsUpdate, onBackToDashboard }: AuraRewardsProps) {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [userPurchases, setUserPurchases] = useState<AuraPurchase[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedReward, setSelectedReward] = useState<AuraReward | null>(null)
  const [purchaseQuantity, setPurchaseQuantity] = useState(1)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [lastPurchase, setLastPurchase] = useState<AuraPurchase | null>(null)
  const { toast } = useToast()

  // Load user purchases from Greenfield
  useEffect(() => {
    loadUserPurchases()
  }, [])

  const loadUserPurchases = async () => {
    try {
      setIsLoading(true)
      // Load from localStorage for now (will be replaced with Greenfield)
      const stored = localStorage.getItem('concordia-aura-purchases')
      if (stored) {
        setUserPurchases(JSON.parse(stored))
      }
    } catch (error) {
      console.error("Error loading aura purchases:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const savePurchaseToGreenfield = async (purchase: AuraPurchase) => {
    try {
      // Save to localStorage for now (will be replaced with Greenfield API)
      const existing = JSON.parse(localStorage.getItem('concordia-aura-purchases') || '[]')
      existing.push(purchase)
      localStorage.setItem('concordia-aura-purchases', JSON.stringify(existing))
      
      // TODO: Replace with actual Greenfield API call
      // await greenfieldService.saveAuraPurchase(purchase)
      
      console.log("✅ Aura purchase saved to storage")
    } catch (error) {
      console.error("Error saving aura purchase:", error)
      throw error
    }
  }

  const generateRedemptionCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const codeLength = 8
    let code = 'AURA-'
    
    for (let i = 0; i < codeLength; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    return code
  }

  const handlePurchaseReward = async () => {
    if (!selectedReward) return

    try {
      setIsLoading(true)

      // Check if user has enough aura points
      const totalCost = selectedReward.auraPointsCost * purchaseQuantity
      if (totalCost > userAuraPoints) {
        toast({
          title: "❌ Insufficient Aura Points",
          description: `You need ${totalCost} Aura Points but only have ${userAuraPoints}`,
          duration: 5000,
        })
        return
      }

      // Generate unique redemption code
      const redemptionCode = generateRedemptionCode()

      // Create purchase record
      const purchase: AuraPurchase = {
        id: `purchase-${Date.now()}`,
        rewardId: selectedReward.id,
        rewardName: selectedReward.name,
        auraPointsSpent: totalCost,
        purchaseDate: new Date().toISOString(),
        status: "active",
        redemptionCode,
        validUntil: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 6 months
        category: selectedReward.category,
        discount: selectedReward.discount,
        originalPrice: selectedReward.originalPrice,
        discountedPrice: selectedReward.discountedPrice
      }

      // Save to Greenfield
      await savePurchaseToGreenfield(purchase)

      // Update local state
      setUserPurchases(prev => [...prev, purchase])
      
      // Update aura points
      const newAuraPoints = userAuraPoints - totalCost
      onAuraPointsUpdate(newAuraPoints)

      // Set success modal data
      setLastPurchase(purchase)
      setShowSuccessModal(true)

      // Reset form
      setSelectedReward(null)
      setPurchaseQuantity(1)

    } catch (error) {
      console.error("Error purchasing reward:", error)
      toast({
        title: "❌ Purchase Failed",
        description: "There was an error processing your purchase. Please try again.",
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "📋 Copied!",
      description: "Redemption code copied to clipboard",
      duration: 2000,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500"
      case "pending": return "bg-yellow-500"
      case "expired": return "bg-red-500"
      case "used": return "bg-gray-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "Active"
      case "pending": return "Pending"
      case "expired": return "Expired"
      case "used": return "Used"
      default: return "Unknown"
    }
  }

  const filteredRewards = selectedCategory === "all" 
    ? AVAILABLE_REWARDS 
    : AVAILABLE_REWARDS.filter(reward => reward.category === selectedCategory)

  const activePurchases = userPurchases.filter(purchase => 
    purchase.status === "active" && new Date(purchase.validUntil) > new Date()
  )

  const expiredPurchases = userPurchases.filter(purchase => 
    purchase.status === "expired" || new Date(purchase.validUntil) <= new Date()
  )

  return (
    <div className="space-y-12">
      {/* Enhanced Header with Corner Elements */}
      <div className="relative">
        {/* Background decorative elements - positioned to prevent overlap */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-20 -left-20 w-20 h-20 bg-gradient-to-r from-concordia-pink/10 to-concordia-light-purple/10 rounded-full blur-xl"></div>
          <div className="absolute -top-10 -right-10 w-16 h-16 bg-gradient-to-r from-concordia-light-purple/10 to-concordia-pink/10 rounded-full blur-xl"></div>
          <div className="absolute top-40 left-1/3 w-12 h-12 bg-gradient-to-r from-concordia-pink/5 to-concordia-light-purple/5 rounded-full blur-lg"></div>
        </div>

        {/* Corner Elements */}
        <div className="relative flex justify-between items-start mb-12">
          {/* Back to Dashboard Button - Top Left */}

          {/* Aura Points Display - Top Right */}
          <div className="relative flex items-center space-x-3 p-3 bg-gradient-to-r from-concordia-pink/10 via-concordia-light-purple/10 to-concordia-pink/10 border-2 border-concordia-pink/30 rounded-xl shadow-lg backdrop-blur-sm z-10">
            <div className="p-2 bg-gradient-to-r from-concordia-pink/20 to-concordia-light-purple/20 rounded-lg border border-concordia-pink/30">
              <Coins className="h-5 w-5 text-concordia-pink" />
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-white">{userAuraPoints.toLocaleString()}</div>
              <div className="text-concordia-pink/80 text-sm font-medium">Aura Points</div>
            </div>
            {/* Decorative sparkles - positioned relative to container */}
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-concordia-pink rounded-full animate-ping"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-concordia-light-purple rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>

        {/* Main Header Content - Centered */}
        <div className="relative text-center">
          {/* Enhanced Title with Icon */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <div className="relative">
              <div className="p-4 bg-gradient-to-r from-concordia-pink/20 to-concordia-light-purple/20 rounded-2xl border-2 border-concordia-pink/30 shadow-lg">
                <Award className="h-10 w-10 text-concordia-pink" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-concordia-pink to-concordia-light-purple rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
                Aura <span className="bg-gradient-to-r from-concordia-pink to-concordia-light-purple bg-clip-text text-transparent">Rewards</span>
              </h1>
              <div className="flex items-center justify-center space-x-2 text-concordia-pink/80">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Unlock Amazing Benefits</span>
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
          </div>
          
          <p className="text-white/80 text-lg max-w-3xl mx-auto leading-relaxed mb-8">
            Exchange your Aura Points for incredible discounts on travel, entertainment, shopping, and more!
          </p>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <Tabs defaultValue="rewards" className="w-full">
        <TabsList className="flex w-full bg-concordia-dark-blue/90 border-2 border-concordia-light-purple/40 backdrop-blur-sm rounded-2xl p-2 shadow-2xl mb-8 gap-2">
          <TabsTrigger 
            value="rewards" 
            className="flex-1 text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-concordia-pink/30 data-[state=active]:to-concordia-light-purple/30 data-[state=active]:border-2 data-[state=active]:border-concordia-pink/50 data-[state=active]:shadow-lg data-[state=active]:shadow-concordia-pink/20 rounded-xl transition-all duration-300 font-semibold text-xs py-3 px-2 min-w-0"
          >
            Available Rewards
          </TabsTrigger>
          <TabsTrigger 
            value="purchases" 
            className="flex-1 text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-concordia-pink/30 data-[state=active]:to-concordia-light-purple/30 data-[state=active]:border-2 data-[state=active]:border-concordia-pink/50 data-[state=active]:shadow-lg data-[state=active]:shadow-concordia-pink/20 rounded-xl transition-all duration-300 font-semibold text-xs py-3 px-2 min-w-0"
          >
            My Purchases ({activePurchases.length})
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="flex-1 text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-concordia-pink/30 data-[state=active]:to-concordia-light-purple/30 data-[state=active]:border-2 data-[state=active]:border-concordia-pink/50 data-[state=active]:shadow-lg data-[state=active]:shadow-concordia-pink/20 rounded-xl transition-all duration-300 font-semibold text-xs py-3 px-2 min-w-0"
          >
            Purchase History
          </TabsTrigger>
        </TabsList>

        {/* Available Rewards Tab */}
        <TabsContent value="rewards" className="space-y-8 mt-8">
          {/* Enhanced Category Filter */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className={selectedCategory === "all" 
                ? "bg-gradient-to-r from-concordia-pink to-concordia-light-purple text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 border-2 border-concordia-pink/50 font-semibold px-6 py-3 rounded-xl" 
                : "border-2 border-concordia-light-purple/60 text-concordia-light-purple hover:bg-concordia-light-purple/15 transition-all duration-300 hover:scale-105 font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl"
              }
            >
              All Categories
            </Button>
            {REWARD_CATEGORIES.map((category) => {
              const Icon = category.icon
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={selectedCategory === category.id 
                    ? `bg-gradient-to-r ${category.color} text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 border-2 border-white/20 font-semibold px-6 py-3 rounded-xl` 
                    : "border-2 border-concordia-light-purple/60 text-concordia-light-purple hover:bg-concordia-light-purple/15 transition-all duration-300 hover:scale-105 font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl"
                  }
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {category.name}
                </Button>
              )
            })}
          </div>

          {/* Enhanced Rewards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRewards.map((reward) => (
              <Card 
                key={reward.id} 
                className="group bg-gradient-to-br from-concordia-dark-blue/90 to-concordia-dark-blue/70 border-2 border-concordia-light-purple/40 hover:border-concordia-pink/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl backdrop-blur-sm overflow-hidden shadow-xl"
              >
                {/* Card Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-concordia-pink/5 to-concordia-light-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <CardHeader className="text-center relative z-10 pb-6">
                  <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">{reward.image}</div>
                  <CardTitle className="text-white text-xl font-bold mb-3">{reward.name}</CardTitle>
                  <CardDescription className="text-white/70 text-sm leading-relaxed">{reward.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-concordia-light-purple/15 to-concordia-pink/15 rounded-xl border border-concordia-light-purple/30 shadow-inner">
                      <span className="text-white/80 font-semibold">Aura Points Cost:</span>
                      <span className="text-concordia-pink font-bold text-xl drop-shadow-sm">{reward.auraPointsCost}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80 font-medium">Discount:</span>
                      <Badge className="bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-400 border-2 border-green-500/50 px-4 py-2 font-semibold shadow-lg">
                        {reward.discount} OFF
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80 font-medium">Validity:</span>
                      <span className="text-white/60 font-semibold">{reward.validity}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80 font-medium">Available:</span>
                      <span className="text-white/60 font-semibold">{reward.availability} left</span>
                    </div>
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full bg-gradient-to-r from-concordia-pink to-concordia-light-purple hover:from-concordia-pink/90 hover:to-concordia-light-purple/90 text-white font-bold py-4 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 border-2 border-white/20 rounded-xl text-lg"
                        disabled={reward.auraPointsCost > userAuraPoints}
                      >
                        <ShoppingCart className="h-6 w-6 mr-3" />
                        {reward.auraPointsCost > userAuraPoints ? "Insufficient Points" : "Purchase Reward"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gradient-to-br from-concordia-dark-blue/95 to-concordia-dark-blue/90 border-2 border-concordia-light-purple/40 text-white max-w-md backdrop-blur-sm shadow-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-concordia-pink text-xl flex items-center">
                          <div className="text-3xl mr-3 drop-shadow-lg">{reward.image}</div>
                          {reward.name}
                        </DialogTitle>
                        <DialogDescription className="text-white/70">{reward.description}</DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        <div className="p-5 bg-gradient-to-r from-concordia-light-purple/15 to-concordia-pink/15 rounded-xl border-2 border-concordia-light-purple/30 shadow-inner">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-white/80 font-semibold">Your Aura Points:</span>
                              <span className="text-concordia-pink font-bold text-xl drop-shadow-sm">{userAuraPoints}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-white/80 font-semibold">Cost per reward:</span>
                              <span className="text-concordia-pink font-bold">{reward.auraPointsCost}</span>
                            </div>
                            <div className="flex justify-between items-center border-t-2 border-concordia-light-purple/30 pt-4">
                              <span className="text-white font-bold text-lg">Total cost:</span>
                              <span className="text-concordia-pink font-bold text-2xl drop-shadow-sm">{reward.auraPointsCost * purchaseQuantity}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="quantity" className="text-white font-bold text-lg">Quantity</Label>
                          <Select value={purchaseQuantity.toString()} onValueChange={(value) => setPurchaseQuantity(Number(value))}>
                            <SelectTrigger className="bg-concordia-dark-blue/80 border-2 border-concordia-light-purple/50 text-white focus:border-concordia-pink focus:ring-2 focus:ring-concordia-pink/20 rounded-xl py-3">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-concordia-dark-blue/90 border-2 border-concordia-light-purple/50">
                              {[1, 2, 3, 4, 5].map((num) => (
                                <SelectItem key={num} value={num.toString()} className="text-white hover:bg-concordia-light-purple/20 rounded-lg">
                                  {num}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-white font-bold text-lg">Terms & Conditions</Label>
                          <div className="max-h-32 overflow-y-auto space-y-3 p-4 bg-concordia-light-purple/10 rounded-xl border-2 border-concordia-light-purple/20 shadow-inner">
                            {reward.terms.map((term, index) => (
                              <div key={index} className="flex items-start space-x-3 text-sm text-white/70">
                                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0 drop-shadow-sm" />
                                <span className="leading-relaxed">{term}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex space-x-4">
                          <Button
                            onClick={() => {
                              setSelectedReward(reward)
                              handlePurchaseReward()
                            }}
                            disabled={isLoading || reward.auraPointsCost * purchaseQuantity > userAuraPoints}
                            className="flex-1 bg-gradient-to-r from-concordia-pink to-concordia-light-purple hover:from-concordia-pink/90 hover:to-concordia-light-purple/90 text-white font-bold py-4 shadow-2xl hover:shadow-3xl transition-all duration-300 border-2 border-white/20 rounded-xl text-lg"
                          >
                            {isLoading ? "Processing..." : "Confirm Purchase"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* My Purchases Tab */}
        <TabsContent value="purchases" className="space-y-8">
          {activePurchases.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative mb-6">
                <Gift className="h-20 w-20 text-concordia-pink/50 mx-auto" />
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-concordia-pink rounded-full animate-pulse"></div>
              </div>
              <h3 className="text-white text-2xl font-semibold mb-3">No Active Purchases</h3>
              <p className="text-white/70 text-lg max-w-md mx-auto">You haven't purchased any rewards yet. Start earning Aura Points and redeem them for amazing discounts!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activePurchases.map((purchase) => (
                <Card key={purchase.id} className="bg-concordia-dark-blue/80 border-concordia-light-purple/30 hover:border-concordia-pink/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-white text-lg">{purchase.rewardName}</CardTitle>
                      <Badge className={getStatusColor(purchase.status)}>
                        {getStatusText(purchase.status)}
                      </Badge>
                    </div>
                    <CardDescription className="text-white/70">
                      Purchased on {new Date(purchase.purchaseDate).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-concordia-light-purple/10 to-concordia-pink/10 rounded-xl border border-concordia-light-purple/20">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-white/80 font-medium">Redemption Code:</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-concordia-pink font-mono text-sm font-bold">{purchase.redemptionCode}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(purchase.redemptionCode)}
                              className="h-6 w-6 p-0 text-concordia-pink hover:text-concordia-pink/80 hover:bg-concordia-pink/10 transition-colors"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-white/80">Aura Points:</span>
                            <span className="text-concordia-pink font-bold">{purchase.auraPointsSpent}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/80">Discount:</span>
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                              {purchase.discount} OFF
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/80">Valid Until:</span>
                            <span className="text-white/60">{new Date(purchase.validUntil).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-concordia-light-purple/10 rounded-xl border border-concordia-light-purple/20">
                      <p className="text-white/80 text-sm leading-relaxed">
                        <strong>How to use:</strong> Present this redemption code at the participating store or website to claim your discount.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Purchase History Tab */}
        <TabsContent value="history" className="space-y-8">
          {userPurchases.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative mb-6">
                <HistoryIcon className="h-20 w-20 text-concordia-pink/50 mx-auto" />
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-concordia-pink rounded-full animate-pulse"></div>
              </div>
              <h3 className="text-white text-2xl font-semibold mb-3">No Purchase History</h3>
              <p className="text-white/70 text-lg max-w-md mx-auto">Your purchase history will appear here once you start redeeming Aura Points.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {userPurchases.map((purchase) => (
                <Card key={purchase.id} className="bg-concordia-dark-blue/80 border-concordia-light-purple/30 hover:border-concordia-pink/50 transition-all duration-300 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3">
                        <h3 className="text-white font-semibold text-lg">{purchase.rewardName}</h3>
                        <p className="text-white/70 text-sm">
                          Purchased on {new Date(purchase.purchaseDate).toLocaleDateString()}
                        </p>
                        <div className="flex items-center space-x-6 text-sm">
                          <span className="text-white/80">Points spent: <span className="text-concordia-pink font-bold">{purchase.auraPointsSpent}</span></span>
                          <span className="text-white/80">Code: <span className="text-concordia-pink font-mono font-bold">{purchase.redemptionCode}</span></span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(purchase.status)}>
                          {getStatusText(purchase.status)}
                        </Badge>
                        <p className="text-white/60 text-sm mt-2">
                          {new Date(purchase.validUntil).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Enhanced Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="bg-concordia-dark-blue/95 border-concordia-light-purple/30 text-white max-w-md backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-concordia-pink text-xl flex items-center">
              <CheckCircle className="h-6 w-6 mr-2 text-green-400" />
              Purchase Successful!
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Your reward has been purchased and your redemption code is ready.
            </DialogDescription>
          </DialogHeader>
          
          {lastPurchase && (
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl">
                <h4 className="text-white font-semibold text-lg mb-4">{lastPurchase.rewardName}</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 font-medium">Redemption Code:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-concordia-pink font-mono font-bold text-lg">{lastPurchase.redemptionCode}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(lastPurchase.redemptionCode)}
                        className="h-6 w-6 p-0 text-concordia-pink hover:text-concordia-pink/80 hover:bg-concordia-pink/10 transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-white/80">Aura Points Spent:</span>
                      <span className="text-concordia-pink font-bold">{lastPurchase.auraPointsSpent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Valid Until:</span>
                      <span className="text-white/60">{new Date(lastPurchase.validUntil).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-concordia-light-purple/10 rounded-xl border border-concordia-light-purple/20">
                <p className="text-white/80 text-sm leading-relaxed">
                  <strong>How to use:</strong> Present this redemption code at the participating store or website to claim your {lastPurchase.discount} discount.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 bg-gradient-to-r from-concordia-pink to-concordia-light-purple hover:from-concordia-pink/80 hover:to-concordia-light-purple/80 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Continue Shopping
                </Button>
                {onBackToDashboard && (
                  <Button
                    onClick={() => {
                      setShowSuccessModal(false)
                      onBackToDashboard()
                    }}
                    variant="outline"
                    className="border-concordia-light-purple text-concordia-light-purple hover:bg-concordia-light-purple/10 transition-all duration-300"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Add History icon component
const HistoryIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
) 