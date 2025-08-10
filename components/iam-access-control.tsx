"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import type { SavingsGroup } from "./group-dashboard"

interface IAMAccessControlProps {
  children: React.ReactNode
  requiredRole?: "admin" | "user"
  groupId?: string
  groups?: SavingsGroup[]
  fallback?: React.ReactNode
}

export function IAMAccessControl({
  children,
  requiredRole = "user",
  groupId,
  groups = [],
  fallback,
}: IAMAccessControlProps) {
  const { address, isConnected } = useAccount()
  const [hasAccess, setHasAccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      setIsLoading(true)

      if (!isConnected || !address) {
        setHasAccess(false)
        setIsLoading(false)
        return
      }

      try {
        // Check role-based access
        if (requiredRole === "admin" && groupId) {
          // Find the specific group and check if current user is the creator (admin)
          const group = groups.find((g) => g.id === groupId)
          const isGroupAdmin = group?.createdBy?.toLowerCase() === address.toLowerCase()
          setHasAccess(isGroupAdmin || false)
        } else {
          // For "user" role, any connected wallet has access
          setHasAccess(true)
        }
      } catch (error) {
        console.error("Error checking access:", error)
        setHasAccess(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [address, isConnected, requiredRole, groupId, groups])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-concordia-pink"></div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      fallback || (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
          <div className="text-red-400 font-semibold mb-2">Access Denied</div>
          <div className="text-red-300 text-sm">
            {requiredRole === "admin"
              ? "Only the group creator can perform this action"
              : "Please connect your wallet to access this feature"}
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}

// Hook to check user role for a specific group
export function useGroupRole(groupId: string, groups: SavingsGroup[] = []) {
  const { address, isConnected } = useAccount()
  const [role, setRole] = useState<"admin" | "member" | "guest" | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkRole = async () => {
      setIsLoading(true)

      if (!isConnected || !address) {
        setRole("guest")
        setIsLoading(false)
        return
      }

      try {
        const group = groups.find((g) => g.id === groupId)
        if (!group) {
          setRole("guest")
          setIsLoading(false)
          return
        }

        // Check if user is the group creator (admin)
        if (group.createdBy?.toLowerCase() === address.toLowerCase()) {
          setRole("admin")
        } else if (group.members.some((member) => member.address.toLowerCase() === address.toLowerCase())) {
          setRole("member")
        } else {
          setRole("guest")
        }
      } catch (error) {
        console.error("Error checking role:", error)
        setRole("guest")
      } finally {
        setIsLoading(false)
      }
    }

    checkRole()
  }, [address, isConnected, groupId, groups])

  return {
    role,
    isLoading,
    isAdmin: role === "admin",
    isMember: role === "member" || role === "admin",
    isGuest: role === "guest",
  }
}
