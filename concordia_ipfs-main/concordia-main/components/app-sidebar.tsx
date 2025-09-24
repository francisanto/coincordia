"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { Shield, Gift, Sparkles, LayoutDashboard } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const { address, isConnected } = useAccount()
  const [isAdmin, setIsAdmin] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const check = async () => {
      try {
        if (!address) {
          setIsAdmin(false)
          return
        }
        const res = await fetch(`/api/admin/groups?check_admin=true&address=${address}`)
        const data = await res.json()
        setIsAdmin(Boolean(data?.isAdmin))
      } catch {
        setIsAdmin(false)
      }
    }
    check()
  }, [address])

  return (
    <Sidebar collapsible="offcanvas" className="bg-concordia-dark-blue/95 border-r border-concordia-light-purple/20 backdrop-blur-sm">
      <SidebarHeader className="px-3 py-3">
        <div className="flex items-center gap-3 text-white">
          <SidebarTrigger className="text-white hover:bg-concordia-light-purple/10" />
          <span className="font-semibold tracking-wide">Concordia</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/" className="no-underline">
                  <SidebarMenuButton className="text-white/90 hover:text-white hover:bg-concordia-light-purple/10">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <a href="#options" className="no-underline">
                  <SidebarMenuButton className="text-white/90 hover:text-white hover:bg-concordia-light-purple/10">
                    <Sparkles />
                    <span>Create Group</span>
                  </SidebarMenuButton>
                </a>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <a href="#aura" className="no-underline">
                  <SidebarMenuButton className="text-white/90 hover:text-white hover:bg-concordia-light-purple/10">
                    <Sparkles />
                    <span>Aura</span>
                  </SidebarMenuButton>
                </a>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <a href="#nfts" className="no-underline">
                  <SidebarMenuButton className="text-white/90 hover:text-white hover:bg-concordia-light-purple/10">
                    <Gift />
                    <span>NFTs</span>
                  </SidebarMenuButton>
                </a>
              </SidebarMenuItem>
              {isConnected && isAdmin && (
                <SidebarMenuItem>
                  <a href="#admin" className="no-underline">
                    <SidebarMenuButton className="text-white/90 hover:text-white hover:bg-concordia-light-purple/10">
                      <Shield />
                      <span>Admin</span>
                    </SidebarMenuButton>
                  </a>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="text-xs text-white/60">
        <div className="px-2 py-1">
          {!mounted ? "Not connected" : address ? `${address.slice(0,6)}…${address.slice(-4)}` : "Not connected"}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}


