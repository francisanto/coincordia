"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAccount, useConnect, useDisconnect, useSwitchNetwork } from "wagmi"
import { opBNBTestnet } from "wagmi/chains"
import { Wallet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function WalletConnect() {
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors, error, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchNetwork } = useSwitchNetwork()
  const { toast } = useToast()

  // Get chain ID from environment variable or default to opBNBTestnet.id
  const requiredChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "5611")
  
  // Define the chain configuration
  const targetChain = {
    id: requiredChainId,
    name: 'opBNB Testnet',
    network: 'opbnb-testnet',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: ['https://opbnb-testnet-rpc.bnbchain.org'],
      },
      public: {
        http: ['https://opbnb-testnet-rpc.bnbchain.org'],
      },
    },
    blockExplorers: {
      default: {
        name: 'BscScan',
        url: 'https://testnet.bscscan.com',
      },
    },
    testnet: true,
  }

  const handleConnect = async () => {
    try {
      // Find the MetaMask connector
      const connector = connectors.find((c) => c.name === "MetaMask")
      if (connector) {
        await connect({ connector })
      } else {
        toast({
          title: "MetaMask not found",
          description: "Please install MetaMask extension",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Connection error:", err)
      toast({
        title: "Connection failed",
        description: "Could not connect to wallet",
        variant: "destructive",
      })
    }
  }

  const handleDisconnect = () => {
    disconnect()
    toast({
      title: "Disconnected",
      description: "Wallet disconnected successfully",
    })
  }

  const handleSwitchNetwork = async () => {
    try {
      // Try to switch to the target chain
      await switchNetwork({
        chainId: targetChain.id,
        chainName: targetChain.name,
        nativeCurrency: targetChain.nativeCurrency,
        rpcUrls: targetChain.rpcUrls.default.http,
        blockExplorerUrls: [targetChain.blockExplorers.default.url],
      })
      
      toast({
        title: "Network switched",
        description: "Successfully connected to the required network.",
        variant: "success",
      })
    } catch (err) {
      console.error("Network switch error:", err)
      toast({
        title: "Network switch failed",
        description: "Could not switch to the required network",
        variant: "destructive",
      })
    }
  }

  // Check if we need to switch networks
  useEffect(() => {
    if (isConnected && chainId !== requiredChainId) {
      // Automatically attempt to switch networks
      handleSwitchNetwork()
      
      // Also show a toast with manual switch option in case auto-switch fails
      toast({
        title: "Wrong network",
        description: "Attempting to switch to the required network...",
        action: (
          <Button variant="outline" onClick={handleSwitchNetwork}>
            Switch Network
          </Button>
        ),
      })
    }
  }, [isConnected, chainId])

  if (!isConnected) {
    return (
      <Button onClick={handleConnect} disabled={isPending}>
        <Wallet className="mr-2 h-4 w-4" />
        {isPending ? "Connecting..." : "Connect Wallet"}
      </Button>
    )
  }

  return (
    <Button onClick={handleDisconnect} variant="outline">
      <Wallet className="mr-2 h-4 w-4" />
      Disconnect
    </Button>
  )
}