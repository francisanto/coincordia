"use client"

import React from "react"
import type { ReactNode } from "react"
import { WagmiProvider, createConfig, http } from "wagmi"
import { injected, metaMask } from "wagmi/connectors"
import { opBNBTestnet } from "viem/chains"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const config = createConfig({
  chains: [opBNBTestnet],
  transports: {
    [opBNBTestnet.id]: http("https://opbnb-testnet-rpc.bnbchain.org"),
  },
  connectors: [
    injected(),
    metaMask(),
  ],
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}