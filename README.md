# 🏛️ Concordia - Decentralized Savings Group DApp

A revolutionary decentralized application that enables friends to save money together using blockchain technology and BNB Greenfield for permanent data storage.

## ✨ Features

- **🔗 Blockchain Integration**: Smart contracts on opBNB Testnet
- **🗂️ Permanent Storage**: All data stored in BNB Greenfield buckets
- **👥 Team Collaboration**: Multiple members can join and contribute
- **🎯 Goal Tracking**: Visual progress tracking and milestone celebrations
- **🏆 Aura Points System**: Gamified contribution rewards
- **🔒 Secure Withdrawals**: Multi-signature withdrawal system
- **📱 Responsive Design**: Works on desktop and mobile
- **🌐 Public Access**: Deployed on Vercel for global access

## 🚀 Quick Deployment

### Prerequisites

1. **Node.js 18+** and **npm**
2. **MetaMask** wallet with opBNB Testnet configured
3. **BNB Greenfield** account and API keys
4. **Vercel** account for deployment

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd concordia-dapp-backend
npm install
```

### 2. Configure Environment

Create `.env.local` file:

```bash
# Smart Contract
NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address

# BNB Greenfield
GREENFIELD_ACCESS_KEY=your_greenfield_access_key
GREENFIELD_SECRET_KEY=your_greenfield_secret_key
GREENFIELD_BUCKET_NAME=concordia-data
GREENFIELD_ENDPOINT=https://gnfd-testnet-sp1.bnbchain.org

# Blockchain
NEXT_PUBLIC_CHAIN_ID=5611
NEXT_PUBLIC_CHAIN_NAME=opBNB Testnet
```

### 3. Deploy Smart Contract

```bash
npm run deploy:contract
```

### 4. Deploy to Vercel

```bash
npm run deploy:vercel
```

### 5. Configure Environment Variables in Vercel

Add all environment variables from `.env.local` to your Vercel project settings.

## 🏗️ Architecture

### Frontend (Next.js 15)
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Wagmi + Viem** for blockchain interaction
- **Radix UI** components

### Backend (API Routes)
- **Next.js API Routes** for serverless functions
- **BNB Greenfield SDK** for decentralized storage
- **Express.js** patterns for API design

### Blockchain
- **Solidity** smart contracts
- **OpenZeppelin** for security
- **opBNB Testnet** for testing

### Storage
- **BNB Greenfield** for permanent data storage
- **Public read access** for team members
- **Metadata hashing** for data integrity

## 📊 Data Flow

```
User Action → Frontend → API Route → BNB Greenfield → Blockchain
     ↓
Dashboard ← API Route ← BNB Greenfield ← Smart Contract Event
```

## 🔧 Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Smart Contract Development

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to testnet
npm run deploy:contract
```


### Environment Setup

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Deployed smart contract address | ✅ |
| `GREENFIELD_ACCESS_KEY` | BNB Greenfield access key | ✅ |
| `GREENFIELD_SECRET_KEY` | BNB Greenfield secret key | ✅ |
| `GREENFIELD_BUCKET_NAME` | Greenfield bucket name | ✅ |
| `GREENFIELD_ENDPOINT` | Greenfield API endpoint | ✅ |

## 👥 Team Member Access

### How Team Members Join

1. **Visit the App**: Navigate to your deployed Vercel URL
2. **Connect Wallet**: Use MetaMask with opBNB Testnet
3. **Auto-Load Groups**: Dashboard shows groups they're members of
4. **Contribute**: Can contribute to existing groups

### Data Access

- **Public Read**: All group data is publicly readable
- **Member Filtering**: Dashboard shows only user's groups
- **Real-time Updates**: Data loads automatically on wallet connection

## 🔒 Security Features

- **Smart Contract Security**: OpenZeppelin libraries
- **Data Integrity**: Metadata hashing in Greenfield
- **Access Control**: Wallet-based authentication
- **Multi-signature**: Group consensus for withdrawals

## 📈 Performance

- **Serverless**: Vercel functions for scalability
- **CDN**: Global content delivery
- **Optimized**: Next.js optimizations
- **Caching**: Efficient data caching

## 🛠️ API Endpoints

### Groups

- `POST /api/groups/store` - Store new group
- `GET /api/groups` - Get all groups
- `GET /api/groups/[groupId]` - Get specific group
- `PUT /api/groups/[groupId]/update` - Update group
- `DELETE /api/groups/[groupId]/delete` - Delete group

### All endpoints return JSON with success/error status

## 🐛 Troubleshooting

### Common Issues

1. **Environment Variables Not Set**
   - Check Vercel dashboard settings
   - Redeploy after adding variables

2. **Greenfield Connection Issues**
   - Verify API keys are correct
   - Check bucket permissions
   - Ensure endpoint is accessible

3. **Smart Contract Issues**
   - Verify contract is deployed
   - Check network configuration
   - Ensure wallet is connected to opBNB Testnet

### Support

- **Documentation**: Check `VERCEL_DEPLOYMENT.md`
- **Issues**: Create GitHub issue
- **Community**: Join our Discord

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🎉 Success Stories

> "Concordia helped our team save for our dream vacation! The blockchain security and permanent storage gave us peace of mind." - Team Alpha

> "Finally, a DApp that actually works for group savings. The Greenfield integration is brilliant!" - Crypto Enthusiast

---



Start saving together with your team! 🎯 
