"use client"

import React from "react"
import type { ReactNode } from "react"
import { createConfig, configureChains, WagmiConfig } from "wagmi"
import { InjectedConnector } from "wagmi/connectors/injected"
import { opBNBTestnet } from "wagmi/chains"
import { publicProvider } from "wagmi/providers/public"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const { chains, publicClient } = configureChains(
  [opBNBTestnet],
  [publicProvider()]
)

const config = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector({
      chains,
      options: {
        name: "MetaMask",
        shimDisconnect: true,
      },
    }),
  ],
  publicClient,
})

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient())

  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiConfig>
  )
}
