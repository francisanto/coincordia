# Contract Deployment Guide

## Step 1: Set up Environment Variables

Create a `.env` file in your project root with your private key:

```bash
# Create .env file
touch .env
```

Add your private key to the `.env` file:
```
PRIVATE_KEY=0xYourPrivateKeyHere
```

**⚠️ IMPORTANT:** 
- Never share your private key
- Never commit the `.env` file to git
- Make sure you have enough BNB in your wallet for deployment

## Step 2: Get Test BNB

1. Go to [BNB Faucet](https://testnet.bnbchain.org/faucet-smart)
2. Enter your wallet address
3. Request test BNB
4. Wait for the BNB to arrive in your wallet

## Step 3: Deploy the Contract

Run the deployment command:

```bash
npx hardhat run scripts/deploy-contract.js --network opbnbTestnet
```

## Step 4: Update Environment Variables

After deployment, you'll get a contract address. Update your environment variables:

```bash
# In your .env file
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourNewContractAddress
```

## Step 5: Verify Deployment

Check your contract on the explorer:
- Go to: https://testnet.bscscan.com/address/0xYourContractAddress
- Verify the contract is deployed and has code

## Step 6: Update Your App

Update your app to use the new contract address:

1. Update `NEXT_PUBLIC_CONTRACT_ADDRESS` in Railway environment variables
2. Deploy your app to Railway
3. Test group creation

## Troubleshooting

### If deployment fails:
1. Check you have enough BNB (at least 0.01 BNB)
2. Verify your private key is correct
3. Check network connectivity
4. Try again with higher gas limit

### If transaction fails:
1. Check contract address is correct
2. Verify ABI matches deployed contract
3. Check wallet has enough BNB for transactions

## Ready to Deploy?

Run this command when you're ready:

```bash
npx hardhat run scripts/deploy-contract.js --network opbnbTestnet
``` 