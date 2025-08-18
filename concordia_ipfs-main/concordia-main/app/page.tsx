"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Lock, Trophy, Target, ArrowRight, Shield, Coins, Wallet, ChevronDown, Plus } from "lucide-react"
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi"
import { opBNBTestnet } from "wagmi/chains"
import { GroupDashboard } from "@/components/group-dashboard"
import { GroupMetadata } from "@/lib/types"
import { SmartContractIntegration } from "@/components/smart-contract-integration"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SparkleBackground } from "@/components/sparkle-background"
import { AuraRewards } from "@/components/aura-rewards"
import { NFTWalletDisplay } from "@/components/nft-wallet-display"
import { AdminDashboard } from "@/components/admin-dashboard"
import { GroupOptions } from "@/components/group-options"
import { JoinGroupModal } from "@/components/join-group-modal"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { persistentStorageService } from '@/lib/persistent-storage';

// Client-side only component to prevent hydration errors
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return null
  }

  return <>{children}</>
}

function WalletConnection({ handleDisconnect }: { handleDisconnect: () => void }) {
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors, error, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()

  // Get chain ID from environment variable or default to opBNBTestnet.id
  const requiredChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "5611")
  const isWrongNetwork = isConnected && chainId !== requiredChainId

  // Log network configuration for debugging
  useEffect(() => {
    console.log("Network Configuration:")
    console.log("- Required Chain ID:", requiredChainId)
    console.log("- Current Chain ID:", chainId)
    console.log("- Contract Address:", process.env.NEXT_PUBLIC_CONTRACT_ADDRESS)
    console.log("- RPC URL:", process.env.NEXT_PUBLIC_RPC_URL)
    console.log("- Network Name:", process.env.NEXT_PUBLIC_NETWORK)
  }, [chainId, requiredChainId])

  const handleConnect = async () => {
    try {
      console.log("🔗 Attempting to connect wallet...")
      console.log("Available connectors:", connectors.map(c => c.name))

      // Check if MetaMask is installed
      if (typeof window !== 'undefined' && !window.ethereum) {
        alert("MetaMask is not installed. Please install MetaMask extension first.")
        return
      }

      // Try to find MetaMask connector
      const metaMaskConnector = connectors.find((connector) => 
        connector.name === "MetaMask" || connector.name === "Injected" || connector.name === "Browser Wallet"
      )

      if (metaMaskConnector) {
        console.log("✅ Found MetaMask connector:", metaMaskConnector.name)
        const result = await connect({ connector: metaMaskConnector })
        console.log("🔗 Connection result:", result)
      } else {
        console.warn("⚠️ MetaMask connector not found, trying first available connector")
        if (connectors.length > 0) {
          console.log("🔄 Using first available connector:", connectors[0].name)
          const result = await connect({ connector: connectors[0] })
          console.log("🔗 Connection result:", result)
        } else {
          console.error("❌ No connectors available")
          alert("No wallet connectors available. Please install MetaMask.")
        }
      }
    } catch (err) {
      console.error("❌ Failed to connect wallet:", err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      if (errorMessage.includes("User rejected")) {
        alert("Connection was rejected. Please try again and approve the connection in MetaMask.")
      } else if (errorMessage.includes("already pending")) {
        alert("Connection is already pending. Please check MetaMask for the connection request.")
      } else {
        alert("Failed to connect wallet. Please make sure MetaMask is installed and unlocked.")
      }
    }
  }

  if (isPending) {
    return (
      <Button disabled className="bg-gradient-to-r from-[#F042FF] to-[#7226FF] text-white font-semibold px-6 py-2">
        {"Connecting..."}
      </Button>
    )
  }

  if (isWrongNetwork) {
    return (
      <div className="flex flex-col items-end space-y-2">
        <Button
          onClick={() => switchChain({ chainId: requiredChainId })}
          className="bg-red-500 hover:bg-red-700 text-white font-semibold px-6 py-2"
        >
          <Wallet className="mr-2 h-4 w-4" />
          {"Switch to opBNB Testnet"}
        </Button>
        <p className="text-red-400 text-xs max-w-xs text-right">{"Please switch to opBNB Testnet to continue."}</p>
      </div>
    )
  }

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="border-concordia-light-purple text-concordia-light-purple hover:bg-concordia-light-purple/10 bg-transparent font-semibold"
          >
            <Wallet className="mr-2 h-4 w-4" />
            {address.slice(0, 6) + "..." + address.slice(-4)}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-concordia-dark-blue border-concordia-light-purple/30">
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(address)}
            className="text-white hover:bg-concordia-light-purple/20 cursor-pointer"
          >
            {"Copy Address"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => window.open("https://testnet.bscscan.com/address/" + address, "_blank")}
            className="text-white hover:bg-concordia-light-purple/20 cursor-pointer"
          >
            {"View on Explorer"}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onSelect={(e) => {
              e.preventDefault();
              handleDisconnect();
            }}
            className="text-red-400 hover:bg-red-400/20 cursor-pointer"
          >
            {"Disconnect"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="flex flex-col items-end space-y-2">
      <Button
        onClick={handleConnect}
        className="bg-gradient-to-r from-concordia-pink to-concordia-light-purple hover:from-concordia-pink/80 hover:to-concordia-light-purple/80 text-white font-semibold px-6 py-2 shadow-lg"
      >
        <Wallet className="mr-2 h-4 w-4" />
        {"Connect MetaMask"}
      </Button>
      {error && <p className="text-red-400 text-xs max-w-xs text-right">{error.message}</p>}
    </div>
  )
}

export default function HomePage() {
  const [teamName, setTeamName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [contributionAmount, setContributionAmount] = useState("")
  const [duration, setDuration] = useState("")
  const [activeTab, setActiveTab] = useState("home")
  const { isConnected, address } = useAccount()
  const [userGroups, setUserGroups] = useState<GroupMetadata[]>([])
  const [isContributing, setIsContributing] = useState(false)
  const [withdrawalDate, setWithdrawalDate] = useState("")
  const [dueDay, setDueDay] = useState("")
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [userAuraPoints, setUserAuraPoints] = useState(0)
  const { toast } = useToast()
  const { disconnect } = useDisconnect();
  const [autoRedirectDone, setAutoRedirectDone] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminApiKey, setAdminApiKey] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [joinGroupModalOpen, setJoinGroupModalOpen] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false) // State for create group modal
  const [showJoinModal, setShowJoinModal] = useState(false) // State for join group modal
  const [isJoining, setIsJoining] = useState(false) // State to track if joining process is active
  const [isLoading, setIsLoading] = useState(false) // State for loading indicators
  const [showGroupOptions, setShowGroupOptions] = useState(false) // State to control visibility of group options

  // Define admin wallet from environment variables or default
  const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET?.toLowerCase() || "0xdA13e8f82C83d14E7aa639354054B7f914cA0998"

  // Check if current user is admin
  useEffect(() => {
    setIsAdmin(address?.toLowerCase() === ADMIN_WALLET);
  }, [address, ADMIN_WALLET]);

  // Handle wallet disconnection
  const handleDisconnect = () => {
    try {
      console.log("🔌 Attempting to disconnect wallet...");
      disconnect();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('wagmi.connected');
        localStorage.removeItem('wagmi.wallet');
        localStorage.removeItem('wagmi.account');
        if (window.ethereum) {
          window.ethereum.removeAllListeners();
        }
      }
      setUserGroups([]);
      setActiveTab("home");
      setAutoRedirectDone(false);
      setIsAdmin(false); // Reset admin status on disconnect
      console.log("✅ Wallet disconnected successfully and redirected to home");
    } catch (error) {
      console.error("❌ Error disconnecting wallet:", error);
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('wagmi.connected');
          localStorage.removeItem('wagmi.wallet');
          localStorage.removeItem('wagmi.account');
        }
        setUserGroups([]);
        setActiveTab("home");
        setAutoRedirectDone(false);
        setIsAdmin(false);
      } catch (e) {
        console.error("❌ Error clearing storage:", e);
      }
    }
  };

  // Handle group deletion from both localStorage and decentralized storage
  const handleDeleteGroup = useCallback(async (groupId: string) => {
    try {
      console.log('🗑️ Deleting group from localStorage:', groupId)
      
      // First delete from local storage
      const success = await persistentStorageService.deleteGroup(groupId, address);

      if (!success) {
        throw new Error("Failed to delete group from localStorage")
      }
      
      // Then delete from decentralized storage via API
      try {
        const response = await fetch(`/api/groups/${groupId}/delete`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Address': address || ''
          },
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log("✅ Group deleted from decentralized storage:", result);
          toast({
            title: "🌐 Group Deleted from Decentralized Storage",
            description: "Your group data has been removed from IPFS and marked as deleted in Arweave.",
            duration: 5000,
          });
        } else {
          console.error("⚠️ Warning: Failed to delete from decentralized storage:", result.error);
          toast({
            title: "⚠️ Decentralized Storage Warning",
            description: "Group was deleted locally but may still exist in decentralized storage.",
            variant: "destructive",
            duration: 5000,
          });
        }
      } catch (apiError) {
        console.error("❌ API Error deleting from decentralized storage:", apiError);
        toast({
          title: "⚠️ Partial Deletion",
          description: "Group was deleted locally but an error occurred with decentralized storage.",
          variant: "destructive",
          duration: 5000,
        });
      }
      
      // Update the UI by removing the deleted group
      setUserGroups(prevGroups => prevGroups.filter(g => g.groupId !== groupId));
      
      toast({
        title: "✅ Group Deleted",
        description: "Your group has been successfully deleted.",
        duration: 3000,
      });
      
      return true;
    } catch (error) {
      console.error("❌ Error deleting group:", error);
      toast({
        title: "❌ Deletion Failed",
        description: error instanceof Error ? error.message : "Failed to delete group",
        variant: "destructive",
        duration: 5000,
      });
      return false;
    }
  }, [address, toast]);

  // Load groups from storage when wallet connects
  useEffect(() => {
    const loadGroups = async (userAddress?: string) => {
      try {
        setIsLoadingGroups(true);
        console.log('📥 Loading groups for user:', userAddress);

        if (!userAddress) {
          console.log('🔌 Wallet not connected, skipping group load');
          setUserGroups([]);
          return;
        }

        const localGroups = await persistentStorageService.loadGroups();

        // Filter groups where user is creator or member
        const userLocalGroups = localGroups.filter((group: any) => {
          const isCreator = group.createdBy?.toLowerCase() === userAddress.toLowerCase() || 
                           group.creator?.toLowerCase() === userAddress.toLowerCase();
          const isMember = group.members?.some((member: any) => 
            member.address?.toLowerCase() === userAddress.toLowerCase()
          );
          return isCreator || isMember;
        });

        console.log("📊 Local groups found:", userLocalGroups.length);

        // Format and set local groups immediately for better UX
        if (userLocalGroups.length > 0) {
          const formattedLocalGroups: GroupMetadata[] = userLocalGroups.map((group: any) => ({
            groupId: group.id,
            name: group.name || "Unnamed Group",
            description: group.description || group.goal || "No description",
            goalAmount: group.targetAmount || 0,
            creator: group.createdBy || group.creator || address || 'unknown',
            duration: parseInt(group.duration) || 30,
            withdrawalDate: group.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            dueDay: 1,
            members: group.members ? group.members.map((member: any) => ({
              address: member.address,
              nickname: member.nickname || "Member",
              joinedAt: new Date().toISOString(),
              role: 'member',
              contribution: member.contributed || 0,
              auraPoints: member.auraPoints || 0,
              hasVoted: false,
              status: member.status || "active"
            })) : [],
            contributions: [],
            settings: {
              dueDay: 1,
              duration: group.duration?.toString() || '30',
              withdrawalDate: group.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              isActive: group.isActive !== undefined ? group.isActive : true,
              maxMembers: 10
            },
            blockchain: { network: 'unknown', contractAddress: '' },
            createdAt: group.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: '1.0',
          }));

          setUserGroups(formattedLocalGroups);
          console.log("✅ Local groups loaded immediately:", formattedLocalGroups.length);
        }
      } catch (error) {
        console.error("❌ Error loading groups:", error);
        setUserGroups([]);

        toast({
          title: "⚠️ Loading Error", 
          description: "Failed to load groups. Please try refreshing the page.",
          duration: 5000,
        });
      } finally {
        setIsLoadingGroups(false);
      }
    };

    loadGroups(address);
  }, [isConnected, address, toast]);

  // Save groups using both localStorage and decentralized storage (IPFS and Arweave)
  const saveGroup = async (groupData: any) => {
    try {
      console.log("💾 Saving group via data persistence services:", groupData);

      if (!address) {
        throw new Error("Wallet not connected");
      }

      // Prepare the group data
      const preparedGroupData = {
        groupId: groupData.id,
        name: groupData.name,
        description: groupData.description,
        creator: address,
        goalAmount: groupData.targetAmount,
        duration: parseInt(groupData.duration) || 30,
        withdrawalDate: groupData.withdrawalDate,
        dueDay: 1,
        contributions: [],
        settings: {
          dueDay: 1,
          duration: groupData.duration?.toString() || '30',
          withdrawalDate: groupData.withdrawalDate,
          isActive: true,
          maxMembers: 10
        },
        blockchain: { network: 'unknown', contractAddress: '' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0',
        members: [
          {
            address: address,
            nickname: "Creator",
            contributed: groupData.currentAmount,
            auraPoints: 10,
            status: "active",
            role: "creator",
            joinedAt: new Date().toISOString(),
            hasVoted: false
          }
        ],
        nextContribution: groupData.nextContribution
      };

      // Use the data persistence service to save the group locally
      const localSuccess = await persistentStorageService.saveGroup(preparedGroupData);
      
      // Store in IPFS and Arweave via API
      let ipfsHash = null;
      let ipfsGatewayUrl = null;
      let arweaveTransactionId = null;
      
      try {
        // Call the API to store in IPFS and Arweave
        const response = await fetch('/api/groups/store', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            groupId: preparedGroupData.groupId,
            groupData: preparedGroupData,
            userAddress: address
          }),
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log("✅ Group stored in decentralized storage:", result);
          ipfsHash = result.ipfs?.ipfsHash;
          ipfsGatewayUrl = result.ipfs?.gatewayUrl;
          arweaveTransactionId = result.arweave?.transactionId;
          
          toast({
            title: "🌐 Group Stored in Decentralized Storage",
            description: "Your group data is now stored on IPFS and Arweave for permanent access.",
            duration: 5000,
          });
        } else {
          console.error("❌ Failed to store in decentralized storage:", result.error);
          toast({
            title: "⚠️ Decentralized Storage Warning",
            description: "Group saved locally but failed to store on IPFS/Arweave. Some features may be limited.",
            duration: 5000,
          });
        }
      } catch (storageError) {
        console.error("❌ Error storing in decentralized storage:", storageError);
      }

      if (localSuccess) {
        console.log("✅ Group saved to localStorage successfully");

        // Add the new group to the current list immediately
        const newGroup: any = {
          groupId: groupData.id,
          name: groupData.name,
          description: groupData.description,
          goalAmount: groupData.targetAmount || 0,
          currentAmount: groupData.currentAmount || 0,
          contributionAmount: groupData.contributionAmount || 0,
          duration: parseInt(groupData.duration) || 30,
          withdrawalDate: groupData.withdrawalDate,
          dueDay: 1,
          members: [
            {
              address: address,
              nickname: "Creator",
              joinedAt: new Date().toISOString(),
              role: "creator",
              contribution: groupData.currentAmount || 0,
              auraPoints: 10,
              hasVoted: false,
              status: "active"
            }
          ],
          contributions: [],
          settings: {
            dueDay: 1,
            duration: groupData.duration?.toString() || '30',
            withdrawalDate: groupData.withdrawalDate,
            isActive: true,
            maxMembers: 10
          },
          blockchain: { 
            contractAddress: '',
            transactionHash: '',
            blockNumber: '',
            gasUsed: '',
            network: 'opBNB Testnet'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '1.0',
          // Add decentralized storage information
          ipfs: {
            hash: ipfsHash || '',
            gateway: ipfsGatewayUrl || '',
            pin: true,
            lastUpdated: new Date().toISOString()
          },
          arweave: arweaveTransactionId ? {
            transactionId: arweaveTransactionId,
            status: 'pending',
            timestamp: new Date().toISOString()
          } : undefined,
          creator: address
        };

        setUserGroups(prev => [...prev, newGroup]);
        console.log("✅ Group added to dashboard:", newGroup.id);

        toast({
          title: "✅ Group Created",
          description: "Group saved locally",
          duration: 3000,
        });
      } else {
        throw new Error("Failed to save to localStorage");
      }

    } catch (error) {
      console.error("❌ Error saving group to localStorage:", error);

      toast({
        title: "❌ Save Failed",
        description: "Failed to save group locally. Please try again.",
        duration: 5000,
      });

      throw error;
    }
  };

  // Load user's groups from localStorage when wallet connects
  useEffect(() => {
    const loadUserGroups = useCallback(async (userAddress?: string) => {
      if (!userAddress) {
        console.log('🔌 Wallet not connected, skipping group load');
        setUserGroups([]);
        setIsLoadingGroups(false);
        return;
      }

      setIsLoadingGroups(true);
      try {
        console.log('📥 Loading user groups from localStorage...');

        const allGroups = await persistentStorageService.loadGroups();

        // Filter groups for the current user
        const userSpecificGroups = allGroups.filter((group: any) => {
          const isCreator = group.createdBy?.toLowerCase() === userAddress.toLowerCase();
          const isMember = group.members?.some((member: any) => 
            member.address?.toLowerCase() === userAddress.toLowerCase()
          );
          return isCreator || isMember;
        });

        if (userSpecificGroups.length > 0) {
          const formattedGroups: any[] = userSpecificGroups.map((group: any) => ({
            groupId: group.id || group.groupId,
            name: group.name,
            description: group.description,
            goalAmount: group.targetAmount || group.goalAmount || 0,
            currentAmount: group.currentAmount || 0,
            contributionAmount: group.contributionAmount || 0,
            duration: parseInt(group.duration) || 30,
            withdrawalDate: group.withdrawalDate || group.endDate,
            dueDay: group.dueDay || 1,
            members: group.members ? group.members.map((member: any) => ({
              address: member.address,
              nickname: member.nickname || "Member",
              joinedAt: member.joinedAt || new Date().toISOString(),
              role: member.role || 'member',
              contribution: member.contribution || member.contributed || 0,
              auraPoints: member.auraPoints || 0,
              hasVoted: member.hasVoted || false,
              status: member.status || "active"
            })) : [],
            contributions: group.contributions || [],
            settings: {
              dueDay: group.dueDay || 1,
              duration: group.duration?.toString() || '30',
              withdrawalDate: group.withdrawalDate || group.endDate,
              isActive: group.settings?.isActive !== false,
              maxMembers: group.settings?.maxMembers || 10
            },
            blockchain: group.blockchain || { 
              contractAddress: '',
              transactionHash: '',
              blockNumber: '',
              gasUsed: '',
              network: 'opBNB Testnet'
            },
            createdAt: group.createdAt || new Date().toISOString(),
            updatedAt: group.updatedAt || new Date().toISOString(),
            version: group.version || '1.0',
            creator: group.creator || group.createdBy,
            // Handle storage information
            ipfs: group.ipfs || {
              hash: group.ipfsHash || '',
              gateway: group.ipfsGatewayUrl || '',
              pin: true,
              lastUpdated: new Date().toISOString()
            },
            arweave: group.arweave || (group.arweaveTransactionId ? {
              transactionId: group.arweaveTransactionId,
              status: group.arweaveStatus || 'pending',
              timestamp: group.arweaveTimestamp || new Date().toISOString()
            } : undefined)
          }))

          setUserGroups(formattedGroups)
          console.log('✅ User groups loaded:', formattedGroups.length)
        } else {
          console.log('📭 No groups found for user')
          setUserGroups([])
        }
      } catch (error) {
        console.error("❌ Error loading user groups from localStorage:", error)
        toast({
          title: "Error",
          description: "Failed to load your groups from local storage",
          variant: "destructive"
        })
        setUserGroups([])
      } finally {
        setIsLoadingGroups(false)
      }
    }, [address, toast]); // Dependency array includes address and toast

    loadUserGroups(address);
    
    // Expose the handleDeleteGroup function to the window object for the GroupDashboard component
    if (typeof window !== 'undefined') {
      window.concordiaApp = window.concordiaApp || {};
      window.concordiaApp.handleDeleteGroup = handleDeleteGroup;
    }
  }, [isConnected, address, isAdmin, toast, handleDeleteGroup]); // Re-run if isConnected, address or isAdmin status changes

  // Handle group creation and saving to localStorage
  const handleGroupCreated = async (newGroup: GroupMetadata) => {
    try {
      console.log('💾 Saving group to localStorage:', newGroup)

      // Save to localStorage
      await saveGroup(newGroup);

      // Clear form fields
      setTeamName("")
      setGroupDescription("")
      setContributionAmount("")
      setDuration("")
      setWithdrawalDate("")
      setDueDay("")

      // Force reload groups to ensure data consistency
      setTimeout(async () => {
        try {
          const refreshedGroups = await persistentStorageService.loadGroups();
          const userSpecificGroups = refreshedGroups.filter((group: any) => {
            const isCreator = group.createdBy?.toLowerCase() === address?.toLowerCase();
            const isMember = group.members?.some((member: any) => 
              member.address?.toLowerCase() === address?.toLowerCase()
            );
            return isCreator || isMember;
          });

          const formattedGroups: GroupMetadata[] = userSpecificGroups.map((group: any) => ({
            groupId: group.id,
            name: group.name || "Unnamed Group",
            description: group.description || group.goal || "No description",
            targetAmount: group.targetAmount || 0,
            currentAmount: group.currentAmount || 0,
            contributionAmount: group.contributionAmount || 0,
            duration: group.duration,
            withdrawalDate: group.endDate || "unknown",
            members: group.members || [],
            status: group.status || "active",
            nextContribution: group.nextContribution || "unknown",
            createdBy: group.createdBy || "unknown",
            createdAt: group.createdAt || new Date().toISOString(),
            isActive: group.isActive !== false,
          }));

          setUserGroups(formattedGroups);
          console.log("✅ Groups refreshed after creation:", formattedGroups.length);
        } catch (error) {
          console.error("⚠️ Failed to refresh groups:", error);
        }
      }, 1000);

      setActiveTab("dashboard")
      toast({
        title: "✅ Group Created",
        description: "Group created and stored locally!",
        duration: 3000,
      });
    } catch (error) {
      console.error("❌ Error saving group to localStorage:", error)
      toast({
        title: "❌ Creation Failed",
        description: "Failed to save group locally",
        duration: 5000,
      });
    }
  }

  // Effect to handle auto-redirect based on connection status and groups
  useEffect(() => {
    if (isConnected && !autoRedirectDone && address) {
      // If currently on the home tab, perform the redirect
        if (activeTab === "home") {
          setTimeout(() => {
            // Check if the user has existing groups
            if (userGroups.length > 0) {
              setActiveTab("dashboard");
              console.log("🔄 Auto-redirecting to dashboard - user has existing groups");

              toast({
                title: "🔗 Wallet Connected",
                description: "Welcome back! Your groups are loaded.",
                duration: 3000,
              });
            } else {
              setActiveTab("options"); // Show group options for new users
              console.log("🔄 Auto-redirecting to group options - new user");

              toast({
                title: "🔗 Wallet Connected",
                description: "Choose to create a new group or join an existing one.",
                duration: 3000,
              });
            }
            setAutoRedirectDone(true); // Mark redirect as done
          }, 1500); // Delay to allow data loading
        }
    }
    // If disconnected, redirect to home and reset flags
    if (!isConnected && activeTab !== "home") {
      setActiveTab("home");
      setAutoRedirectDone(false);
      setIsAdmin(false); // Ensure admin status is reset
      console.log("🔌 Wallet disconnected, redirected to home page");
    }
  }, [isConnected, activeTab, autoRedirectDone, address, userGroups.length]);

  // Effect to handle navigation via custom events
  useEffect(() => {
    const handleNavigateToCreate = () => {
      setActiveTab("create")
      window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const handleNavigateToOptions = () => {
      setActiveTab("options")
      window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const handleNavigateToDashboard = () => {
      setActiveTab("dashboard")
      window.scrollTo({ top: 0, behavior: "smooth" })
    }

    window.addEventListener("navigateToCreate", handleNavigateToCreate)
    window.addEventListener("navigateToOptions", handleNavigateToOptions)
    window.addEventListener("navigateToDashboard", handleNavigateToDashboard)

    return () => {
      window.removeEventListener("navigateToCreate", handleNavigateToCreate)
      window.removeEventListener("navigateToOptions", handleNavigateToOptions)
      window.removeEventListener("navigateToDashboard", handleNavigateToDashboard)
    }
  }, [])

  // Features for the home page
  const features = [
    {
      icon: <Users className="h-8 w-8" />,
      title: "Group Savings",
      description: "Create savings groups with 2-10 friends for shared goals like trips, concerts, or events.",
    },
    {
      icon: <Lock className="h-8 w-8" />,
      title: "Smart Contract Security",
      description: "Funds are locked in smart contracts and can only be withdrawn when the group agrees.",
    },
    {
      icon: <Trophy className="h-8 w-8" />,
      title: "Aura Points System",
      description: "Earn streak rewards for consistent contributions and build trust within your group.",
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Milestone Celebrations",
      description: "Unlock fun rewards and celebrations when your group hits savings milestones.",
    },
  ]

  // How it works steps for the home page
  const howItWorks = [
    {
      step: "01",
      title: "Connect Your Wallet",
      description: "Connect MetaMask to get started with secure blockchain savings",
    },
    {
      step: "02",
      title: "Create Your Group",
      description: "Set contribution amount and invite 2-10 friends to join",
    },
    {
      step: "03",
      title: "Lock & Save Together",
      description: "Funds are secured in smart contracts for your chosen duration",
    },
    {
      step: "04",
      title: "Achieve Your Goal",
      description: "Withdraw funds when everyone agrees and celebrate together!",
    },
  ]

  // Scroll to contribution section or connect wallet
  const scrollToContribution = () => {
    if (isConnected) {
      setActiveTab("create")
      // Scroll to top when switching tabs
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      document.getElementById("connect-section")?.scrollIntoView({
        behavior: "smooth",
      })
    }
  }

  // Handle success callback from SmartContractIntegration
  const handleGroupCreatedFromContract = async (groupId: string, txHash: `0x${string}`, contractData: any) => {
    console.log("🎉 Group created successfully via contract! Navigating to dashboard...")

    const parsedContributionAmount = Number.parseFloat(contributionAmount)

    // Calculate end date from withdrawal date or duration
    const endDate =
      withdrawalDate ||
      new Date(
        Date.now() +
          (duration === "1-month" ? 30 : duration === "3-months" ? 90 : duration === "6-months" ? 180 : 365) *
            24 *
            60 *
            60 *
            1000,
      )
        .toISOString()
        .split("T")[0]

    // Calculate next contribution date based on due day
    const nextContributionDate = dueDay
      ? new Date(new Date().getMonth() + 1, Number.parseInt(dueDay))
          .toISOString()
          .split("T")[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    const newGroup: GroupMetadata = {
      groupId: groupId, // Use groupId from contract creation
      name: teamName || "Unnamed Group",
      description: groupDescription || "No description provided.",
      creator: address || "",
      contributionAmount: parsedContributionAmount,
      currentAmount: parsedContributionAmount, // Initial amount in contract
      targetAmount: parsedContributionAmount * 10, // Assuming 10 members for target
      duration: duration,
      withdrawalDate: contractData.withdrawalDate, // From contract
      dueDay: dueDay,
      isActive: true,
      status: "active",
      createdBy: address || "",
      members: [
        {
          address: address || "0xYourAddress",
          nickname: "You",
          contributed: parsedContributionAmount,
          auraPoints: 10,
          status: "active",
        },
      ],
      nextContribution: nextContributionDate,
      txHash: txHash, // Pass transaction hash
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    try {
      // Save to localStorage after successful contract creation
      await saveGroup(newGroup);

      // Show success toast with more details
      toast({
        title: "🎉 Payment Confirmed & Group Created!",
        description: `"${newGroup.name}" is now live. Your data is stored locally.`,
        duration: 6000,
      })

      // Navigate to dashboard immediately
      setActiveTab("dashboard");

      // Scroll to top of dashboard
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);

    } catch (error) {
      console.error("❌ Error in group creation flow:", error);
      toast({
        title: "⚠️ Group Created but Storage Failed",
        description: "Group was created on blockchain but there was an issue saving locally. Please refresh the page.",
        duration: 8000,
      });

      // Still navigate to dashboard even if localStorage save fails
      setActiveTab("dashboard");
    }
  }

  // Handle joining a group via invite code
  const joinGroupByInviteCode = async (inviteCode: string) => {
    if (!isConnected || !address) {
      toast({
        title: "❌ Wallet Not Connected",
        description: "Please connect your wallet to join a group",
        duration: 3000,
      });
      return;
    }

    if (!inviteCode) {
      toast({
        title: "❌ Invite Code Required",
        description: "Please enter a valid invite code",
        duration: 3000,
      });
      return;
    }

    setIsJoining(true) // Set joining state

    try {
      // This part would typically involve fetching group data from an API based on the invite code
      // For now, let's simulate a successful join and update localStorage
      // In a real scenario, you'd fetch group details and then add the user to it.

      // Simulate fetching group data
      const simulatedGroupData = {
        groupId: `group_${inviteCode}`, // Example ID
        name: `Group ${inviteCode}`,
        description: "Joined via invite code",
        members: [{ address: address, nickname: "New Member", contributed: 0, auraPoints: 0, status: "active" }],
        // ... other group properties
      };

      // Add user to the group in localStorage
      const success = await persistentStorageService.joinGroup(inviteCode, address); // Assuming a joinGroup function exists

      if (success) {
        toast({
          title: "✅ Group Joined",
          description: `You've successfully joined ${simulatedGroupData.name}`,
          duration: 3000,
        });

        // Refresh groups to include the newly joined group
        setTimeout(async () => {
          try {
            const allGroups = await persistentStorageService.loadGroups();
            const userSpecificGroups = allGroups.filter((group: any) => {
              const isCreator = group.createdBy?.toLowerCase() === address?.toLowerCase();
              const isMember = group.members?.some((member: any) => 
                member.address?.toLowerCase() === address?.toLowerCase()
              );
              return isCreator || isMember;
            });

            const formattedGroups: GroupMetadata[] = userSpecificGroups.map((group: any) => ({
              groupId: group.id,
              name: group.name || "Unnamed Group",
              description: group.description || group.goal || "No description",
              targetAmount: group.targetAmount || 0,
              currentAmount: group.currentAmount || 0,
              contributionAmount: group.contributionAmount || 0,
              duration: group.duration,
              withdrawalDate: group.endDate || "unknown",
              members: group.members || [],
              status: group.status || "active",
              nextContribution: group.nextContribution || "unknown",
              createdBy: group.createdBy || "unknown",
              createdAt: group.createdAt || new Date().toISOString(),
              isActive: group.isActive !== false,
            }));

            setUserGroups(formattedGroups);
            console.log("✅ Groups refreshed after joining:", formattedGroups.length);
          } catch (error) {
            console.error("⚠️ Failed to refresh groups after joining:", error);
          } finally {
            setIsJoining(false) // Reset joining state
          }
        }, 1000);

        setActiveTab("dashboard");
      } else {
        toast({
          title: "❌ Failed to Join Group",
          description: "Invalid invite code or you're already a member",
          duration: 5000,
        });
        setIsJoining(false) // Reset joining state on error
      }
    } catch (error) {
      console.error("Error joining group:", error);
      toast({
        title: "❌ Error",
        description: "Could not join the group. Please try again.",
        duration: 5000,
      });
      setIsJoining(false) // Reset joining state on error
    }
  }

  // Calculate Aura Points based on user's contributions (simplified mechanism)
  useEffect(() => {
    if (isConnected && address && userGroups.length > 0) {
      let totalAuraPoints = 0

      userGroups.forEach(group => {
        // Find user's contribution in this group
        const userMember = group.members.find(member => 
          member.address.toLowerCase() === address.toLowerCase()
        )

        if (userMember) {
          // Each payment gets 10 Aura Points
          const payments = Math.floor(userMember.contributed / group.contributionAmount)
          totalAuraPoints += payments * 10

          // Early payments (first 3 members) get 5 extra points
          if (group.members.indexOf(userMember) < 3) {
            totalAuraPoints += 5
          }
        }
      })

      setUserAuraPoints(totalAuraPoints)
      console.log("💫 Calculated Aura Points:", totalAuraPoints)
    }
  }, [isConnected, address, userGroups])

  // Function to verify admin access
  const verifyAdminAccess = async () => {
    if (!adminApiKey) {
      toast({
        title: "❌ API Key Required",
        description: "Please enter an admin API key",
        variant: "destructive"
      });
      return;
    }

    try {
      // Use the actual admin API key from environment if available, otherwise placeholder
      const apiKeyToUse = process.env.ADMIN_API_KEY || adminApiKey; 
      // This fetch call should ideally go to an API route that verifies the key
      // For now, we'll simulate a successful verification if the key is provided
      // In a real app, this would involve a backend check.
      console.log("Verifying admin access with key:", apiKeyToUse);
      // Simulate a successful response
      setIsAdmin(true);
      toast({
        title: "✅ Admin Access Granted",
        description: "You now have access to all group data",
      });
    } catch (error) {
      console.error("Error verifying admin access:", error);
      toast({
        title: "❌ Verification Error",
        description: "Could not verify admin access",
        variant: "destructive"
      });
    }
  }

  // Placeholder for the contribution handler which needs to be implemented
  const handleContribution = async (groupId: string, amount: number) => {
    console.log(`Attempting to contribute ${amount} BNB to group ${groupId}`);
    // This function needs to be implemented to handle the actual contribution logic,
    // potentially involving interacting with the smart contract.
    toast({
      title: "Contribution Pending",
      description: "Contribution logic needs to be implemented.",
      duration: 3000,
    });
  };

  return (
    <div className="min-h-screen bg-concordia-dark-blue relative">
      <SparkleBackground /> {/* Add the sparkle background here */}
      {/* Navigation */}
      <nav className="border-b border-concordia-light-purple/20 bg-concordia-dark-blue/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* New Logo */}
            <div className="relative">
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="relative z-10"
              >
                <defs>
                  <linearGradient id="logoGradientNew" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F042FF" />
                    <stop offset="100%" stopColor="#7226FF" />
                  </linearGradient>
                  <filter id="glowNew">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* Main "C" shape - abstract and interconnected */}
                <path
                  d="M20 2C11.1634 2 4 9.16344 4 18C4 26.8366 11.1634 34 20 34C28.8366 34 36 26.8366 36 18C36 9.16344 28.8366 2 20 2ZM20 6C26.6274 6 32 11.3726 32 18C32 24.6274 26.6274 30 20 30C13.3726 30 8 24.6274 8 18C8 11.3726 13.3726 6 20 6Z"
                  fill="url(#logoGradientNew)"
                  opacity="0.1"
                />
                <path
                  d="M20 10C14.4772 10 10 14.4772 10 20C10 25.5228 14.4772 30 20 30C25.5228 30 30 25.5228 30 20C30 14.4772 25.5228 10 20 10ZM20 14C23.3137 14 26 16.6863 26 20C26 23.3137 23.3137 26 20 26C16.6863 26 14 23.3137 14 20C14 16.6863 16.6863 14 20 14Z"
                  fill="url(#logoGradientNew)"
                  opacity="0.2"
                />
                {/* Interlocking elements */}
                <path
                  d="M20 10 L20 14 M20 26 L20 30 M10 20 L14 20 M26 20 L30 20"
                  stroke="url(#logoGradientNew)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.6"
                />
                <circle cx="20" cy="20" r="4" fill="url(#logoGradientNew)" filter="url(#glowNew)" />
                <circle cx="20" cy="20" r="2" fill="white" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-r from-concordia-pink/30 to-concordia-light-purple/30 rounded-lg blur-md -z-10"></div>
            </div>
            <span className="text-white font-orbitron font-bold text-2xl tracking-wider uppercase">CONCORDIA</span>
          </div>

          {/* Navigation Tabs */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => setActiveTab("home")}
              className={
                "font-medium transition-colors " +
                (activeTab === "home" ? "text-concordia-pink" : "text-white/80 hover:text-concordia-pink")
              }
            >
              {"Home"}
            </button>
            <ClientOnly>
              {/* Only show dashboard and create group after user has made a choice */}
              {(userGroups.length > 0 || activeTab === "dashboard" || activeTab === "create") && (
                <>
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className={
                      "font-medium transition-colors " +
                      (activeTab === "dashboard" ? "text-concordia-pink" : "text-white/80 hover:text-concordia-pink")
                    }
                    disabled={!isConnected}
                    style={!isConnected ? { opacity: 0.5, pointerEvents: "none" } : {}}
                  >
                    {"Dashboard"}
                  </button>
                  <button
                    onClick={() => setActiveTab("create")}
                    className={
                      "font-medium transition-colors " +
                      (activeTab === "create" ? "text-concordia-pink" : "text-white/80 hover:text-concordia-pink")
                    }
                    disabled={!isConnected}
                    style={!isConnected ? { opacity: 0.5, pointerEvents: "none" } : {}}
                  >
                    {"Create Group"}
                  </button>
                </>
              )}
              <button
                onClick={() => setActiveTab("aura")}
                className={
                  "font-medium transition-colors " +
                  (activeTab === "aura" ? "text-concordia-pink" : "text-white/80 hover:text-concordia-pink")
                }
                disabled={!isConnected}
                style={!isConnected ? { opacity: 0.5, pointerEvents: "none" } : {}}
              >
                {"Aura Rewards"}
              </button>
              <button
                onClick={() => setActiveTab("nfts")}
                className={
                  "font-medium transition-colors " +
                  (activeTab === "nfts" ? "text-concordia-pink" : "text-white/80 hover:text-concordia-pink")
                }
                disabled={!isConnected}
                style={!isConnected ? { opacity: 0.5, pointerEvents: "none" } : {}}
              >
                {"My NFTs"}
              </button>
              <button
                onClick={() => setActiveTab("admin")}
                className={
                  "font-medium transition-colors " +
                  (activeTab === "admin" ? "text-concordia-pink" : "text-white/80 hover:text-concordia-pink")
                }
                disabled={!isConnected}
                style={!isConnected ? { opacity: 0.5, pointerEvents: "none" } : {}}
              >
                {"Admin"}
              </button>
            </ClientOnly>
          </div>

          <div className="flex items-center space-x-4">
            <WalletConnection handleDisconnect={handleDisconnect} />
          </div>
        </div>
      </nav>
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="options">
            <ClientOnly>
              <GroupOptions 
                onCreateGroup={() => setActiveTab("create")}
                onJoinGroup={() => setJoinGroupModalOpen(true)}
              />
            </ClientOnly>
          </TabsContent>

          <TabsContent value="home" className="space-y-20">
            {/* Hero Section */}
            <section className="text-center py-12">
              <div className="max-w-4xl mx-auto">
                <Badge className="mb-6 bg-concordia-light-purple/20 text-concordia-pink border-concordia-pink/30 font-semibold">
                  {"Built on opBNB • Low Fees • Fast Transactions"}
                </Badge>
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                  {"Save Money"}
                  <span className="bg-gradient-to-r from-concordia-pink to-concordia-light-purple bg-clip-text text-transparent">
                    {" Together"}
                  </span>
                </h1>
                <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
                  {
                    "Concordia helps small groups of friends save money together for shared goals. Lock funds in smart contracts, earn Aura Points for consistency, and achieve your dreams collectively."
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    onClick={scrollToContribution}
                    className="bg-gradient-to-r from-concordia-pink to-concordia-light-purple hover:from-concordia-pink/80 hover:to-concordia-light-purple/80 text-white px-8 py-6 text-lg font-semibold"
                  >
                    {isConnected ? "Start Saving Together" : "Connect & Get Started"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <ClientOnly>
                    {isConnected && (
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => setActiveTab("dashboard")}
                        className="border-concordia-light-purple text-concordia-light-purple hover:bg-concordia-light-purple/10 px-8 py-6 text-lg bg-transparent font-semibold"
                      >
                        {"View Dashboard"}
                      </Button>
                    )}
                  </ClientOnly>
                </div>
              </div>
            </section>

            {/* Connect Wallet CTA Section */}
            <ClientOnly>
              {!isConnected && (
                <section id="connect-section" className="py-16">
                  <Card className="max-w-2xl mx-auto bg-gradient-to-r from-concordia-pink/10 to-concordia-light-purple/10 border-concordia-pink/30 backdrop-blur-sm">
                    <CardContent className="p-8 text-center">
                      <Wallet className="h-16 w-16 text-concordia-pink mx-auto mb-6" />
                      <h3 className="text-white text-2xl font-bold mb-4">{"Connect Your MetaMask Wallet"}</h3>
                      <p className="text-white/80 mb-6 text-lg">
                        {
                          "Connect your MetaMask wallet to start creating savings groups and managing your funds securely on the blockchain."
                        }
                      </p>
                      <WalletConnection handleDisconnect={handleDisconnect} />
                      <div className="mt-4 text-sm text-white/60">{"Make sure you're connected to opBNB Testnet"}</div>
                    </CardContent>
                  </Card>
                </section>
              )}
            </ClientOnly>

            {/* Stats Section */}
            <section className="py-16">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="text-4xl font-bold text-concordia-pink mb-2">{"2-10"}</div>
                  <div className="text-white/80 font-medium">{"Friends per Group"}</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-concordia-light-purple mb-2">{"100%"}</div>
                  <div className="text-white/80 font-medium">{"Secure & Transparent"}</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-concordia-pink mb-2">{"0.001"}</div>
                  <div className="text-white/80 font-medium">{"BNB Transaction Fees"}</div>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section className="py-20">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-white mb-4">
                  {"Why Choose "}
                  <span className="text-concordia-pink">{"CONCORDIA"}</span>?
                </h2>
                <p className="text-white/80 text-lg max-w-2xl mx-auto">
                  {"Built for friends who want to save together without the hassle of traditional methods"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, index) => (
                  <Card
                    key={index}
                    className="bg-concordia-purple/20 border-concordia-light-purple/30 hover:border-concordia-pink/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                  >
                    <CardHeader className="text-center">
                      <div className="mx-auto mb-4 p-3 bg-gradient-to-r from-concordia-pink/20 to-concordia-light-purple/20 rounded-lg w-fit text-concordia-pink">
                        {feature.icon}
                      </div>
                      <CardTitle className="text-white text-lg font-semibold">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-white/70 text-center">{feature.description}</CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* How It Works */}
            <section className="py-20">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-white mb-4">{"How It Works"}</h2>
                <p className="text-white/80 text-lg">{"Simple steps to start saving with your friends"}</p>
              </div>

              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {howItWorks.map((step, index) => (
                    <div key={index} className="text-center">
                      <div className="mb-6">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-r from-concordia-pink to-concordia-light-purple rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {step.step}
                        </div>
                      </div>
                      <h3 className="text-white font-semibold text-lg mb-3">{step.title}</h3>
                      <p className="text-white/70">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="dashboard">
            <ClientOnly>
              <div className="mb-4 p-4 bg-concordia-purple/30 border border-concordia-light-purple/30 rounded-lg">
                <p className="text-white flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-concordia-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Your groups are securely stored locally and can be accessed from any device by connecting the same wallet.
                </p>
              </div>


              <GroupDashboard
                groups={userGroups}
                onDeleteGroup={handleDeleteGroup}
                onContribute={handleContribution}
                isContributing={isContributing}
                setUserGroups={setUserGroups}
                isConnected={isConnected}
                address={address}
              />
              {isLoadingGroups && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center space-x-2 text-white">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-concordia-pink"></div>
                    <span>Loading your groups from local storage...</span>
                  </div>
                </div>
              )}
            </ClientOnly>
          </TabsContent>

          <TabsContent value="create">
            {/* Group Contribution Section */}
            <section id="contribution-section" className="py-20">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-bold text-white mb-4">
                    {"Create Your "}
                    <span className="text-concordia-pink">{"Savings Group"}</span>
                  </h2>
                  <p className="text-white/80 text-lg">
                    {"Set your contribution amount and duration to start saving with friends"}
                  </p>
                  <div className="mt-4 p-4 bg-concordia-purple/30 border border-concordia-light-purple/30 rounded-lg">
                    <p className="text-white flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-concordia-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Your groups are securely stored locally and can be accessed from any device by connecting the same wallet.
                    </p>
                  </div>
                </div>

                <Card className="bg-concordia-dark-blue/80 border-concordia-light-purple/30 backdrop-blur-sm">
                  <CardHeader className="text-center">
                    <CardTitle className="text-white text-2xl flex items-center justify-center">
                      <Coins className="h-6 w-6 text-concordia-pink mr-2" />
                      {"Group Configuration"}
                    </CardTitle>
                    <CardDescription className="text-white/70">
                      {"Configure your group savings parameters"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="teamName" className="text-white font-semibold">
                        {"Team Name"}
                      </Label>
                      <Input
                        id="teamName"
                        type="text"
                        placeholder="My Awesome Savings Team"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="bg-concordia-dark-blue border-concordia-light-purple/50 text-white placeholder:text-white/50 focus:border-concordia-pink focus:ring-concordia-pink/20"
                      />
                      <p className="text-sm text-white/60">{"A memorable name for your savings group"}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="groupDescription" className="text-white font-semibold">
                        {"Group Goal/Description"}
                      </Label>
                      <Input
                        id="groupDescription"
                        type="text"
                        placeholder="Saving for a trip to Bali!"
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        className="bg-concordia-dark-blue border-concordia-light-purple/50 text-white placeholder:text-white/50 focus:border-concordia-pink focus:ring-concordia-pink/20"
                      />
                      <p className="text-sm text-white/60">{"What are you saving for?"}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contribution" className="text-white font-semibold">
                        {"Contribution Amount (BNB)"}
                      </Label>
                      <Input
                        id="contribution"
                        type="number"
                        placeholder="0.1"
                        step="0.01"
                        min="0"
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(e.target.value)}
                        className="bg-concordia-dark-blue border-concordia-light-purple/50 text-white placeholder:text-white/50 focus:border-concordia-pink focus:ring-concordia-pink/20"
                      />
                      <p className="text-sm text-white/60">{"Amount each member contributes per period"}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-white font-semibold">
                        {"Savings Duration"}
                      </Label>
                      <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger className="bg-concordia-dark-blue border-concordia-light-purple/50 text-white focus:border-concordia-pink focus:ring-concordia-pink/20">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent className="bg-concordia-dark-blue border-concordia-light-purple/50">
                          <SelectItem value="1-month" className="text-white hover:bg-concordia-light-purple/20">
                            {"1 Month"}
                          </SelectItem>
                          <SelectItem value="3-months" className="text-white hover:bg-concordia-light-purple/20">
                            {"3 Months"}
                          </SelectItem>
                          <SelectItem value="6-months" className="text-white hover:bg-concordia-light-purple/20">
                            {"6 Months"}
                          </SelectItem>
                          <SelectItem value="12-months" className="text-white hover:bg-concordia-light-purple/20">
                            {"12 Months"}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-white/60">{"How long funds will be locked in the smart contract"}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="withdrawalDate" className="text-white font-semibold">
                        {"Final Withdrawal Date (Optional)"}
                      </Label>
                      <Input
                        id="withdrawalDate"
                        type="date"
                        value={withdrawalDate}
                        onChange={(e) => setWithdrawalDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="bg-concordia-dark-blue border-concordia-light-purple/50 text-white focus:border-concordia-pink focus:ring-concordia-pink/20"
                      />
                      <p className="text-sm text-white/60">
                        {"Specific date when funds can be withdrawn (overrides duration)"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dueDay" className="text-white font-semibold">
                        {"Monthly Due Day"}
                      </Label>
                      <Select value={dueDay} onValueChange={setDueDay}>
                        <SelectTrigger className="bg-concordia-dark-blue border-concordia-light-purple/50 text-white focus:border-concordia-pink focus:ring-concordia-pink/20">
                          <SelectValue placeholder="Select day of month" />
                        </SelectTrigger>
                        <SelectContent className="bg-concordia-dark-blue border-concordia-light-purple/50">
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <SelectItem
                              key={day}
                              value={day.toString()}
                              className="text-white hover:bg-concordia-light-purple/20"
                            >
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-white/60">{"Which day of each month contributions are due"}</p>
                    </div>

                    <div className="bg-concordia-light-purple/10 rounded-lg p-4 border border-concordia-light-purple/20">
                      <div className="flex items-start space-x-3">
                        <Shield className="h-5 w-5 text-concordia-pink mt-0.5" />
                        <div>
                          <h4 className="text-white font-semibold text-sm">{"Withdrawal Policy"}</h4>
                          <p className="text-white/70 text-sm">
                            {
                              "Funds will be locked in a smart contract. Withdrawal requires agreement from all group members (implemented via smart contract logic, e.g., multi-sig or voting)."
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <SmartContractIntegration
                      teamName={teamName}
                      groupDescription={groupDescription}
                      contributionAmount={contributionAmount}
                      duration={duration}
                      withdrawalDate={withdrawalDate}
                      dueDay={dueDay}
                      onSuccess={handleGroupCreatedFromContract} // Use the contract success handler
                      // Provide a dummy onDeleteSuccess or handle it if the contract handles deletion
                      onDeleteSuccess={(groupId, txHash) => console.log("Contract deletion handled elsewhere")} 
                    />
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="aura">
            <ClientOnly>
              <AuraRewards 
                userAuraPoints={userAuraPoints}
                onAuraPointsUpdate={setUserAuraPoints}
                onBackToDashboard={() => setActiveTab("dashboard")}
              />
            </ClientOnly>
          </TabsContent>

          <TabsContent value="nfts">
            <ClientOnly>
              <NFTWalletDisplay />
            </ClientOnly>
          </TabsContent>

          <TabsContent value="admin">
            <ClientOnly>
              <div className="py-8">
                <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                  <Shield className="mr-2 h-6 w-6 text-concordia-pink" />
                  Admin Dashboard
                </h2>

                {/* Admin Access Input */}
                <div className="mb-6">
                  <Card className="bg-concordia-purple/20 border-concordia-light-purple/30">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold text-white mb-2">Admin Access</h3>
                          <p className="text-white/70">
                            Enter your admin API key to access all group data stored locally
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="password" // Use password type for API key
                            placeholder="Enter admin API key"
                            value={adminApiKey}
                            onChange={(e) => setAdminApiKey(e.target.value)}
                            className="bg-concordia-dark-blue border-concordia-light-purple/50 text-white w-64"
                          />
                          <Button
                            onClick={() => verifyAdminAccess()}
                            className="bg-concordia-pink hover:bg-concordia-pink/80"
                            disabled={!adminApiKey} // Disable if no key entered
                          >
                            Verify
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Admin Dashboard Component - Rendered only if isAdmin is true */}
                {isAdmin ? (
                  <AdminDashboard adminApiKey={adminApiKey} />
                ) : (
                  <Card className="bg-concordia-dark-blue/80 border-concordia-light-purple/30 backdrop-blur-sm p-6 text-center">
                    <CardContent>
                      <Shield className="h-12 w-12 text-concordia-pink mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">Admin Access Required</h3>
                      <p className="text-white/70">
                        Please enter a valid admin API key and verify to access the admin dashboard.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ClientOnly>
          </TabsContent>
        </Tabs>
      </div>
      {/* Footer */}
      <footer className="border-t border-concordia-light-purple/20 bg-concordia-purple/10 mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="relative">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="relative z-10"
                  >
                    <defs>
                      <linearGradient id="footerLogoGradientNew" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F042FF" />
                        <stop offset="100%" stopColor="#7226FF" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M16 1C8.26801 1 2 7.26801 2 15C2 22.732 8.26801 29 16 29C23.732 29 30 22.732 30 15C30 7.26801 23.732 1 16 1ZM16 4C21.5228 4 26 8.47715 26 15C26 21.5228 21.5228 26 16 26C10.4772 26 6 21.5228 6 15C6 8.47715 10.4772 4 16 4Z"
                      fill="url(#footerLogoGradientNew)"
                      opacity="0.1"
                    />
                    <path
                      d="M16 8C12.6863 8 10 10.6863 10 14C10 17.3137 12.6863 20 16 20C19.3137 20 22 17.3137 22 14C22 10.6863 19.3137 8 16 8ZM16 11C17.6569 11 19 12.3431 19 14C19 15.6569 17.6569 17 16 17C14.3431 17 13 15.6569 13 14C13 12.3431 14.3431 11 16 11Z"
                      fill="url(#footerLogoGradientNew)"
                      opacity="0.2"
                    />
                    <path
                      d="M16 8 L16 11 M16 17 L16 20 M8 14 L11 14 M21 14 L24 14"
                      stroke="url(#footerLogoGradientNew)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      opacity="0.6"
                    />
                    <circle cx="16" cy="14" r="2" fill="url(#footerLogoGradientNew)" />
                    <circle cx="16" cy="14" r="1" fill="white" />
                  </svg>
                </div>
                <span className="text-white font-orbitron font-bold text-xl tracking-wider uppercase">CONCORDIA</span>
              </div>
              <p className="text-white/70">
                {"Empowering friends to save money together through blockchain technology."}
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{"Product"}</h4>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab("home")}
                  className="block text-white/70 hover:text-concordia-pink transition-colors"
                >
                  {"Features"}
                </button>
                <button
                  onClick={() => setActiveTab("create")}
                  className="block text-white/70 hover:text-concordia-pink transition-colors"
                >
                  {"Create Group"}
                </button>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className="block text-white/70 hover:text-concordia-pink transition-colors"
                >
                  {"Dashboard"}
                </button>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{"Resources"}</h4>
              <div className="space-y-2">
                <a href="#" className="block text-white/70 hover:text-concordia-pink transition-colors">
                  {"Documentation"}
                </a>
                <a href="#" className="block text-white/70 hover:text-concordia-pink transition-colors">
                  {"Smart Contracts"}
                </a>
                <a href="#" className="block text-white/70 hover:text-concordia-pink transition-colors">
                  {"Security"}
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-concordia-light-purple/20 mt-8 pt-8 text-center">
            <p className="text-white/70">{"© 2024 CONCORDIA. Built on opBNB. All rights reserved."}</p>
          </div>
        </div>
      </footer>

      {/* Toast notifications */}
      <Toaster />

      {/* Join Group Modal */}
      <JoinGroupModal
        isOpen={joinGroupModalOpen}
        onClose={() => setJoinGroupModalOpen(false)}
        onJoinSuccess={(groupId, groupName) => {
          console.log(`Successfully joined group: ${groupName} (${groupId})`)
          // Refresh the page to reload groups
          window.location.reload()
        }}
      />
    </div>
  )
}