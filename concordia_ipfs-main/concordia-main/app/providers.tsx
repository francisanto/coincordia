"use client"

import React from "react"
import type { ReactNode } from "react"
import { WagmiConfig, createConfig } from "wagmi"
import { InjectedConnector } from "wagmi/connectors/injected"
import { MetaMaskConnector } from "wagmi/connectors/metaMask"
import { publicProvider } from "wagmi/providers/public"
import { opBNBTestnet } from "viem/chains"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const config = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector({
      chains: [opBNBTestnet],
      options: {
        name: 'Injected',
        shimDisconnect: true,
      },
    }),
    new MetaMaskConnector({
      chains: [opBNBTestnet],
      options: {
        shimDisconnect: true,
      },
    }),
  ],
  provider: publicProvider(),
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiConfig>
  )
}