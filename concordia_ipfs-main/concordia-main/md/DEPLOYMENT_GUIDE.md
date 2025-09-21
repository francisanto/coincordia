# 🚀 Quick Deployment Guide

## Fix the "Network error occurred" Issue

The error occurs because the smart contract is not deployed. Follow these steps:

### 1. Set up Environment Variables

Create `.env` file in the `backend` directory:

```env
# Network Configuration
NETWORK=opBNB Testnet
RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
PRIVATE_KEY=your_private_key_here

# BNB Greenfield Configuration (optional for now)
GREENFIELD_ENDPOINT=https://gnfd-testnet-sp1.bnbchain.org
GREENFIELD_CHAIN_ID=5600
GREENFIELD_BUCKET=concordia-data
```

### 2. Get Testnet ETH

1. Go to [opBNB Testnet Faucet](https://testnet.bnbchain.org/faucet-smart)
2. Enter your wallet address
3. Request testnet ETH

### 3. Deploy the Contract

```bash
cd backend
node deploy.js
```

### 4. Update Frontend Configuration

Copy the deployed contract address to `.env.local` in the root directory:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address
NEXT_PUBLIC_NETWORK=opBNB Testnet
NEXT_PUBLIC_RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 5. Start the Application

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
npm run dev
```

### 6. Connect Wallet

1. Open MetaMask
2. Add opBNB Testnet network:
   - Network Name: opBNB Testnet
   - RPC URL: https://opbnb-testnet-rpc.bnbchain.org
   - Chain ID: 5611
   - Currency Symbol: tBNB
3. Connect your wallet to the app

## ✅ Success!

After deployment, the "Create Group on Blockchain" button should work properly and open MetaMask for transaction confirmation.

## 🔧 Troubleshooting

- **"Invalid contract address"**: Contract not deployed - run deployment script
- **"Insufficient funds"**: Get testnet ETH from faucet
- **"Network error"**: Check wallet network (should be opBNB Testnet)
- **"Transaction failed"**: Check console for detailed error messages 