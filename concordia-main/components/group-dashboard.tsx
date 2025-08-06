"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Target, Plus, Copy, Trash2, Calendar, Crown, Users } from "lucide-react"
import { useAccount, useWriteContract, useReadContract } from "wagmi"
import { GroupDetailsModal } from "./group-details-modal"
import { InviteMemberModal } from "./invite-member-modal"

import { ContributionModal } from "./contribution-modal"
import { DueDateManager } from "./due-date-manager"
import { useGroupRole } from "./iam-access-control"
import { CONCORDIA_CONTRACT_ABI } from "./smart-contract-integration"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const CONCORDIA_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x76a9C6d5EE759b0b5Ef4c7D9963523d247cBeF88") as `0x${string}`;

interface GroupMember {
  address: string
  nickname: string
  email?: string
  contributed: number
  auraPoints: number
  status: "active" | "pending" | "missed"
}

export interface SavingsGroup {
  id: string
  name: string
  goal: string
  targetAmount: number
  currentAmount: number
  contributionAmount: number
  duration: string
  endDate: string
  members: GroupMember[]
  status: "active" | "completed" | "pending"
  nextContribution: string
  createdBy: string // Address of the group creator
  createdAt?: string
  isActive: boolean // Added for closed groups
}

interface GroupDashboardProps {
  groups: SavingsGroup[]
  onDeleteGroup: (groupId: string) => void
  onContribute?: (groupId: string, amount: number) => void
  isContributing?: boolean
  setUserGroups: React.Dispatch<React.SetStateAction<SavingsGroup[]>>
  isConnected: boolean
  address: string | undefined
}

export function GroupDashboard({
  groups,
  onDeleteGroup,
  onContribute,
  isContributing,
  setUserGroups,
  isConnected,
  address,
}: GroupDashboardProps) {
  // All hooks at the top
  const { address: walletAddress } = useAccount()
  const [selectedGroup, setSelectedGroup] = useState<SavingsGroup | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [selectedGroupForInvite, setSelectedGroupForInvite] = useState<SavingsGroup | null>(null)
  const [contributionModalOpen, setContributionModalOpen] = useState(false)
  const [selectedGroupForContribution, setSelectedGroupForContribution] = useState<SavingsGroup | null>(null)
  const [dueDateModalOpen, setDueDateModalOpen] = useState(false)
  const [selectedGroupForDueDate, setSelectedGroupForDueDate] = useState<SavingsGroup | null>(null)
  

  const handleContribute = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId)
    if (group) {
      setSelectedGroupForContribution(group)
      setContributionModalOpen(true)
    }
  }

  const handleContributionSuccess = (groupId: string, amount: number, txHash: `0x${string}`, auraPoints: number) => {
    // Update the group's current amount, next contribution date, and member's aura points
    setUserGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              currentAmount: group.currentAmount + amount,
              nextContribution: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              members: group.members.map((member) =>
                member.address === walletAddress
                  ? {
                      ...member,
                      contributed: member.contributed + amount,
                      auraPoints: member.auraPoints + auraPoints,
                      status: "active" as const,
                    }
                  : member,
              ),
            }
          : group,
      ),
    )

    const isEarly = new Date() < new Date(groups.find((g) => g.id === groupId)?.nextContribution || "")
    alert(
      `Successfully contributed ${amount} BNB! Earned ${auraPoints} Aura Points${isEarly ? " with early bonus! 🎉" : ""}`,
    )
  }

  const handleDueDateUpdate = (groupId: string, newDueDay: number) => {
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    nextMonth.setDate(newDueDay)

    setUserGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              nextContribution: nextMonth.toISOString().split("T")[0],
            }
          : group,
      ),
    )
    alert(
      `Due date updated to the ${newDueDay}${newDueDay === 1 ? "st" : newDueDay === 2 ? "nd" : newDueDay === 3 ? "rd" : "th"} of each month`,
    )
  }

  const handleInviteFriend = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId)
    if (group) {
      setSelectedGroupForInvite(group)
      setInviteModalOpen(true)
    }
  }

  const handleInviteSent = (address: string, nickname: string) => {
    console.log(`Invite sent to ${address} (${nickname}) for group ${selectedGroupForInvite?.id}`)
    alert(`Invitation sent to ${nickname} (${address})`)
  }

  const handleDeleteClick = (groupId: string) => {
    if (confirm("Are you sure you want to delete this group? This action cannot be undone on the blockchain.")) {
      onDeleteGroup(groupId)
    }
  }

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

  // Calculate total saved BNB across all groups
  const totalSaved = groups.reduce((sum, group) => sum + group.currentAmount, 0)

  // Calculate total aura points for the current user across all groups
  const totalAuraPoints = groups.reduce((sum, group) => {
    const userMember = group.members.find((member) => member.address === walletAddress)
    return sum + (userMember?.auraPoints || 0)
  }, 0)

  const onTimeRate =
    groups.length > 0 ? (groups.filter((group) => group.status === "active").length / groups.length) * 100 : 0

  // Always render the same number of hooks, then conditionally render UI
  return (
    <div className="space-y-8">
      {(!isConnected || !address) ? (
        <div className="text-center py-12">
          <h3 className="text-white text-xl mb-4">Connect your wallet to view your savings groups</h3>
          <p className="text-white/70">You need to connect your wallet to access the dashboard</p>
        </div>
      ) : (
        // ... rest of the dashboard UI ...
        <>
          {/* Dashboard Header */}
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              Your <span className="text-concordia-pink">Savings Dashboard</span>
            </h2>

            {/* Aura Points Display */}
            {/* Removed Aura Points card here */}
            <p className="text-white/80 text-lg">Manage your active savings groups and track progress</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-concordia-purple/20 border-concordia-light-purple/30 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-concordia-pink mb-2">{groups.length}</div>
                <div className="text-white/80 text-sm">Active Groups</div>
              </CardContent>
            </Card>
            <Card className="bg-concordia-purple/20 border-concordia-light-purple/30 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-concordia-light-purple mb-2">{totalSaved.toFixed(3)} BNB</div>
                <div className="text-white/80 text-sm">Total Saved</div>
              </CardContent>
            </Card>
            <Card className="bg-concordia-purple/20 border-concordia-light-purple/30 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-concordia-pink mb-2">{totalAuraPoints}</div>
                <div className="text-white/80 text-sm">Your Aura Points</div>
              </CardContent>
            </Card>
            <Card className="bg-concordia-purple/20 border-concordia-light-purple/30 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-concordia-light-purple mb-2">{onTimeRate.toFixed(0)}%</div>
                <div className="text-white/80 text-sm">On-time Rate</div>
              </CardContent>
            </Card>
          </div>

          {/* Active Groups */}
          {groups.length === 0 ? (
            <Card className="bg-concordia-purple/20 border-concordia-light-purple/30 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-concordia-pink mx-auto mb-4" />
                <h3 className="text-white text-xl font-semibold mb-2">No Active Savings Groups</h3>
                <p className="text-white/70 mb-6">
                  You haven't joined any savings groups yet. Your groups will appear here once you're added to them.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {groups.filter(g => g.isActive === true).map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  walletAddress={walletAddress || ""}
                  isContributing={isContributing ?? false}
                  setUserGroups={setUserGroups}
                  onInvite={() => handleInviteFriend(group.id)}
                  onContribute={() => handleContribute(group.id)}
                  onViewDetails={() => { setSelectedGroup(group); setIsDetailsModalOpen(true); }}
                  onDueDate={() => { setSelectedGroupForDueDate(group); setDueDateModalOpen(true); }}
                />
              ))}
            </div>
          )}

          

          {/* Modals */}
          <GroupDetailsModal
            group={selectedGroup}
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false)
              setSelectedGroup(null)
            }}
          />
          <InviteMemberModal
            isOpen={inviteModalOpen}
            onClose={() => {
              setInviteModalOpen(false)
              setSelectedGroupForInvite(null)
            }}
            groupId={selectedGroupForInvite?.id || ""}
            groupName={selectedGroupForInvite?.name || ""}
            groups={groups}
            onInviteSent={handleInviteSent}
          />
          <ContributionModal
            isOpen={contributionModalOpen}
            onClose={() => {
              setContributionModalOpen(false)
              setSelectedGroupForContribution(null)
            }}
            group={selectedGroupForContribution}
            onSuccess={handleContributionSuccess}
          />
          <DueDateManager
            isOpen={dueDateModalOpen}
            onClose={() => {
              setDueDateModalOpen(false)
              setSelectedGroupForDueDate(null)
            }}
            group={selectedGroupForDueDate}
            onUpdate={handleDueDateUpdate}
          />
          
        </>
      )}
    </div>
  )
}

function GroupCard({ group, walletAddress, isContributing, setUserGroups, onInvite, onContribute, onViewDetails, onDueDate }: {
  group: SavingsGroup,
  walletAddress: string | undefined,
  isContributing: boolean,
  setUserGroups: React.Dispatch<React.SetStateAction<SavingsGroup[]>>,
  onInvite: () => void,
  onContribute: () => void,
  onViewDetails: () => void,
  onDueDate: () => void,
}) {
  const { isAdmin } = useGroupRole(group.id, [group])
  const userMember = group.members.find((member) => member.address === walletAddress)

  // 1. Add state for email modal visibility and selected member in GroupCard:
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailInput, setEmailInput] = useState(userMember?.email || "")
  const [emailError, setEmailError] = useState("")

  const openEmailModal = () => {
    setEmailInput(userMember?.email || "")
    setEmailError("")
    setEmailModalOpen(true)
  }
  const closeEmailModal = () => setEmailModalOpen(false)

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSaveEmail = () => {
    if (!validateEmail(emailInput)) {
      setEmailError("Please enter a valid email address.")
      return
    }
    setUserGroups(prev => prev.map(g => g.id === group.id ? {
      ...g,
      members: g.members.map(m => m.address === walletAddress ? { ...m, email: emailInput } : m)
    } : g))
    setEmailModalOpen(false)
    alert("Email updated successfully!")
  }

  return (
    <Card
      key={group.id}
      className={`bg-concordia-purple/20 border-concordia-light-purple/30 backdrop-blur-sm hover:border-concordia-pink/50 transition-all ${group.isActive === false ? 'opacity-50 pointer-events-none grayscale' : ''}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-xl flex items-center">
              {group.name}
              {isAdmin && <Crown className="h-4 w-4 ml-2 text-yellow-400" />}
              {group.isActive === false && (
                <span className="ml-3 px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full border border-gray-500">Closed</span>
              )}
            </CardTitle>
            <CardDescription className="text-white/70">{group.goal}</CardDescription>
          </div>
          <div className="flex flex-col items-end space-y-1">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{group.status}</Badge>
            {userMember && (
              <div className="text-xs text-concordia-pink font-semibold">
                {userMember.auraPoints} Aura Points
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
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
        {/* Group Members */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-semibold text-sm">Members ({group.members.length})</span>
            <Button
              size="sm"
              variant="outline"
              onClick={onInvite}
              className="border-concordia-light-purple/50 text-concordia-light-purple hover:bg-concordia-light-purple/10 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />Invite
            </Button>
          </div>
          <div className="space-y-2">
            {group.members.map((member, memberIndex) => (
              <div
                key={memberIndex}
                className="flex items-center justify-between p-2 bg-concordia-dark-blue/30 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-concordia-light-purple/20 text-concordia-pink text-xs">
                      {member.nickname[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-white text-sm font-medium flex items-center">
                      {member.nickname}
                      {member.address === group.createdBy && (
                        <Crown className="h-3 w-3 ml-1 text-yellow-400" />
                      )}
                    </div>
                    <div className="text-white/60 text-xs">
                      {member.contributed} BNB • {member.auraPoints} Aura
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={"w-2 h-2 rounded-full bg-green-500"}></div>
                  <span className="text-xs text-white/70">Up to date</span>
                </div>
                {member.address === walletAddress && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-2 border-concordia-pink/50 text-concordia-pink hover:bg-concordia-pink/10"
                    onClick={openEmailModal}
                  >
                    {member.email ? "Edit Email" : "Add Email"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Next Contribution */}
        <div className="bg-concordia-light-purple/10 rounded-lg p-4 border border-concordia-light-purple/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-semibold text-sm">Next Contribution</div>
              <div className="text-white/70 text-xs">
                Due: {group.nextContribution}
                {new Date() < new Date(group.nextContribution) && (
                  <span className="text-concordia-pink ml-2">🎉 Early = +5 Aura!</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-concordia-pink font-bold">{group.contributionAmount} BNB</div>
              <Button
                size="sm"
                onClick={onContribute}
                disabled={isContributing}
                className="bg-gradient-to-r from-[#F042FF] to-[#7226FF] hover:from-[#F042FF]/90 hover:to-[#7226FF]/90 text-white text-xs mt-1 font-semibold"
              >
                {isContributing ? "Contributing..." : "Contribute Now"}
              </Button>
            </div>
          </div>
        </div>
        {/* Voting & Withdrawal Section */}
        {group.status === "active" && group.currentAmount >= group.targetAmount && (
          <div className="mt-4">
            <VoteToWithdrawButton group={group} address={walletAddress || ""} setUserGroups={setUserGroups} />
          </div>
        )}
        {/* Group Actions */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            className="flex-1 border-concordia-light-purple/50 text-concordia-light-purple hover:bg-concordia-light-purple/10"
          >
            View Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDueDate}
            className="border-concordia-pink/50 text-concordia-pink hover:bg-concordia-pink/10 bg-transparent"
          >
            <Calendar className="h-4 w-4" />
          </Button>
          {/* Emergency Withdraw for group creator */}
          {isAdmin && (
            <EmergencyWithdrawButton group={group} setUserGroups={setUserGroups} />
          )}
        </div>
      </CardContent>
      {/* 3. Add a Dialog modal for email editing at the bottom of GroupCard: */}
      <Dialog open={emailModalOpen} onOpenChange={closeEmailModal}>
        <DialogContent className="bg-concordia-dark-blue border-concordia-light-purple/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-concordia-pink text-xl font-semibold">{userMember?.email ? "Edit Email" : "Add Email"}</DialogTitle>
            <DialogDescription className="text-white/70">Enter your email address to receive due date notifications.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="email" className="text-white text-sm">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={emailInput}
              onChange={e => {
                setEmailInput(e.target.value)
                setEmailError(validateEmail(e.target.value) ? "" : "Please enter a valid email address.")
              }}
              className="bg-concordia-dark-blue/50 border-concordia-light-purple/50 text-white placeholder:text-white/50 focus:border-concordia-pink focus:ring-concordia-pink/20"
            />
            {emailError && <div className="text-red-400 text-xs">{emailError}</div>}
            <div className="flex space-x-2 justify-end">
              <Button variant="ghost" onClick={closeEmailModal}>Cancel</Button>
              <Button
                className="bg-concordia-pink text-white"
                onClick={handleSaveEmail}
                disabled={!validateEmail(emailInput)}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function VoteToWithdrawButton({ group, address, setUserGroups }: { group: SavingsGroup, address: string, setUserGroups: React.Dispatch<React.SetStateAction<SavingsGroup[]>> }) {
  const { writeContract, isPending } = useWriteContract()
  const { data: groupDetails, refetch } = useReadContract({
    address: CONCORDIA_CONTRACT_ADDRESS,
    abi: CONCORDIA_CONTRACT_ABI,
    functionName: "getGroupDetails",
    args: [BigInt(group.id)],
  })
  const [hasVoted, setHasVoted] = useState(false)
  const [txStatus, setTxStatus] = useState<string | null>(null)

  const handleVote = async () => {
    setTxStatus(null)
    try {
      await writeContract({
        address: CONCORDIA_CONTRACT_ADDRESS,
        abi: CONCORDIA_CONTRACT_ABI,
        functionName: "voteForWithdrawal",
        args: [BigInt(group.id)],
      })
      setHasVoted(true)
      setTxStatus("Vote submitted! Waiting for all members...")
      // Refetch group status from contract
      const updated = await refetch()
      const updatedData = (updated as any)?.data
      if (updatedData) {
        setUserGroups(prev => prev.map(g => g.id === group.id ? { ...g, ...updatedData } : g))
      }
    } catch (err) {
      setTxStatus("Error submitting vote. Please try again.")
    }
  }

  // Hide button if group is closed
  if (groupDetails && (groupDetails as any).isActive === false) return null

  return (
    <div className="flex flex-col items-start space-y-2">
      <Button
        onClick={handleVote}
        disabled={isPending || hasVoted}
        className="bg-gradient-to-r from-concordia-pink to-concordia-light-purple text-white"
      >
        {hasVoted ? "Voted" : isPending ? "Voting..." : "Vote to Withdraw"}
      </Button>
      {txStatus && <span className="text-xs text-white/70">{txStatus}</span>}
    </div>
  )
}

function EmergencyWithdrawButton({ group, setUserGroups }: { group: SavingsGroup, setUserGroups: React.Dispatch<React.SetStateAction<SavingsGroup[]>> }) {
  const { writeContract, isPending } = useWriteContract()
  const { data: groupDetails, refetch } = useReadContract({
    address: CONCORDIA_CONTRACT_ADDRESS,
    abi: CONCORDIA_CONTRACT_ABI,
    functionName: "getGroupDetails",
    args: [BigInt(group.id)],
  })
  const [txStatus, setTxStatus] = useState<string | null>(null)

  const handleEmergencyWithdraw = async () => {
    setTxStatus(null)
    try {
      await writeContract({
        address: CONCORDIA_CONTRACT_ADDRESS,
        abi: CONCORDIA_CONTRACT_ABI,
        functionName: "emergencyWithdrawal",
        args: [BigInt(group.id)],
      })
      setTxStatus("Emergency withdrawal submitted! Funds (minus penalty) will be sent to your wallet.")
      // Refetch group status from contract
      const updated = await refetch()
      const updatedData = (updated as any)?.data
      if (updatedData) {
        setUserGroups(prev => prev.map(g => g.id === group.id ? { ...g, ...updatedData } : g))
      }
    } catch (err) {
      setTxStatus("Error submitting emergency withdrawal. Please try again.")
    }
  }

  // Hide button if group is closed
  if (groupDetails && (groupDetails as any).isActive === false) return null

  return (
    <div className="flex flex-col items-start">
      <Button
        onClick={handleEmergencyWithdraw}
        disabled={isPending}
        variant="destructive"
        className="border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent"
      >
        {isPending ? "Withdrawing..." : "Emergency Withdraw"}
      </Button>
      {txStatus && <span className="text-xs text-white/70">{txStatus}</span>}
    </div>
  )
}