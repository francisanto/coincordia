"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAccount, useContractRead, useContractWrite, useTransaction } from "wagmi"
import { opBNBTestnet } from "wagmi/chains"
import { 
  Gift, 
  Key, 
  Coins, 
  Sparkles, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  Trophy,
  Crown,
  Star,
  Zap,
  Shield
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { nftMetadataService, type AuraNFTMetadata } from "@/lib/nft-metadata-service"

// AuraRedemptionNFT Contract ABI (simplified for this example)
const AURA_REDEMPTION_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "code",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "tier",
        "type": "uint8"
      }
    ],
    "name": "redeemCode",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "code",
        "type": "string"
      }
    ],
    "name": "checkCodeStatus",
    "outputs": [
      {
        "internalType": "bool",
        "name": "isValid",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "isRedeemed",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "tier",
        "type": "uint8"
      }
    ],
    "name": "getAuraAmountForTier",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "getRedemptionCodesForAddress",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "codes",
        "type": "string[]"
      },
      {
        "internalType": "uint256[]",
        "name": "tokenIds",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// Contract address (deployed on opBNB testnet)
const AURA_REDEMPTION_CONTRACT = "0x338E8AF72E83C131B07162BDd2ACA599D53Ce3e7"

interface RedemptionCode {
  code: string;
  tier: number;
  auraAmount: number;
  tokenId: number;
  metadata?: AuraNFTMetadata;
  isRedeemed: boolean;
}

export function AuraRedemptionNFT() {
  const { address, isConnected, chainId } = useAccount()
  const { toast } = useToast()
  
  const [redemptionCode, setRedemptionCode] = useState("")
  const [selectedTier, setSelectedTier] = useState(1)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [userCodes, setUserCodes] = useState<RedemptionCode[]>([])
  const [codeStatus, setCodeStatus] = useState<{
    isValid: boolean;
    isRedeemed: boolean;
    tokenId: number;
    auraAmount: number;
  } | null>(null)

  // Check if connected to correct network
  const isWrongNetwork = isConnected && chainId !== opBNBTestnet.id

  // Contract reads
  const { data: userRedemptionData } = useContractRead({
    address: AURA_REDEMPTION_CONTRACT as `0x${string}`,
    abi: AURA_REDEMPTION_ABI,
    functionName: 'getRedemptionCodesForAddress',
    args: [address as `0x${string}`],
  })

  // Contract writes
  const { 
    data: redeemTx, 
    write: redeemCode, 
    isLoading: isRedeemingTx 
  } = useContractWrite({
    address: AURA_REDEMPTION_CONTRACT as `0x${string}`,
    abi: AURA_REDEMPTION_ABI,
    functionName: 'redeemCode',
  })

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess: isRedeemed } = useTransaction({
    hash: redeemTx?.hash,
  })

  // Load user's redemption codes
  useEffect(() => {
    if (userRedemptionData && address) {
      const [codes, tokenIds] = userRedemptionData
      const userCodesData: RedemptionCode[] = codes.map((code: string, index: number) => ({
        code,
        tier: 1, // Default tier, you might want to fetch this from metadata
        auraAmount: 100, // Default amount
        tokenId: Number(tokenIds[index]),
        isRedeemed: false
      }))
      setUserCodes(userCodesData)
    }
  }, [userRedemptionData, address])

  // Handle successful redemption
  useEffect(() => {
    if (isRedeemed) {
      toast({
        title: "🎉 Redemption Successful!",
        description: `Successfully redeemed ${codeStatus?.auraAmount || 0} Aura Points!`,
        duration: 5000,
      })
      setIsRedeeming(false)
      setRedemptionCode("")
      setCodeStatus(null)
      // Refresh user codes
      if (address) {
        // Trigger a refetch of user codes
      }
    }
  }, [isRedeemed, codeStatus, toast, address])

  // Check code status
  const checkCodeStatus = async (code: string) => {
    if (!code || !nftMetadataService.validateRedemptionCode(code)) {
      setCodeStatus(null)
      return
    }

    try {
      // In a real implementation, you would call the contract here
      // For now, we'll simulate the check
      const isValid = code.length === 8
      const isRedeemed = false
      const tokenId = Date.now()
      const auraAmount = selectedTier === 1 ? 100 : selectedTier === 2 ? 250 : selectedTier === 3 ? 500 : 1000

      setCodeStatus({
        isValid,
        isRedeemed,
        tokenId,
        auraAmount
      })
    } catch (error) {
      console.error("Error checking code status:", error)
      setCodeStatus(null)
    }
  }

  // Handle code input change
  const handleCodeChange = (value: string) => {
    const upperValue = value.toUpperCase()
    setRedemptionCode(upperValue)
    checkCodeStatus(upperValue)
  }

  // Handle redemption
  const handleRedeem = async () => {
    if (!isConnected) {
      toast({
        title: "🔗 Wallet Not Connected",
        description: "Please connect your wallet to redeem codes",
        duration: 3000,
      })
      return
    }

    if (isWrongNetwork) {
      toast({
        title: "🌐 Wrong Network",
        description: "Please switch to opBNB Testnet",
        duration: 3000,
      })
      return
    }

    if (!codeStatus?.isValid) {
      toast({
        title: "❌ Invalid Code",
        description: "Please enter a valid redemption code",
        duration: 3000,
      })
      return
    }

    if (codeStatus.isRedeemed) {
      toast({
        title: "⚠️ Already Redeemed",
        description: "This code has already been redeemed",
        duration: 3000,
      })
      return
    }

    setIsRedeeming(true)

    try {
      // Call the contract to redeem the code
      redeemCode({
        args: [redemptionCode, selectedTier as 1 | 2 | 3 | 4]
      })
    } catch (error) {
      console.error("Error redeeming code:", error)
      toast({
        title: "❌ Redemption Failed",
        description: "Failed to redeem the code. Please try again.",
        duration: 5000,
      })
      setIsRedeeming(false)
    }
  }

  // Copy code to clipboard
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: "📋 Copied!",
      description: "Redemption code copied to clipboard",
      duration: 2000,
    })
  }

  // Get tier info
  const getTierInfo = (tier: number) => {
    const tierInfo = {
      1: { name: "Basic", color: "bg-gray-500", icon: <Star className="h-4 w-4" /> },
      2: { name: "Silver", color: "bg-gray-400", icon: <Trophy className="h-4 w-4" /> },
      3: { name: "Gold", color: "bg-yellow-500", icon: <Crown className="h-4 w-4" /> },
      4: { name: "Platinum", color: "bg-purple-500", icon: <Zap className="h-4 w-4" /> }
    }
    return tierInfo[tier as keyof typeof tierInfo] || tierInfo[1]
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-concordia-pink/20 to-concordia-light-purple/20 rounded-full">
            <Gift className="h-10 w-10 text-concordia-pink" />
          </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-concordia-pink to-concordia-light-purple bg-clip-text text-transparent">
          Aura NFT Redemption
        </h1>
        <p className="text-white/80 max-w-3xl mx-auto text-lg leading-relaxed">
          Transform your Aura codes into unique NFTs and unlock exclusive rewards. Each redemption code becomes a collectible digital asset with real value.
        </p>
        <div className="flex items-center justify-center space-x-6 text-sm text-white/60">
          <div className="flex items-center space-x-1">
            <Sparkles className="h-4 w-4 text-concordia-pink" />
            <span>Collectible NFTs</span>
          </div>
          <div className="flex items-center space-x-1">
            <Shield className="h-4 w-4 text-concordia-light-purple" />
            <span>Blockchain Secured</span>
          </div>
          <div className="flex items-center space-x-1">
            <Coins className="h-4 w-4 text-yellow-400" />
            <span>Real Aura Value</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="redeem" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-concordia-dark-blue border-concordia-light-purple/30">
          <TabsTrigger value="redeem" className="text-white">Redeem Code</TabsTrigger>
          <TabsTrigger value="my-codes" className="text-white">My NFT Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="redeem" className="space-y-6">
          <Card className="bg-concordia-dark-blue border-concordia-light-purple/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Key className="mr-2 h-5 w-5 text-concordia-pink" />
                Enter Redemption Code
              </CardTitle>
              <CardDescription className="text-white/70">
                Enter your 8-character redemption code to claim your Aura Points
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="redemption-code" className="text-white">
                  Redemption Code
                </Label>
                <Input
                  id="redemption-code"
                  placeholder="Enter 8-character code (e.g., ABC12345)"
                  value={redemptionCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  maxLength={8}
                  className="bg-concordia-dark-blue border-concordia-light-purple/50 text-white placeholder:text-white/50"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-white text-lg font-semibold">Select Tier</Label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((tier) => {
                    const info = getTierInfo(tier)
                    const auraAmount = tier === 1 ? 100 : tier === 2 ? 250 : tier === 3 ? 500 : 1000
                    return (
                      <Card
                        key={tier}
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedTier === tier 
                            ? 'bg-gradient-to-br from-concordia-pink/30 to-concordia-light-purple/30 border-concordia-pink shadow-lg shadow-concordia-pink/20' 
                            : 'bg-concordia-purple/20 border-concordia-light-purple/30 hover:border-concordia-light-purple/50'
                        }`}
                        onClick={() => setSelectedTier(tier)}
                      >
                        <CardContent className="p-4 text-center space-y-2">
                          <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${info.color}`}>
                            {info.icon}
                          </div>
                          <div className="text-white font-semibold">{info.name}</div>
                          <div className="text-concordia-pink font-bold text-lg">{auraAmount}</div>
                          <div className="text-white/60 text-xs">Aura Points</div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {codeStatus && (
                <Card className="bg-concordia-dark-blue/50 border-concordia-light-purple/30">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {codeStatus.isValid ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-400" />
                        )}
                        <span className="text-white font-medium">
                          {codeStatus.isValid ? "Valid Code" : "Invalid Code"}
                        </span>
                      </div>
                      {codeStatus.isValid && (
                        <Badge className={`${codeStatus.isRedeemed ? 'bg-red-500' : 'bg-green-500'} text-white`}>
                          {codeStatus.isRedeemed ? "Redeemed" : "Available"}
                        </Badge>
                      )}
                    </div>
                    {codeStatus.isValid && (
                      <div className="mt-2 text-white/80">
                        <p>Token ID: #{codeStatus.tokenId}</p>
                        <p>Aura Amount: {codeStatus.auraAmount} points</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleRedeem}
                disabled={!codeStatus?.isValid || codeStatus?.isRedeemed || isRedeeming || isRedeemingTx || isConfirming || !isConnected || isWrongNetwork}
                className="w-full bg-gradient-to-r from-concordia-pink to-concordia-light-purple hover:from-concordia-pink/80 hover:to-concordia-light-purple/80 text-white"
              >
                {isRedeeming || isRedeemingTx || isConfirming ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    {isConfirming ? "Confirming..." : "Redeeming..."}
                  </>
                ) : (
                  <>
                    <Gift className="mr-2 h-4 w-4" />
                    Redeem Code
                  </>
                )}
              </Button>

              {!isConnected && (
                <p className="text-center text-yellow-400 text-sm">
                  🔗 Please connect your wallet to redeem codes
                </p>
              )}

              {isWrongNetwork && (
                <p className="text-center text-red-400 text-sm">
                  🌐 Please switch to opBNB Testnet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-codes" className="space-y-6">
          <Card className="bg-concordia-dark-blue border-concordia-light-purple/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Coins className="mr-2 h-5 w-5 text-concordia-pink" />
                My Redemption Codes
              </CardTitle>
              <CardDescription className="text-white/70">
                Your NFT redemption codes and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isConnected ? (
                <p className="text-center text-white/70 py-8">
                  🔗 Connect your wallet to view your redemption codes
                </p>
              ) : userCodes.length === 0 ? (
                <p className="text-center text-white/70 py-8">
                  📭 No redemption codes found in your wallet
                </p>
              ) : (
                <div className="grid gap-4">
                  {userCodes.map((code) => {
                    const tierInfo = getTierInfo(code.tier)
                    return (
                      <Card key={code.tokenId} className="bg-concordia-dark-blue/50 border-concordia-light-purple/30">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-full ${tierInfo.color}`}>
                                {tierInfo.icon}
                              </div>
                              <div>
                                <p className="text-white font-medium">{tierInfo.name} Tier</p>
                                <p className="text-white/70 text-sm">{code.auraAmount} Aura Points</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={`${code.isRedeemed ? 'bg-red-500' : 'bg-green-500'} text-white`}>
                                {code.isRedeemed ? "Redeemed" : "Available"}
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(code.code)}
                                className="border-concordia-light-purple/50 text-white hover:bg-concordia-light-purple/20 flex items-center"
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                Copy Redemption Code
                              </Button>
                            </div>
                          </div>
                          <div className="mt-3 p-3 bg-concordia-dark-blue/30 rounded-lg">
                            <p className="text-white/80 text-sm font-mono">{code.code}</p>
                            <p className="text-white/60 text-xs">Token ID: #{code.tokenId}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 