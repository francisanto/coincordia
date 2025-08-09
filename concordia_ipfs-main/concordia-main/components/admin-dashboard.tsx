"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, Users, Wallet, Database, Lock, AlertTriangle } from "lucide-react"
import { useAccount } from "wagmi"
import { useToast } from "@/hooks/use-toast"

interface AdminDashboardProps {
  isAdmin: boolean
  adminApiKey?: string
  onVerify?: (apiKey: string) => void
}

export function AdminDashboard({ isAdmin, adminApiKey, onVerify }: AdminDashboardProps) {
  const [groups, setGroups] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState(adminApiKey || "")
  const { address } = useAccount()
  const { toast } = useToast()

  const loadAdminData = async (key = apiKey) => {
    if (!key) {
      toast({
        title: "❌ API Key Required",
        description: "Please enter an admin API key to access the dashboard",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log("👑 Loading admin dashboard data...")
      const response = await fetch(`/api/admin/groups?admin_key=${key}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load admin data")
      }

      setGroups(data.groups || [])
      setStats(data.stats || {
        totalGroups: 0,
        totalMembers: 0,
        totalContributions: 0,
        activeGroups: 0
      })
      
      toast({
        title: "✅ Admin Data Loaded",
        description: `Loaded ${data.groups?.length || 0} groups from Greenfield`,
      })
      
      if (onVerify) {
        onVerify(key)
      }
    } catch (error) {
      console.error("❌ Error loading admin data:", error)
      toast({
        title: "❌ Access Denied",
        description: "Invalid admin API key or insufficient permissions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Check if user is admin based on address
  useEffect(() => {
    if (isAdmin && adminApiKey && !groups.length) {
      loadAdminData(adminApiKey)
    }
  }, [isAdmin, adminApiKey])

  return (
    <div className="space-y-4">
      {!isAdmin ? (
        <Card className="bg-red-900/20 border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center text-red-400">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription className="text-red-300/70">
              You do not have permission to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-300/90">
              This area is restricted to authorized administrators only. If you believe you should have access,
              please contact the system administrator.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-concordia-dark-blue border-concordia-light-purple/30">
            <CardHeader>
              <CardTitle className="text-concordia-pink flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Admin Dashboard
              </CardTitle>
              <CardDescription className="text-white/70">
                Manage all groups and user data stored in BNB Greenfield
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="apiKey" className="text-white/70 mb-2 block">
                    Admin API Key
                  </Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter admin API key"
                    className="bg-concordia-purple/20 border-concordia-light-purple/30 text-white"
                  />
                </div>
                <Button
                  onClick={loadAdminData}
                  disabled={loading}
                  className="bg-concordia-pink hover:bg-concordia-pink/80"
                >
                  {loading ? "Loading..." : "Load Data"}
                </Button>
              </div>

              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-concordia-purple/20 border-concordia-light-purple/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white/70 text-sm">Total Groups</p>
                          <p className="text-white text-2xl font-bold">{stats.totalGroups}</p>
                        </div>
                        <Users className="h-8 w-8 text-concordia-pink" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-concordia-purple/20 border-concordia-light-purple/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white/70 text-sm">Total Members</p>
                          <p className="text-white text-2xl font-bold">{stats.totalMembers}</p>
                        </div>
                        <Users className="h-8 w-8 text-concordia-light-purple" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-concordia-purple/20 border-concordia-light-purple/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white/70 text-sm">Total Contributions</p>
                          <p className="text-white text-2xl font-bold">{stats.totalContributions} BNB</p>
                        </div>
                        <Wallet className="h-8 w-8 text-concordia-pink" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-concordia-purple/20 border-concordia-light-purple/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white/70 text-sm">Active Groups</p>
                          <p className="text-white text-2xl font-bold">{stats.activeGroups}</p>
                        </div>
                        <Database className="h-8 w-8 text-concordia-light-purple" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {groups.length > 0 ? (
                <div className="rounded-md border border-concordia-light-purple/30 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-concordia-purple/20">
                      <TableRow>
                        <TableHead className="text-white/70">Group Name</TableHead>
                        <TableHead className="text-white/70">Creator</TableHead>
                        <TableHead className="text-white/70">Members</TableHead>
                        <TableHead className="text-white/70">Amount</TableHead>
                        <TableHead className="text-white/70">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groups.map((group) => (
                        <TableRow key={group.id} className="border-concordia-light-purple/10">
                          <TableCell className="text-white">{group.name}</TableCell>
                          <TableCell className="text-white/80">
                            {group.creator?.slice(0, 6)}...{group.creator?.slice(-4)}
                          </TableCell>
                          <TableCell className="text-white/80">{group.members?.length || 0}</TableCell>
                          <TableCell className="text-white/80">{group.currentAmount || 0} BNB</TableCell>
                          <TableCell>
                            <Badge
                              className={group.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}
                            >
                              {group.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-white/50">
                  {loading ? (
                    <p>Loading admin data...</p>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Lock className="h-12 w-12 mb-2 text-concordia-light-purple/50" />
                      <p>No data available. Enter your admin API key and click "Load Data".</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}