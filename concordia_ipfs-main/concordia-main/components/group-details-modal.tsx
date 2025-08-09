"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar, Users, DollarSign, Clock, ShieldCheck, Tag, Coins, Copy, ExternalLink } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import ArweaveStorageInfo from "./ArweaveStorageInfo"
import ArweaveStatusChecker from "./ArweaveStatusChecker"
import type { SavingsGroup } from "./group-dashboard"

interface GroupDetailsModalProps {
  group: SavingsGroup | null
  isOpen: boolean
  onClose: () => void
}

export function GroupDetailsModal({ group, isOpen, onClose }: GroupDetailsModalProps) {
  if (!group) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      case "missed":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Up to date"
      case "pending":
        return "Payment due"
      case "missed":
        return "Payment missed"
      default:
        return "Unknown"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-concordia-dark-blue border-concordia-light-purple/30 text-white max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-concordia-pink text-3xl font-orbitron mb-2">{group.name}</DialogTitle>
          <DialogDescription className="text-white/70 text-lg">{group.goal}</DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] py-4 space-y-6 pr-2">
          {/* Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 bg-concordia-purple/20 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-concordia-pink" />
              <div>
                <div className="text-white/70 text-sm">Target</div>
                <div className="text-white font-bold">{group.targetAmount} BNB</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-concordia-purple/20 p-3 rounded-lg">
              <Coins className="h-6 w-6 text-concordia-light-purple" />
              <div>
                <div className="text-white/70 text-sm">Current</div>
                <div className="text-white font-bold">{group.currentAmount} BNB</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-concordia-purple/20 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-concordia-pink" />
              <div>
                <div className="text-white/70 text-sm">End Date</div>
                <div className="text-white font-bold">{group.endDate}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-concordia-purple/20 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-concordia-light-purple" />
              <div>
                <div className="text-white/70 text-sm">Duration</div>
                <div className="text-white font-bold">{group.duration}</div>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/80">Progress</span>
              <span className="text-concordia-pink font-semibold">
                {group.currentAmount} / {group.targetAmount} BNB
              </span>
            </div>
            <Progress
              value={(group.currentAmount / group.targetAmount) * 100}
              className="h-2 bg-concordia-light-purple/20"
            />
            <div className="text-xs text-white/60 mt-1">
              {Math.round((group.currentAmount / group.targetAmount) * 100)}% complete
            </div>
          </div>

          {/* Members */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white font-semibold text-xl flex items-center">
                <Users className="h-5 w-5 mr-2 text-concordia-pink" />
                Members ({group.members.length})
              </h3>
              {group.inviteCode && (
                <div className="flex items-center bg-concordia-purple/30 px-3 py-1 rounded-md">
                  <span className="text-white/90 text-sm mr-2">Invite Code: <span className="font-mono font-bold">{group.inviteCode}</span></span>
                  <button
                     onClick={() => {
                       navigator.clipboard.writeText(group.inviteCode);
                       toast({
                         title: "✅ Copied",
                         description: "Invite code copied to clipboard",
                       });
                     }}
                     className="h-7 w-7 p-0 bg-transparent hover:bg-concordia-light-purple/20 rounded-full flex items-center justify-center"
                   >
                     <Copy className="h-3.5 w-3.5 text-white/70" />
                   </button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {group.members.map((member, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-concordia-dark-blue/30 rounded-lg border border-concordia-light-purple/20"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-concordia-light-purple/20 text-concordia-pink text-xs">
                        {member.nickname[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-white text-sm font-medium">{member.nickname}</div>
                      <div className="text-white/60 text-xs">{member.contributed} BNB contributed</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={"w-2 h-2 rounded-full " + getStatusColor(member.status)}></div>
                    <span className="text-xs text-white/70">{getStatusText(member.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Withdrawal Policy (clarified) */}
          <div className="bg-concordia-light-purple/10 rounded-lg p-4 border border-concordia-light-purple/20 flex items-start space-x-3">
            <ShieldCheck className="h-5 w-5 text-concordia-pink mt-0.5" />
            <div>
              <h4 className="text-white font-semibold text-sm">Withdrawal Policy</h4>
              <p className="text-white/70 text-sm">
                Funds are locked in the smart contract for the chosen duration. Early withdrawal requires **unanimous
                agreement** from all current group members, implemented via multi-signature or a voting mechanism on the
                smart contract. This ensures collective commitment to the savings goal.
              </p>
            </div>
          </div>

          {/* Group ID */}
          <div className="bg-concordia-light-purple/10 rounded-lg p-4 border border-concordia-light-purple/20 flex items-start space-x-3">
            <Tag className="h-5 w-5 text-concordia-pink mt-0.5" />
            <div>
              <h4 className="text-white font-semibold text-sm">Group ID (Smart Contract Address / Hash)</h4>
              <p className="text-white/70 text-sm break-all font-mono">{group.id}</p>
              <p className="text-white/60 text-xs mt-1">
                This is the unique identifier for your group on the blockchain.
              </p>
            </div>
          </div>
          
          {/* Storage Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* IPFS Storage */}
            <div className="bg-concordia-light-purple/10 rounded-lg p-4 border border-concordia-light-purple/20">
              <h4 className="text-white font-semibold text-sm mb-3 flex items-center">
                <Tag className="h-4 w-4 mr-2 text-concordia-light-purple" />
                IPFS Storage
              </h4>
              {group.ipfsHash ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-xs">IPFS Hash:</span>
                    <span className="text-white text-xs font-mono bg-concordia-dark-blue/50 px-2 py-1 rounded">
                      {group.ipfsHash.substring(0, 6)}...{group.ipfsHash.substring(group.ipfsHash.length - 6)}
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs h-8 mt-2" 
                    onClick={() => group.ipfsGatewayUrl && window.open(group.ipfsGatewayUrl, '_blank')}
                    disabled={!group.ipfsGatewayUrl}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View on IPFS Gateway
                  </Button>
                </div>
              ) : (
                <div className="text-white/60 text-xs">Not stored on IPFS yet</div>
              )}
            </div>
            
            {/* Arweave Storage */}
            <ArweaveStorageInfo
              transactionId={group.arweaveTransactionId}
              status={group.arweaveStatus}
              timestamp={group.arweaveTimestamp}
              onViewTransaction={(txId) => window.open(`https://viewblock.io/arweave/tx/${txId}`, '_blank')}
            />
            
            {/* Arweave Status Checker (only show if transaction is pending) */}
            {group.arweaveTransactionId && group.arweaveStatus === 'pending' && (
              <div className="col-span-2 mt-2 bg-concordia-dark-blue/30 p-2 rounded-md border border-concordia-light-purple/20">
                <ArweaveStatusChecker
                  groupId={group.id}
                  transactionId={group.arweaveTransactionId}
                  userAddress={group.members[0]?.address || ''}
                  initialStatus={group.arweaveStatus}
                  onStatusUpdate={(status) => {
                    // In a real app, this would update the group's status in state/storage
                    console.log(`Arweave status updated to: ${status}`);
                    // Update the UI immediately
                    group.arweaveStatus = status;
                    group.arweaveTimestamp = new Date().toISOString();
                  }}
                />
              </div>
            )}
          </div>

          {/* Payment Schedule */}
          <div>
            <h3 className="text-white font-semibold text-xl mb-3 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-concordia-pink" />
              Payment Schedule
            </h3>
            <div className="bg-concordia-purple/20 rounded-lg p-4 border border-concordia-light-purple/20">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/70">Contribution Amount:</span>
                  <div className="text-white font-semibold">{group.contributionAmount} BNB</div>
                </div>
                <div>
                  <span className="text-white/70">Next Due Date:</span>
                  <div className="text-white font-semibold">{group.nextContribution}</div>
                </div>
                <div>
                  <span className="text-white/70">Frequency:</span>
                  <div className="text-white font-semibold">Monthly</div>
                </div>
                <div>
                  <span className="text-white/70">Total Periods:</span>
                  <div className="text-white font-semibold">
                    {group.duration === "1-month"
                      ? "1"
                      : group.duration === "3-months"
                        ? "3"
                        : group.duration === "6-months"
                          ? "6"
                          : "12"}{" "}
                    months
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div>
            <h3 className="text-white font-semibold text-xl mb-3 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-concordia-pink" />
              Recent Activity
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-concordia-dark-blue/30 rounded-lg border border-concordia-light-purple/20">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div>
                    <div className="text-white text-sm font-medium">Group Created</div>
                    <div className="text-white/60 text-xs">Initial contribution made</div>
                  </div>
                </div>
                <div className="text-concordia-pink text-sm font-semibold">+{group.contributionAmount} BNB</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
