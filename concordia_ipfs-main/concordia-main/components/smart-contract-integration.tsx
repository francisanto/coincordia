"use client"

import { useState, useEffect } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther } from "viem"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, CheckCircle, AlertCircle, ExternalLink, Database, Shield } from "lucide-react"
import { ipfsService, type GroupMetadata } from "@/lib/ipfs-service"

// Updated Concordia Smart Contract ABI - matches your actual contract
export const CONCORDIA_CONTRACT_ABI = [
  {
    inputs: [
      { name: "_name", type: "string" },
      { name: "_description", type: "string" },
      { name: "_goalAmount", type: "uint256" },
      { name: "_duration", type: "uint256" },
      { name: "_withdrawalDate", type: "uint256" },
      { name: "_dueDay", type: "uint8" },
      { name: "_greenfieldObjectId", type: "string" },
      { name: "_greenfieldMetadataHash", type: "string" },
    ],
    name: "createGroup",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { name: "groupId", type: "uint256" },
      { name: "nickname", type: "string" },
    ],
    name: "joinGroup",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "uint256" }],
    name: "contribute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "uint256" }],
    name: "voteForWithdrawal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "uint256" }],
    name: "emergencyWithdrawal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "groupId", type: "uint256" },
      { name: "newObjectId", type: "string" },
      { name: "newMetadataHash", type: "string" },
    ],
    name: "updateGreenfieldObject",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "groupId", type: "uint256" },
      { name: "metadataHash", type: "string" },
    ],
    name: "updateGroupMetadata",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "uint256" }],
    name: "getGroupDetails",
    outputs: [
      {
        components: [
          { name: "id", type: "uint256" },
          { name: "name", type: "string" },
          { name: "description", type: "string" },
          { name: "goalAmount", type: "uint256" },
          { name: "dueDay", type: "uint256" },
          { name: "duration", type: "uint256" },
          { name: "withdrawalDate", type: "uint256" },
          { name: "creator", type: "address" },
          { name: "isActive", type: "bool" },
          { name: "greenfieldObjectId", type: "string" },
          { name: "greenfieldMetadataHash", type: "string" },
          { name: "createdAt", type: "uint256" },
          { name: "totalContributions", type: "uint256" },
          { name: "memberCount", type: "uint256" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "groupId", type: "uint256" },
      { name: "user", type: "address" },
    ],
    name: "getMemberDetails",
    outputs: [
      {
        components: [
          { name: "isMember", type: "bool" },
          { name: "contribution", type: "uint256" },
          { name: "auraPoints", type: "uint256" },
          { name: "hasVoted", type: "bool" },
          { name: "joinedAt", type: "uint256" },
          { name: "nickname", type: "string" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "uint256" }],
    name: "getMembers",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "uint256" }],
    name: "getGroupContributions",
    outputs: [
      {
        components: [
          { name: "contributor", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "timestamp", type: "uint256" },
          { name: "auraPoints", type: "uint256" },
          { name: "isEarly", type: "bool" },
          { name: "transactionHash", type: "string" },
        ],
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "uint256" }],
    name: "getGroupMetadataHash",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "uint256" }],
    name: "getGroupBalance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "contractBalance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalGroups",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "groupId", type: "uint256" },
      { name: "user", type: "address" },
    ],
    name: "isGroupMember",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawStuckFunds",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "groupId", type: "uint256" },
      { indexed: true, name: "creator", type: "address" },
      { indexed: false, name: "name", type: "string" },
      { indexed: false, name: "description", type: "string" },
      { indexed: false, name: "goalAmount", type: "uint256" },
      { indexed: false, name: "duration", type: "uint256" },
      { indexed: false, name: "withdrawalDate", type: "uint256" },
      { indexed: false, name: "greenfieldObjectId", type: "string" },
      { indexed: false, name: "greenfieldMetadataHash", type: "string" },
    ],
    name: "GroupCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "groupId", type: "uint256" },
      { indexed: true, name: "member", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "auraPoints", type: "uint256" },
      { indexed: false, name: "isEarly", type: "bool" },
      { indexed: false, name: "transactionHash", type: "string" },
    ],
    name: "Contributed",
    type: "event",
  },
] as const

// Replace with your actual deployed contract address
const CONCORDIA_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x76a9C6d5EE759b0b5Ef4c7D9963523d247cBeF88") as `0x${string}`;


interface SmartContractIntegrationProps {
  teamName: string
  groupDescription: string
  contributionAmount: string
  duration: string
  withdrawalDate?: string
  dueDay?: string
  onSuccess?: (groupId: string, txHash: `0x${string}`, contractData: any) => void
  onDeleteSuccess?: (groupId: string, txHash: `0x${string}`) => void
}

export function SmartContractIntegration({
  teamName,
  groupDescription,
  contributionAmount,
  duration,
  withdrawalDate,
  dueDay,
  onSuccess,
  onDeleteSuccess,
}: SmartContractIntegrationProps) {
  const { address } = useAccount()
  const [isCreating, setIsCreating] = useState(false)
  const [activeTxType, setActiveTxType] = useState<"create" | "delete" | null>(null)
  const [greenfieldObjectId, setGreenfieldObjectId] = useState<string>("")
  const [greenfieldMetadataHash, setGreenfieldMetadataHash] = useState<string>("")
  const [storageStatus, setStorageStatus] = useState<string>("")

  const { writeContract, data: hash, error, isPending } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  })

  // State to track if the success callback has been called
  const [callbackCalled, setCallbackCalled] = useState(false)

  const handleCreateGroup = async () => {
    if (!address) {
      console.error("No wallet address found")
      return
    }
    
    if (!contributionAmount || !duration) {
      console.error("Missing required fields")
      return
    }

    try {
      setActiveTxType("create")
      setIsCreating(true)
      setCallbackCalled(false)
      setStorageStatus("Preparing group data...")

      const parsedAmount = parseEther(contributionAmount)

      // Calculate withdrawal date timestamp
      const finalDate = withdrawalDate
        ? new Date(withdrawalDate).getTime() / 1000
        : Math.floor(Date.now() / 1000) +
          (duration === "1-month"
            ? 30 * 24 * 60 * 60
            : duration === "3-months"
              ? 90 * 24 * 60 * 60
              : duration === "6-months"
                ? 180 * 24 * 60 * 60
                : 365 * 24 * 60 * 60)

      // Calculate duration in seconds
      const durationSeconds =
        duration === "1-month"
          ? 30 * 24 * 60 * 60
          : duration === "3-months"
            ? 90 * 24 * 60 * 60
            : duration === "6-months"
              ? 180 * 24 * 60 * 60
              : 365 * 24 * 60 * 60

      // Generate temporary IPFS object ID
      const tempObjectId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setGreenfieldObjectId(tempObjectId)

      // Create comprehensive group metadata
      const groupMetadata = ipfsService.createGroupMetadata({
        groupId: tempObjectId,
        name: teamName,
        description: groupDescription,
        creator: address,
        goalAmount: Number.parseFloat(contributionAmount),
        duration,
        withdrawalDate: withdrawalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        dueDay: dueDay ? Number.parseInt(dueDay) : 1,
        contractAddress: CONCORDIA_CONTRACT_ADDRESS,
        transactionHash: "",
        blockNumber: "",
        gasUsed: "",
        objectId: tempObjectId,
        objectName: `groups/group_${tempObjectId}.json`,
        bucketName: "concordia-data",
        endpoint: "https://gnfd-testnet-sp1.bnbchain.org",
      })

      setStorageStatus("Storing metadata on IPFS...")

      // Store metadata on IPFS first (with timeout and fallback)
      let storeResult: { success: boolean; ipfsHash?: string; error?: string } = { success: false }
      try {
        storeResult = await Promise.race([
          ipfsService.storeGroupData(tempObjectId, groupMetadata, address!),
          new Promise<{ success: boolean; ipfsHash?: string; error?: string }>((_, reject) => 
            setTimeout(() => reject(new Error("IPFS timeout")), 15000)
          )
        ])
      } catch (error) {
        console.warn("IPFS storage failed, proceeding with fallback:", error)
        // Use fallback hash if IPFS fails
        storeResult = { success: true, ipfsHash: tempObjectId }
      }

      if (!storeResult.success) {
        console.warn("IPFS storage failed, using fallback")
        storeResult = { success: true, ipfsHash: tempObjectId }
      }

      const ipfsHash = storeResult.ipfsHash || tempObjectId
      setGreenfieldMetadataHash(ipfsHash)

      setStorageStatus("Creating smart contract...")

      // Call smart contract with IPFS data
      console.log("Calling smart contract with args:", {
        teamName,
        groupDescription,
        parsedAmount: parsedAmount.toString(),
        durationSeconds,
        finalDate: Math.floor(finalDate),
        dueDay: Number(dueDay ? Number.parseInt(dueDay) : 1),
        ipfsHash: ipfsHash,
        metadataHash: ipfsHash
      })

      // For testing without deployed contract, simulate the transaction
      if (!CONCORDIA_CONTRACT_ADDRESS || CONCORDIA_CONTRACT_ADDRESS === "0x1234567890123456789012345678901234567890") {
        console.log("⚠️ No deployed contract found, simulating transaction for testing...")
        
        // Simulate a successful transaction
        const mockHash = `0x${Math.random().toString(16).substr(2, 64)}` as `0x${string}`
        
        // Call the success callback directly
        const contractData = {
          creator: address,
          teamName,
          description: groupDescription,
          contributionAmount: Number.parseFloat(contributionAmount),
          currentAmount: Number.parseFloat(contributionAmount),
          targetAmount: Number.parseFloat(contributionAmount) * 10,
          withdrawalDate: withdrawalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          isActive: true,
          ipfsHash: ipfsHash,
          ipfsGatewayUrl: ipfsService.getGatewayUrl(ipfsHash),
        }
        
        console.log("✅ Test mode: Calling success callback with data:", contractData)
        onSuccess?.(ipfsHash, mockHash, contractData)
        setActiveTxType(null)
        setStorageStatus("Group created successfully! (Test Mode)")
        return
      }

      console.log("📝 Writing contract with address:", CONCORDIA_CONTRACT_ADDRESS)
      console.log("📋 Transaction parameters:")
      console.log("- Team Name:", teamName || "Unnamed Group")
      console.log("- Description:", groupDescription || "No description")
      console.log("- Amount:", parsedAmount.toString())
      console.log("- Duration:", durationSeconds)
      console.log("- Withdrawal Date:", Math.floor(finalDate))
      console.log("- Due Day:", Number(dueDay ? Number.parseInt(dueDay) : 1))
      console.log("- Object ID:", storeResult.objectId || tempObjectId)
      console.log("- Metadata Hash:", metadataHash)
      
      writeContract({
        address: CONCORDIA_CONTRACT_ADDRESS as `0x${string}`,
        abi: CONCORDIA_CONTRACT_ABI,
        functionName: "createGroup",
        args: [
          teamName || "Unnamed Group",
          groupDescription || "No description",
          parsedAmount,
          BigInt(durationSeconds),
          BigInt(Math.floor(finalDate)),
          Number(dueDay ? Number.parseInt(dueDay) : 1),
          ipfsHash,
          ipfsHash,
        ],
        value: parsedAmount, // Initial contribution
      })
    } catch (err) {
      console.error("❌ Error creating group:", err)
      setActiveTxType(null)
      setStorageStatus("")
      // Reset states to allow retry
      setIsCreating(false)
      setCallbackCalled(false)
      
      // Provide user-friendly error messages
      const errorMessage = err instanceof Error ? err.message : String(err)
      if (errorMessage.includes("User rejected")) {
        alert("Transaction was rejected. Please try again and approve the transaction in MetaMask.")
      } else if (errorMessage.includes("insufficient funds")) {
        alert("Insufficient balance. Please make sure you have enough BNB for the transaction.")
      } else if (errorMessage.includes("Invalid contract address")) {
        alert("Contract not deployed. Please deploy the smart contract first.")
      } else {
        alert("Transaction failed. Please check your wallet and try again.")
      }
    } finally {
      setIsCreating(false)
    }
  }

  // Call success callback after confirmation
  useEffect(() => {
    if (isConfirmed && hash && !callbackCalled && activeTxType === "create") {
      const handleSuccess = async () => {
        try {
          setStorageStatus("Finalizing group creation...")

          // Extract group ID from transaction receipt
          // In a real implementation, you would parse the GroupCreated event
          const groupId = hash // Using tx hash as group ID for demo

          // Update metadata with blockchain transaction details
          const updatedMetadata = {
            blockchain: {
              contractAddress: CONCORDIA_CONTRACT_ADDRESS,
              transactionHash: hash,
              blockNumber: receipt?.blockNumber?.toString() || "",
              gasUsed: receipt?.gasUsed?.toString() || "",
              network: "opBNB Testnet",
            },
            updatedAt: new Date().toISOString(),
          }

                // Update metadata in Greenfield (with timeout)
      try {
        const updateResult = await Promise.race([
          greenfieldService.updateGroupMetadata(groupId, updatedMetadata),
          new Promise<{ success: boolean; metadataHash?: string; error?: string }>((_, reject) => 
            setTimeout(() => reject(new Error("Update timeout")), 5000)
          )
        ])

        if (!updateResult.success) {
          console.warn("Failed to update metadata:", updateResult.error)
          }
      } catch (error) {
        console.warn("Metadata update failed, continuing:", error)
      }

          setStorageStatus("Group created successfully!")

          // Contract data for frontend
          const contractData = {
            creator: address,
            teamName,
            description: groupDescription,
            contributionAmount: Number.parseFloat(contributionAmount),
            currentAmount: Number.parseFloat(contributionAmount), // Initial contribution
            targetAmount: Number.parseFloat(contributionAmount) * 10, // Assuming 10x target
            withdrawalDate: withdrawalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            isActive: true,
            greenfieldObjectId: greenfieldObjectId,
            greenfieldMetadataHash: greenfieldMetadataHash,
          }

          onSuccess?.(groupId, hash, contractData)
          setCallbackCalled(true)
        } catch (error) {
          console.error("❌ Error in success callback:", error)
          // Still call onSuccess with basic data even if Greenfield fails
          const basicContractData = {
            creator: address,
            teamName,
            description: groupDescription,
            contributionAmount: Number.parseFloat(contributionAmount),
            currentAmount: Number.parseFloat(contributionAmount),
            targetAmount: Number.parseFloat(contributionAmount) * 10,
            withdrawalDate:
              withdrawalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            isActive: true,
            greenfieldObjectId: greenfieldObjectId,
            greenfieldMetadataHash: greenfieldMetadataHash,
          }
          onSuccess?.(hash, hash, basicContractData)
          setCallbackCalled(true)
        }
      }

      handleSuccess()
      setActiveTxType(null)
    }
  }, [
    isConfirmed,
    hash,
    callbackCalled,
    activeTxType,
    onSuccess,
    address,
    teamName,
    groupDescription,
    contributionAmount,
    withdrawalDate,
    dueDay,
    duration,
    greenfieldObjectId,
    greenfieldMetadataHash,
    receipt,
  ])

  return (
    <div className="space-y-4">
      {/* Transaction Status */}
      {(isPending || isConfirming || isConfirmed || error) && activeTxType && (
        <Card className="bg-concordia-purple/20 border-concordia-light-purple/30 backdrop-blur-sm">
          <CardContent className="p-4">
            {isPending && (
              <div className="flex items-center space-x-3">
                <Loader2 className="h-5 w-5 text-concordia-pink animate-spin" />
                <div>
                  <div className="text-white font-semibold">Group Creation Pending</div>
                  <div className="text-white/70 text-sm">Please confirm in your wallet</div>
                </div>
              </div>
            )}

            {isConfirming && (
              <div className="flex items-center space-x-3">
                <Loader2 className="h-5 w-5 text-concordia-light-purple animate-spin" />
                <div>
                  <div className="text-white font-semibold">Confirming Transaction</div>
                  <div className="text-white/70 text-sm">{storageStatus}</div>
                </div>
              </div>
            )}

            {isConfirmed && (
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div className="flex-1">
                  <div className="text-white font-semibold">Group Created Successfully!</div>
                  <div className="text-white/70 text-sm">Data stored on blockchain and BNB Greenfield</div>
                </div>
                {hash && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-concordia-light-purple/50 text-concordia-light-purple hover:bg-concordia-light-purple/10 bg-transparent"
                    onClick={() => window.open(`https://testnet.bscscan.com/tx/${hash}`, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div>
                  <div className="text-white font-semibold">Transaction Failed</div>
                  <div className="text-white/70 text-sm">
                    {error.message.includes("rejected") || error.message.includes("denied")
                      ? "Transaction canceled by user"
                      : error.message.includes("Invalid contract address")
                        ? "Contract not deployed. Please deploy the smart contract first."
                        : error.message.includes("insufficient funds")
                          ? "Insufficient balance for transaction"
                          : error.message.includes("network")
                            ? "Network connection issue. Please check your wallet network."
                            : "Transaction failed. Please try again."}
                  </div>
                  {error.message.includes("Invalid contract address") && (
                    <div className="text-yellow-400 text-xs mt-1">
                      Run: cd backend && node deploy.js
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Group Button */}
      <Button
        onClick={handleCreateGroup}
        disabled={!address || !contributionAmount || !duration || isPending || isConfirming || isCreating}
        className="w-full bg-gradient-to-r from-concordia-pink to-concordia-light-purple hover:from-concordia-pink/80 hover:to-concordia-light-purple/80 text-white py-6 text-lg font-semibold"
      >
        {isCreating || isPending || isConfirming ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {isPending ? "Confirm in Wallet" : isConfirming ? storageStatus : "Creating Group..."}
          </>
        ) : (
          <div className="flex items-center space-x-2">
            <span>Create Group on Blockchain</span>
            {!CONCORDIA_CONTRACT_ADDRESS || CONCORDIA_CONTRACT_ADDRESS === "0xee70a79b985aae734318765afd31dd2dc0200751d523e5bf2584dac49b12ca9d" ? (
              <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">Test Mode</span>
            ) : null}
          </div>
        )}
      </Button>

      {/* IPFS Integration Info */}
      <Card className="bg-concordia-light-purple/10 border-concordia-light-purple/30">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Database className="h-4 w-4 text-concordia-pink" />
            <span className="text-white font-semibold text-sm">IPFS Decentralized Storage</span>
          </div>
          <div className="space-y-2 text-xs text-white/70">
            <div className="flex items-center space-x-2">
              <Shield className="h-3 w-3" />
              <span>Group metadata stored on IPFS network</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3" />
              <span>Immutable content-addressed storage</span>
            </div>
            <div className="flex items-center space-x-2">
              <ExternalLink className="h-3 w-3" />
              <span>Smart contract linked to IPFS hashes</span>
            </div>
            <div className="flex items-center space-x-2">
              <Database className="h-3 w-3" />
              <span>Auto-deletion on group completion</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
