"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Users, 
  Calendar, 
  Clock, 
  DollarSign, 
  UserPlus, 
  Settings, 
  Trash2, 
  CalendarClock,
  AlertCircle
} from "lucide-react"
import { InviteMemberModal } from "./invite-member-modal"
import { DueDateManager } from "./due-date-manager"
import { FinalDateManager } from "./final-date-manager"
import { GroupDetailsModal } from "./group-details-modal"
import { Dispatch, SetStateAction } from "react"

// Define the SavingsGroup interface
export interface SavingsGroup {
  id: string
  name: string
  goal: string
  targetAmount: number
  currentAmount: number
  contributionAmount: number
  duration: string
  endDate?: string
  members: {
    address: string
    nickname: string
    contributed: number
    auraPoints: number
    status: string
  }[]
  status: string
  nextContribution: string
  createdBy: string
  createdAt: string
  isActive: boolean
  inviteCode?: string
}

interface GroupDashboardProps {
  groups: SavingsGroup[]
  onDeleteGroup: (groupId: string) => void
  onContribute: (groupId: string) => void
  isContributing: boolean
  setUserGroups: Dispatch<SetStateAction<SavingsGroup[]>>
  isConnected: boolean
  address?: string
}

export function GroupDashboard({ 
  groups, 
  onDeleteGroup, 
  onContribute, 
  isContributing,
  setUserGroups,
  isConnected,
  address
}: GroupDashboardProps) {
  const [selectedGroupForDetails, setSelectedGroupForDetails] = useState<SavingsGroup | null>(null)
  const [selectedGroupForInvite, setSelectedGroupForInvite] = useState<SavingsGroup | null>(null)
  const [selectedGroupForDueDate, setSelectedGroupForDueDate] = useState<SavingsGroup | null>(null)
  const [selectedGroupForFinalDate, setSelectedGroupForFinalDate] = useState<SavingsGroup | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [dueDateModalOpen, setDueDateModalOpen] = useState(false)
  const [finalDateModalOpen, setFinalDateModalOpen] = useState(false)

  const handleInviteFriend = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId)
    if (group) {
      setSelectedGroupForInvite(group)
      setInviteModalOpen(true)
    }
  }
  
  const handleFinalDate = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId)
    if (group) {
      setSelectedGroupForFinalDate(group)
      setFinalDateModalOpen(true)
    }
  }

  const handleDueDate = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId)
    if (group) {
      setSelectedGroupForDueDate(group)
      setDueDateModalOpen(true)
    }
  }

  const handleViewDetails = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId)
    if (group) {
      setSelectedGroupForDetails(group)
      setDetailsModalOpen(true)
    }
  }

  const handleUpdateDueDay = (groupId: string, newDueDay: number) => {
    setUserGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === groupId 
          ? {
              ...group,
              nextContribution: calculateNextContributionDate(newDueDay)
            }
          : group
      )
    )
  }

  const handleUpdateFinalDate = (groupId: string, newFinalDate: string) => {
    setUserGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === groupId 
          ? {
              ...group,
              endDate: newFinalDate
            }
          : group
      )
    )
  }

  const calculateNextContributionDate = (day: number) => {
    const today = new Date()
    const nextDate = new Date()
    
    // Set to the specified day of current month
    nextDate.setDate(day)
    
    // If that day has passed this month, move to next month
    if (nextDate < today) {
      nextDate.setMonth(nextDate.getMonth() + 1)
    }
    
    return nextDate.toISOString().split('T')[0]
  }

  const handleInviteSent = (address: string, nickname: string) => {
    if (!selectedGroupForInvite) return
    
    // Add the new member to the group
    setUserGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === selectedGroupForInvite.id 
          ? {
              ...group,
              members: [
                ...group.members,
                {
                  address,
                  nickname,
                  contributed: 0,
                  auraPoints: 0,
                  status: "pending"
                }
              ]
            }
          : group
      )
    )
  }

  // Format duration for display
  const formatDuration = (duration: string) => {
    switch (duration) {
      case "1-month": return "1 Month"
      case "3-months": return "3 Months"
      case "6-months": return "6 Months"
      case "12-months": return "1 Year"
      default: return duration
    }
  }

  return (
    <div className="space-y-8">
      {groups.length === 0 ? (
        <Card className="bg-concordia-dark-blue/80 border-concordia-light-purple/30 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 p-4 bg-concordia-purple/20 rounded-full w-fit">
              <Users className="h-12 w-12 text-concordia-light-purple" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No Savings Groups Yet</h3>
            <p className="text-white/70 mb-6">
              Create a new savings group or join an existing one to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groups.map((group) => (
            <Card 
              key={group.id} 
              className="bg-gradient-to-br from-concordia-dark-blue/90 to-concordia-purple/20 border-concordia-light-purple/30 hover:border-concordia-light-purple/50 transition-all duration-300 backdrop-blur-sm"
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white text-xl font-bold">{group.name}</CardTitle>
                    <CardDescription className="text-white/70">{group.goal}</CardDescription>
                  </div>
                  <Badge 
                    className={
                      group.status === "active" 
                        ? "bg-green-500/20 text-green-400 border-green-500/30" 
                        : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    }
                  >
                    {group.status === "active" ? "Active" : "Completed"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Progress</span>
                    <span className="text-white font-medium">
                      {group.currentAmount} / {group.targetAmount} BNB
                    </span>
                  </div>
                  <Progress 
                    value={(group.currentAmount / group.targetAmount) * 100} 
                    className="h-2 bg-concordia-light-purple/20" 
                  />
                  <div className="text-xs text-white/60">
                    {Math.round((group.currentAmount / group.targetAmount) * 100)}% complete
                  </div>
                </div>

                {/* Group Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-concordia-pink" />
                    <div>
                      <div className="text-white/70">Duration</div>
                      <div className="text-white">{formatDuration(group.duration)}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-concordia-pink" />
                    <div>
                      <div className="text-white/70">Next Due</div>
                      <div className="text-white">{group.nextContribution}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-concordia-pink" />
                    <div>
                      <div className="text-white/70">Contribution</div>
                      <div className="text-white">{group.contributionAmount} BNB</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-concordia-pink" />
                    <div>
                      <div className="text-white/70">Members</div>
                      <div className="text-white">{group.members.length}</div>
                    </div>
                  </div>
                </div>

                {/* Final Date (if set) */}
                {group.endDate && (
                  <div className="bg-concordia-purple/20 rounded-md p-3 flex items-center space-x-3">
                    <CalendarClock className="h-5 w-5 text-concordia-pink" />
                    <div>
                      <div className="text-white text-sm font-medium">Final Withdrawal Date</div>
                      <div className="text-white/70 text-xs">{group.endDate}</div>
                    </div>
                  </div>
                )}

                {/* Member Avatars */}
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    {group.members.slice(0, 3).map((member, index) => (
                      <Avatar key={index} className="border-2 border-concordia-dark-blue h-8 w-8">
                        <AvatarFallback className="bg-concordia-light-purple/20 text-concordia-pink text-xs">
                          {member.nickname[0]}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {group.members.length > 3 && (
                      <div className="h-8 w-8 rounded-full bg-concordia-purple/30 border-2 border-concordia-dark-blue flex items-center justify-center text-xs text-white">
                        +{group.members.length - 3}
                      </div>
                    )}
                  </div>
                  <div className="text-white/70 text-xs">
                    {group.members.length} {group.members.length === 1 ? "member" : "members"}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    onClick={() => onContribute(group.id)}
                    disabled={isContributing}
                    className="bg-concordia-pink hover:bg-concordia-pink/80 text-white"
                  >
                    Contribute
                  </Button>
                  <Button
                    onClick={() => handleViewDetails(group.id)}
                    variant="outline"
                    className="border-concordia-light-purple/30 text-white hover:bg-concordia-light-purple/20"
                  >
                    View Details
                  </Button>
                </div>

                {/* Admin Actions - Only show for group creator */}
                {address && group.createdBy.toLowerCase() === address.toLowerCase() && (
                  <div className="border-t border-concordia-light-purple/20 pt-4 mt-2">
                    <div className="flex justify-between">
                      <Button
                        onClick={() => handleInviteFriend(group.id)}
                        variant="ghost"
                        size="sm"
                        className="text-white/70 hover:text-white hover:bg-concordia-light-purple/20"
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Invite
                      </Button>
                      <Button
                        onClick={() => handleDueDate(group.id)}
                        variant="ghost"
                        size="sm"
                        className="text-white/70 hover:text-white hover:bg-concordia-light-purple/20"
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Due Date
                      </Button>
                      <Button
                        onClick={() => handleFinalDate(group.id)}
                        variant="ghost"
                        size="sm"
                        className="text-white/70 hover:text-white hover:bg-concordia-light-purple/20"
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Final Date
                      </Button>
                      <Button
                        onClick={() => onDeleteGroup(group.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <InviteMemberModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        groupId={selectedGroupForInvite?.id || ""}
        groupName={selectedGroupForInvite?.name || ""}
        groups={groups}
        onInviteSent={handleInviteSent}
      />

      <DueDateManager
        isOpen={dueDateModalOpen}
        onClose={() => setDueDateModalOpen(false)}
        group={selectedGroupForDueDate}
        onUpdate={handleUpdateDueDay}
      />

      <FinalDateManager
        isOpen={finalDateModalOpen}
        onClose={() => setFinalDateModalOpen(false)}
        group={selectedGroupForFinalDate}
        onUpdate={handleUpdateFinalDate}
      />

      <GroupDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        group={selectedGroupForDetails}
      />
    </div>
  )
}