"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  Shield, 
  UserPlus, 
  Copy, 
  Check, 
  X, 
  Users,
  Key,
  QrCode,
  Share2
} from "lucide-react"
import { isAddress } from "viem"
import { IAMAccessControl, useGroupRole } from "./iam-access-control"
import type { SavingsGroup } from "./group-dashboard"

interface InviteMemberModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  groupName: string
  groups: SavingsGroup[]
  onInviteSent: (address: string, nickname: string) => void
}

export function InviteMemberModal({
  isOpen,
  onClose,
  groupId,
  groupName,
  groups,
  onInviteSent,
}: InviteMemberModalProps) {
  const [walletAddress, setWalletAddress] = useState("")
  const [nickname, setNickname] = useState("")
  const [isValidAddress, setIsValidAddress] = useState(false)
  const [groupCode, setGroupCode] = useState("")
  const [showGroupCode, setShowGroupCode] = useState(false)
  const { toast } = useToast()
  const { role, isAdmin } = useGroupRole(groupId, groups)

  const handleAddressChange = (value: string) => {
    setWalletAddress(value)
    setIsValidAddress(isAddress(value))
  }

  const handleSendInvite = async () => {
    if (isValidAddress && nickname.trim()) {
      try {
        // Store invite in BNB Greenfield
        await storeInviteInLocalStorage(groupId, {
          invitedAddress: walletAddress,
          nickname: nickname.trim(),
          invitedBy: groups.find((g) => g.id === groupId)?.createdBy,
          timestamp: new Date().toISOString(),
          status: "pending",
        })

        onInviteSent(walletAddress, nickname.trim())
        setWalletAddress("")
        setNickname("")
        onClose()
        
        toast({
          title: "✅ Invite Sent",
          description: `Direct invitation sent to ${nickname.trim()}`,
          duration: 3000,
        })
      } catch (error) {
        console.error("Error sending invite:", error)
        toast({
          title: "❌ Invite Failed",
          description: "Failed to send invite. Please try again.",
          duration: 5000,
        })
      }
    }
  }

  const generateGroupCode = () => {
    // Generate a unique 6-character code for the group
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    setGroupCode(code)
    setShowGroupCode(true)
    
    // Store the group code in Greenfield
            storeGroupCodeInLocalStorage(groupId, code)
    
    toast({
      title: "🔑 Group Code Generated",
      description: "Share this code with friends to let them join your group",
      duration: 3000,
    })
  }

  const copyGroupCode = () => {
    navigator.clipboard.writeText(groupCode)
    toast({
      title: "📋 Code Copied",
      description: "Group code copied to clipboard",
      duration: 2000,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-concordia-dark-blue border-concordia-light-purple/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-concordia-pink text-xl font-semibold flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Add Members
            {isAdmin && <span className="ml-2 text-xs bg-concordia-pink/20 px-2 py-1 rounded">CREATOR</span>}
          </DialogTitle>
          <DialogDescription className="text-white/70">Add friends to "{groupName}" savings group</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Admin Access Control for Direct Invite */}
          <IAMAccessControl
            requiredRole="admin"
            groupId={groupId}
            groups={groups}
            fallback={
              <Card className="bg-red-500/10 border-red-500/30">
                <CardContent className="p-4 text-center">
                  <Shield className="h-8 w-8 text-red-400 mx-auto mb-2" />
                  <div className="text-red-400 font-semibold mb-1">Creator Access Required</div>
                  <div className="text-red-300 text-sm">
                    Only the group creator can send direct wallet invitations for security purposes.
                  </div>
                </CardContent>
              </Card>
            }
          >
            <Card className="bg-concordia-purple/20 border-concordia-light-purple/30">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <UserPlus className="h-4 w-4 text-concordia-pink" />
                  <span className="text-white font-semibold text-sm">Direct Wallet Invite (Creator Only)</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="wallet-address" className="text-white text-sm">
                      Wallet Address
                    </Label>
                    <Input
                      id="wallet-address"
                      type="text"
                      placeholder="0x..."
                      value={walletAddress}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      className="bg-concordia-dark-blue/50 border-concordia-light-purple/50 text-white placeholder:text-white/50 focus:border-concordia-pink focus:ring-concordia-pink/20"
                    />
                    <div className="flex items-center mt-1">
                      {walletAddress &&
                        (isValidAddress ? (
                          <div className="flex items-center text-green-400 text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Valid address
                          </div>
                        ) : (
                          <div className="flex items-center text-red-400 text-xs">
                            <X className="h-3 w-3 mr-1" />
                            Invalid address
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="nickname" className="text-white text-sm">
                      Nickname
                    </Label>
                    <Input
                      id="nickname"
                      type="text"
                      placeholder="Friend's nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="bg-concordia-dark-blue/50 border-concordia-light-purple/50 text-white placeholder:text-white/50 focus:border-concordia-pink focus:ring-concordia-pink/20"
                    />
                  </div>

                  <Button
                    onClick={handleSendInvite}
                    disabled={!isValidAddress || !nickname.trim()}
                    className="w-full bg-gradient-to-r from-concordia-pink to-concordia-light-purple hover:from-concordia-pink/80 hover:to-concordia-light-purple/80 text-white"
                  >
                    Send Direct Invite
                  </Button>
                </div>
              </CardContent>
            </Card>
          </IAMAccessControl>

          {/* Group Code System - Available to all members */}
          <Card className="bg-concordia-purple/20 border-concordia-light-purple/30">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <Key className="h-4 w-4 text-concordia-light-purple" />
                <span className="text-white font-semibold text-sm">Group Access Code</span>
              </div>

              {showGroupCode ? (
                <div className="space-y-3">
                  <div className="p-4 bg-gradient-to-r from-concordia-light-purple/20 to-concordia-pink/20 rounded-xl border-2 border-concordia-light-purple/40 text-center">
                    <div className="text-3xl font-bold text-white mb-2 tracking-widest">{groupCode}</div>
                    <div className="text-concordia-pink/80 text-sm">Share this code with friends</div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={copyGroupCode}
                      variant="outline"
                      className="flex-1 border-concordia-light-purple/50 text-concordia-light-purple hover:bg-concordia-light-purple/10"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Code
                    </Button>
                    <Button
                      onClick={() => setShowGroupCode(false)}
                      variant="outline"
                      className="border-concordia-light-purple/50 text-concordia-light-purple hover:bg-concordia-light-purple/10"
                    >
                      Hide
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-white/70 text-sm">
                    Generate a unique code that friends can use to join your group. They'll need to enter this code when joining.
                  </p>
                  <Button
                    onClick={generateGroupCode}
                    variant="outline"
                    className="w-full border-concordia-light-purple/50 text-concordia-light-purple hover:bg-concordia-light-purple/10 bg-transparent"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Generate Group Code
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* How to Join Instructions */}
          <Card className="bg-concordia-light-purple/10 border border-concordia-light-purple/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-concordia-pink" />
                <span className="text-white font-semibold text-sm">How Friends Can Join</span>
              </div>
              <div className="space-y-2 text-xs text-white/70">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-concordia-pink rounded-full mt-1.5 flex-shrink-0"></div>
                  <span><strong>Direct Invite:</strong> Creator sends wallet address invitation</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-concordia-pink rounded-full mt-1.5 flex-shrink-0"></div>
                  <span><strong>Group Code:</strong> Share the generated code with friends</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-concordia-pink rounded-full mt-1.5 flex-shrink-0"></div>
                  <span><strong>Join Process:</strong> Friends use "Join Group" feature with code</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Information */}
          <div className="bg-concordia-light-purple/10 border border-concordia-light-purple/20 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-xs text-white/70">
              <Shield className="h-3 w-3" />
              <span>
                Your Role:{" "}
                <span className="text-concordia-pink font-semibold">
                  {isAdmin ? "CREATOR" : role?.toUpperCase() || "MEMBER"}
                </span>
              </span>
            </div>
            <div className="text-xs text-white/60 mt-1">
              {isAdmin
                ? "As the group creator, you can send direct wallet invitations and generate group codes."
                : "You can generate group codes to share with friends. Direct wallet invitations require creator privileges."}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// localStorage storage for invites
async function storeInviteInLocalStorage(groupId: string, inviteData: any): Promise<void> {
  try {
    console.log("Storing invite in localStorage:", { groupId, inviteData })

    // Store invite in localStorage
    const existingInvites = JSON.parse(localStorage.getItem(`invites_${groupId}`) || "[]")
    existingInvites.push(inviteData)
    localStorage.setItem(`invites_${groupId}`, JSON.stringify(existingInvites))
    
    console.log("Successfully stored invite in localStorage")
  } catch (error) {
    console.error("Error storing invite in localStorage:", error)
    throw error
  }
}

// Store group code in localStorage
async function storeGroupCodeInLocalStorage(groupId: string, code: string): Promise<void> {
  try {
    console.log("Storing group code in localStorage:", { groupId, code })

    // Store group code in localStorage
    localStorage.setItem(`group_code_${groupId}`, code)
    
    console.log("Successfully stored group code in localStorage")
  } catch (error) {
    console.error("Error storing group code in localStorage:", error)
    throw error
  }
}
