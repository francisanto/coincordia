// Global ambient type for EIP-1193 provider injected by wallets (e.g., MetaMask)
declare global {
  interface Window {
    ethereum?: any;
  }
}

export {};


