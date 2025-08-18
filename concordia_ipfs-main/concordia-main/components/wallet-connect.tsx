"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi"
import { opBNBTestnet } from "wagmi/chains"
import { Wallet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function WalletConnect() {
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors, error, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const { toast } = useToast()

  // Get chain ID from environment variable or default to opBNBTestnet.id
  const requiredChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "5611")

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
      await switchChain({ chainId: requiredChainId })
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
      toast({
        title: "Wrong network",
        description: "Please switch to the required network",
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