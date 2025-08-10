"use client"

import React from "react"
import type { ReactNode } from "react"
import { WagmiProvider, createConfig } from "wagmi"
import { injected } from "wagmi/connectors" // Correct import for the factory function
import { opBNBTestnet } from "wagmi/chains"
import { http } from "viem" // Import http from viem
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const config = createConfig({
  chains: [opBNBTestnet],
  transports: {
    [opBNBTestnet.id]: http("https://opbnb-testnet-rpc.bnbchain.org"),
  },
  connectors: [
    injected({
      chains: [opBNBTestnet],
      options: { name: "MetaMask" }, // Explicitly name the injected connector as MetaMask
    }),
  ],
})

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient())

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
