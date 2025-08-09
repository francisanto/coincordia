"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, CheckCircle, AlertCircle, ExternalLink, Coins } from "lucide-react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther } from "viem"
import type { SavingsGroup } from "./group-dashboard"

// Smart contract ABI for contribution
const CONTRIBUTION_ABI = [
  {
    inputs: [{ name: "_groupId", type: "uint256" }],
    name: "contribute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const

const CONCORDIA_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x76a9C6d5EE759b0b5Ef4c7D9963523d247cBeF88") as `0x${string}`;

interface ContributionModalProps {
  isOpen: boolean
  onClose: () => void
  group: SavingsGroup | null
  onSuccess: (groupId: string, amount: number, txHash: `0x${string}`, auraPoints: number) => void
}

export function ContributionModal({ isOpen, onClose, group, onSuccess }: ContributionModalProps) {
  const { address } = useAccount()
  const [isContributing, setIsContributing] = useState(false)
  const [callbackCalled, setCallbackCalled] = useState(false)

  const { writeContract, data: hash, error, isPending } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  })

  const calculateAuraPoints = () => {
    if (!group) return 10 // Base points

    const today = new Date()
    const dueDate = new Date(group.nextContribution)
    const isEarly = today < dueDate

    // Base points: 10, Early contribution bonus: +5
    return isEarly ? 15 : 10
  }

  const handleContribute = async () => {
    if (!address || !group) return

    try {
      setIsContributing(true)
      setCallbackCalled(false)

      const parsedAmount = parseEther(group.contributionAmount.toString())

      // Call smart contract contribute function
      writeContract({
        address: CONCORDIA_CONTRACT_ADDRESS,
        abi: CONTRIBUTION_ABI,
        functionName: "contribute",
        args: [BigInt(group.id)],
        value: parsedAmount,
      })
    } catch (err) {
      console.error("Error contributing:", err)
    } finally {
      setIsContributing(false)
    }
  }

  useEffect(() => {
    if (isConfirmed && hash && !callbackCalled && group) {
      const handleSuccess = async () => {
        try {
          const auraPoints = calculateAuraPoints()

          // Update BNB Greenfield with new contribution data
          await updateContributionInGreenfield(group.id, {
            contributor: address,
            amount: group.contributionAmount,
            auraPoints,
            timestamp: new Date().toISOString(),
            transactionHash: hash,
            isEarly: new Date() < new Date(group.nextContribution),
          })

          onSuccess(group.id, group.contributionAmount, hash, auraPoints)
          setCallbackCalled(true)

          setTimeout(() => {
            onClose()
          }, 2000)
        } catch (error) {
          console.error("Error updating Greenfield:", error)
          // Still call onSuccess even if Greenfield update fails
          onSuccess(group.id, group.contributionAmount, hash, calculateAuraPoints())
          setCallbackCalled(true)
        }
      }

      handleSuccess()
    }
  }, [isConfirmed, hash, callbackCalled, group, onSuccess, onClose, address])

  if (!group) return null

  const auraPointsToEarn = calculateAuraPoints()
  const isEarlyContribution = new Date() < new Date(group.nextContribution)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-concordia-dark-blue border-concordia-light-purple/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-concordia-pink text-xl font-semibold">Make Contribution</DialogTitle>
          <DialogDescription className="text-white/70">Contribute to "{group.name}" savings group</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contribution Details */}
          <Card className="bg-concordia-purple/20 border-concordia-light-purple/30">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Coins className="h-5 w-5 text-concordia-pink" />
                  <span className="text-white font-semibold">Contribution Amount</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-concordia-pink">{group.contributionAmount} BNB</div>
                  <div className="text-xs text-white/60">≈ ${(group.contributionAmount * 300).toFixed(2)} USD</div>
                </div>
              </div>

              <div className="bg-concordia-dark-blue/50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Group:</span>
                  <span className="text-white">{group.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Due Date:</span>
                  <span className="text-white">{group.nextContribution}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Aura Points:</span>
                  <span className="text-concordia-pink font-semibold">
                    +{auraPointsToEarn} {isEarlyContribution && "🎉 Early Bonus!"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Network:</span>
                  <span className="text-white">opBNB Testnet</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Status */}
          {(isPending || isConfirming || isConfirmed || error) && (
            <Card className="bg-concordia-purple/20 border-concordia-light-purple/30">
              <CardContent className="p-4">
                {isPending && (
                  <div className="flex items-center space-x-3">
                    <Loader2 className="h-5 w-5 text-concordia-pink animate-spin" />
                    <div>
                      <div className="text-white font-semibold">Contribution Pending</div>
                      <div className="text-white/70 text-sm">Please confirm in your wallet</div>
                    </div>
                  </div>
                )}

                {isConfirming && (
                  <div className="flex items-center space-x-3">
                    <Loader2 className="h-5 w-5 text-concordia-light-purple animate-spin" />
                    <div>
                      <div className="text-white font-semibold">Confirming Transaction</div>
                      <div className="text-white/70 text-sm">Updating BNB Greenfield...</div>
                    </div>
                  </div>
                )}

                {isConfirmed && (
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <div className="flex-1">
                      <div className="text-white font-semibold">Contribution Successful!</div>
                      <div className="text-white/70 text-sm">
                        Earned {auraPointsToEarn} Aura Points {isEarlyContribution && "with early bonus!"}
                      </div>
                    </div>
                    {hash && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-concordia-light-purple/50 text-concordia-light-purple hover:bg-concordia-light-purple/10 bg-transparent"
                        onClick={() => window.open("https://testnet.bscscan.com/tx/" + hash, "_blank")}
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
                          : "Network error occurred"}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isPending || isConfirming}
              className="flex-1 border-concordia-light-purple/50 text-concordia-light-purple hover:bg-concordia-light-purple/10 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleContribute}
              disabled={!address || isPending || isConfirming || isContributing || isConfirmed}
              className="flex-1 bg-gradient-to-r from-concordia-pink to-concordia-light-purple hover:from-concordia-pink/80 hover:to-concordia-light-purple/80 text-white"
            >
              {isContributing || isPending || isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isPending ? "Confirm in Wallet" : "Contributing..."}
                </>
              ) : isConfirmed ? (
                "Contributed!"
              ) : (
                `Contribute ${group.contributionAmount} BNB`
              )}
            </Button>
          </div>

          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5" />
              <div className="text-xs text-yellow-200">
                <div className="font-semibold mb-1">Important:</div>
                <div>
                  Make sure you have enough BNB in your wallet to cover the contribution amount plus gas fees
                  (approximately 0.001 BNB).
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// BNB Greenfield update function for contributions
async function updateContributionInGreenfield(groupId: string, contributionData: any): Promise<void> {
  try {
    console.log("Updating contribution in BNB Greenfield:", { groupId, contributionData })

    // Mock API delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    console.log("Successfully updated contribution in BNB Greenfield")
  } catch (error) {
    console.error("Error updating contribution in BNB Greenfield:", error)
    throw error
  }
}
