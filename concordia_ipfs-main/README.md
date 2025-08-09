# 🏛️ Concordia - Decentralized Savings Group DApp

A revolutionary decentralized application that enables friends to save money together using blockchain technology and decentralized storage (IPFS and Arweave) for permanent data storage.

## 📋 Overview

This repository contains the Concordia DApp, a decentralized savings group application that allows users to create and manage savings groups on the blockchain. The application uses IPFS and Arweave for decentralized storage of group data.

## ✨ Features

- **🔗 Blockchain Integration**: Smart contracts on opBNB Testnet
- **🗂️ Permanent Storage**: All data stored on IPFS and Arweave
- **👥 Team Collaboration**: Multiple members can join and contribute
- **🎯 Goal Tracking**: Visual progress tracking and milestone celebrations
- **🏆 Aura Points System**: Gamified contribution rewards
- **🔒 Secure Withdrawals**: Multi-signature withdrawal system
- **📱 Responsive Design**: Works on desktop and mobile

## 🐳 Docker Deployment

The easiest way to deploy Concordia is using Docker. We provide several options:

### Option 1: Using the Setup Scripts (Recommended)

#### For Linux/macOS:
```bash
./run-docker.sh
```

#### For Windows:
```bash
.\run-docker.bat
```

These scripts will:
1. Check if Docker is installed
2. Create a default `.env` file if needed
3. Allow you to customize environment variables
4. Build and run the Docker container

### Option 2: Using Docker Compose

```bash
docker-compose up -d
```

### Option 3: Manual Docker Commands

```bash
# Build the Docker image
docker build -t concordia-ipfs .

# Run the Docker container
docker run -p 5000:5000 \
  -e NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address_here \
  -e ARWEAVE_KEY=your_arweave_key_here \
  concordia-ipfs
```

For detailed Docker deployment instructions, see [DOCKER-DEPLOYMENT.md](./DOCKER-DEPLOYMENT.md).

## 🚀 Development Setup

### Prerequisites

1. **Node.js 18+** and **npm**
2. **MetaMask** wallet with opBNB Testnet configured

### Environment Setup

Use our environment setup scripts to quickly configure your environment:

#### For Linux/macOS:
```bash
./scripts/setup-env.sh
```

#### For Windows:
```bash
.\scripts\setup-env.bat
```

These scripts will:
1. Create `.env.local` and `.env.production` files from templates
2. Allow you to customize environment variables
3. Set up Docker environment variables

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

## 📄 Environment Variables

See [env.template](./concordia-main/env.template) for a list of required environment variables.

## 📚 Documentation

- [Docker Deployment Guide](./DOCKER-DEPLOYMENT.md)
- [Arweave Key Guide](./concordia-main/ARWEAVE-KEY-GUIDE.md)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.