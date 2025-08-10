"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { 
  Users, 
  Key, 
  Check, 
  X, 
  ArrowRight,
  UserPlus,
  Shield
} from "lucide-react"
import { useAccount } from "wagmi"

interface JoinGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onJoinSuccess?: (groupId: string, groupName: string) => void
}

export function JoinGroupModal({
  isOpen,
  onClose,
  onJoinSuccess,
}: JoinGroupModalProps) {
  const [groupCode, setGroupCode] = useState("")
  const [nickname, setNickname] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [groupInfo, setGroupInfo] = useState<any>(null)
  const { address } = useAccount()
  const { toast } = useToast()

  const handleJoinGroup = async () => {
    if (!address) {
      toast({
        title: "❌ Wallet Not Connected",
        description: "Please connect your wallet first",
        duration: 3000,
      })
      return
    }

    if (!groupCode.trim() || !nickname.trim()) {
      toast({
        title: "❌ Missing Information",
        description: "Please enter both group code and nickname",
        duration: 3000,
      })
      return
    }

    setIsLoading(true)
    try {
      // Find the group by code
      const groupId = await findGroupByCode(groupCode.trim().toUpperCase())
      
      if (!groupId) {
        toast({
          title: "❌ Invalid Group Code",
          description: "The group code you entered is not valid",
          duration: 3000,
        })
        return
      }

      // Get group information
      const group = await getGroupInfo(groupId)
      
      if (!group) {
        toast({
          title: "❌ Group Not Found",
          description: "Could not find the group information",
          duration: 3000,
        })
        return
      }

      // Check if user is already a member
      const isAlreadyMember = group.members?.some((member: any) => 
        member.address.toLowerCase() === address.toLowerCase()
      )

      if (isAlreadyMember) {
        toast({
          title: "❌ Already a Member",
          description: "You are already a member of this group",
          duration: 3000,
        })
        return
      }

      // Join the group
      await joinGroup(groupId, address, nickname.trim())
      
      toast({
        title: "✅ Successfully Joined",
        description: `You are now a member of "${group.name}"`,
        duration: 3000,
      })

      onJoinSuccess?.(groupId, group.name)
      onClose()
      
      // Reset form
      setGroupCode("")
      setNickname("")
      setGroupInfo(null)
      
    } catch (error) {
      console.error("Error joining group:", error)
      toast({
        title: "❌ Join Failed",
        description: "Failed to join the group. Please try again.",
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeChange = async (value: string) => {
    setGroupCode(value)
    
    // If code is 6 characters, try to find group info
    if (value.length === 6) {
      try {
        const groupId = await findGroupByCode(value.toUpperCase())
        if (groupId) {
          const group = await getGroupInfo(groupId)
          setGroupInfo(group)
        } else {
          setGroupInfo(null)
        }
      } catch (error) {
        setGroupInfo(null)
      }
    } else {
      setGroupInfo(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-concordia-dark-blue border-concordia-light-purple/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-concordia-pink text-xl font-semibold flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            Join Savings Group
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Enter the group code provided by your friend to join their savings group
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Group Code Input */}
          <Card className="bg-concordia-purple/20 border-concordia-light-purple/30">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <Key className="h-4 w-4 text-concordia-light-purple" />
                <span className="text-white font-semibold text-sm">Group Code</span>
              </div>

              <div>
                <Label htmlFor="group-code" className="text-white text-sm">
                  6-Digit Group Code
                </Label>
                <Input
                  id="group-code"
                  type="text"
                  placeholder="Enter code (e.g., ABC123)"
                  value={groupCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  maxLength={6}
                  className="bg-concordia-dark-blue/50 border-concordia-light-purple/50 text-white placeholder:text-white/50 focus:border-concordia-pink focus:ring-concordia-pink/20 text-center text-lg font-mono tracking-widest"
                />
                <div className="flex items-center mt-1">
                  {groupCode.length === 6 && (
                    groupInfo ? (
                      <div className="flex items-center text-green-400 text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Valid group code
                      </div>
                    ) : (
                      <div className="flex items-center text-red-400 text-xs">
                        <X className="h-3 w-3 mr-1" />
                        Invalid group code
                      </div>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Group Information Display */}
          {groupInfo && (
            <Card className="bg-gradient-to-r from-concordia-light-purple/20 to-concordia-pink/20 border-concordia-light-purple/40">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-concordia-pink" />
                  <span className="text-white font-semibold text-sm">Group Information</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Group Name:</span>
                    <span className="text-white font-semibold">{groupInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Members:</span>
                    <span className="text-white font-semibold">{groupInfo.members?.length || 0}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Contribution:</span>
                    <span className="text-white font-semibold">{groupInfo.contributionAmount || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Duration:</span>
                    <span className="text-white font-semibold">{groupInfo.duration || "N/A"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Nickname Input */}
          <Card className="bg-concordia-purple/20 border-concordia-light-purple/30">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <UserPlus className="h-4 w-4 text-concordia-pink" />
                <span className="text-white font-semibold text-sm">Your Information</span>
              </div>

              <div>
                <Label htmlFor="nickname" className="text-white text-sm">
                  Your Nickname
                </Label>
                <Input
                  id="nickname"
                  type="text"
                  placeholder="How should we call you?"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="bg-concordia-dark-blue/50 border-concordia-light-purple/50 text-white placeholder:text-white/50 focus:border-concordia-pink focus:ring-concordia-pink/20"
                />
              </div>
            </CardContent>
          </Card>

          {/* Join Button */}
          <Button
            onClick={handleJoinGroup}
            disabled={!groupCode.trim() || !nickname.trim() || !groupInfo || isLoading}
            className="w-full bg-gradient-to-r from-concordia-pink to-concordia-light-purple hover:from-concordia-pink/80 hover:to-concordia-light-purple/80 text-white py-3"
          >
            {isLoading ? (
              "Joining Group..."
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Join Group
              </>
            )}
          </Button>

          {/* Instructions */}
          <div className="bg-concordia-light-purple/10 border border-concordia-light-purple/20 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-xs text-white/70 mb-2">
              <Shield className="h-3 w-3" />
              <span className="font-semibold">How to Join</span>
            </div>
            <div className="space-y-1 text-xs text-white/60">
              <div>1. Ask your friend for the 6-digit group code</div>
              <div>2. Enter the code above</div>
              <div>3. Add your nickname</div>
              <div>4. Click "Join Group" to become a member</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Helper functions
async function findGroupByCode(code: string): Promise<string | null> {
  try {
    // First, try to find in backend API
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://concordia-backend-production.up.railway.app/api'}/groups/code/${code}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.groupId) {
          return data.groupId
        }
      }
    } catch (apiError) {
      console.log("Backend API not available, trying localStorage...")
    }
    
    // Fallback to direct localStorage check
    const storedGroups = JSON.parse(localStorage.getItem('concordia_groups') || '[]')
    for (const group of storedGroups) {
      const groupCode = localStorage.getItem(`group_code_${group.id}`)
      if (groupCode === code) {
        return group.id
      }
    }
    
    return null
  } catch (error) {
    console.error("Error finding group by code:", error)
    return null
  }
}

async function getGroupInfo(groupId: string): Promise<any | null> {
  try {
    // First, try to get from backend API
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://concordia-backend-production.up.railway.app/api'}/groups/${groupId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.group) {
          return data.group
        }
      }
    } catch (apiError) {
      console.log("Backend API not available, trying localStorage...")
    }
    
    // Fallback to direct localStorage check
    const storedGroups = JSON.parse(localStorage.getItem('concordia_groups') || '[]')
    return storedGroups.find((group: any) => group.id === groupId) || null
  } catch (error) {
    console.error("Error getting group info:", error)
    return null
  }
}

async function joinGroup(groupId: string, address: string, nickname: string): Promise<void> {
  try {
    // Get group from localStorage first
    const { dataPersistenceService } = await import('@/lib/data-persistence')
    const group = await dataPersistenceService.getGroup(groupId)
    
    if (!group) {
      throw new Error("Group not found")
    }
    
    // Check if group is full
    if (group.members && group.members.length >= 10) {
      throw new Error("Group is full")
    }
    
    // Check if user is already a member
    const isAlreadyMember = group.members?.some((member: any) => 
      member.address.toLowerCase() === address.toLowerCase()
    )
    
    if (isAlreadyMember) {
      throw new Error("Already a member of this group")
    }
    
    // Add new member
    const newMember = {
      address: address,
      nickname: nickname,
      joinedAt: new Date().toISOString(),
      role: "member",
      contributed: 0,
      auraPoints: 5, // Initial aura points
      status: "active"
    }
    
    if (!group.members) {
      group.members = []
    }
    
    group.members.push(newMember)
    group.updatedAt = new Date().toISOString()
    
    // Update the group in localStorage
    const result = await dataPersistenceService.updateGroup(groupId, group)
    
    if (!result.success) {
      throw new Error("Failed to update group in localStorage")
    }
    
    // Also try to update remote storage if available
    try {
      const { hybridStorageService } = await import('@/lib/hybrid-storage')
      await hybridStorageService.saveGroup(group, address)
      console.log("✅ Group updated in remote storage")
    } catch (remoteError) {
      console.log("⚠️ Remote update failed, but local update succeeded:", remoteError)
      // Don't throw error if only remote fails
    }
    
    console.log("Successfully joined group:", groupId)
  } catch (error) {
    console.error("Error joining group:", error)
    throw error
  }
} 