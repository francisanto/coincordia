# 🚀 Run Concordia DApp Locally

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Deploy Smart Contract (First Time Only)
```bash
npm run deploy:contract
```

**Copy the contract address** that gets output and add it to your `.env.local` file.

### 3. Create Environment File
Create `.env.local` file:
```bash
# Smart Contract (from step 2)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...your_contract_address

# Your Greenfield Bucket (already configured)
GREENFIELD_BUCKET_ID=0x000000000000000000000000000000000000000000000000000000000000566f
GREENFIELD_ENDPOINT=https://gnfd-testnet-sp1.bnbchain.org

# Blockchain Network
NEXT_PUBLIC_CHAIN_ID=5611
NEXT_PUBLIC_CHAIN_NAME=opBNB Testnet
```

### 4. Run the Application
```bash
npm run dev
```

Your app will be running at: `http://localhost:3000`

## 🎯 How to Use

### 1. Connect Wallet
- Open `http://localhost:3000`
- Click "Connect MetaMask"
- Make sure you're on opBNB Testnet
- Get test BNB from [faucet](https://testnet.bnbchain.org/faucet-smart)

### 2. Create a Group
- Go to "Create Group" tab
- Fill in group details
- Click "Create Group on Blockchain"
- Approve transaction in MetaMask

### 3. View Dashboard
- Automatically redirects after creation
- Shows your groups
- Data is stored locally (temporary solution)

## 📊 Current Status

✅ **Smart Contract Integration** - Working
✅ **Wallet Connection** - Working  
✅ **Group Creation** - Working
✅ **Dashboard Display** - Working
✅ **Data Persistence** - Working (localStorage)
🔄 **Greenfield Integration** - In Progress

## 🔧 Data Storage

Currently using **localStorage** as temporary storage:
- ✅ No data loss on page refresh
- ✅ Groups persist between sessions
- ✅ Team member access working
- 🔄 Will be upgraded to your Greenfield bucket

## 🎉 Success Indicators

- ✅ App loads without errors
- ✅ Wallet connects successfully
- ✅ Group creation works
- ✅ Dashboard shows groups
- ✅ Data persists after refresh
- ✅ Payment confirmation works

## 🚨 Troubleshooting

### "Contract not deployed"
```bash
npm run deploy:contract
# Copy address to .env.local
```

### "Wallet connection failed"
- Ensure MetaMask is installed
- Check you're on opBNB Testnet
- Try refreshing the page

### "Build failed"
```bash
npm install
npm run build
```

## 📝 Next Steps

1. **Test the full flow** - Create groups and verify dashboard
2. **Greenfield Integration** - Will be implemented to use your bucket
3. **Team Member Access** - Share with others to test
4. **Production Deployment** - Deploy to Vercel when ready

---

## 🎯 Ready to Test!

Your Concordia DApp is now running locally with:
- ✅ **Smart Contract Integration**
- ✅ **Wallet Connection**
- ✅ **Group Creation & Dashboard**
- ✅ **Data Persistence**
- 🔄 **Greenfield Bucket Integration** (in progress)

Start creating groups and testing the full flow! 🚀 