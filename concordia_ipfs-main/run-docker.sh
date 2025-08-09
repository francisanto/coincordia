#!/bin/bash

# Concordia IPFS Docker Setup Script
# This script helps set up and run the Concordia IPFS application in Docker

set -e

# Colors for output
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${GREEN}=== Concordia IPFS Docker Setup ===${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed. Please install Docker first.${NC}"
    echo "Visit https://docs.docker.com/get-docker/ for installation instructions."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Warning: Docker Compose is not installed. Using Docker only.${NC}"
    USE_COMPOSE=false
else
    USE_COMPOSE=true
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file with default values...${NC}"
    cat > .env << EOL
# Frontend variables
NEXT_PUBLIC_CONTRACT_ADDRESS=0x31ff87832e0bc5eaee333d1db549829ba0376d45aa23a41e6b12bfe17c969595
NEXT_PUBLIC_NETWORK=opBNB Testnet
NEXT_PUBLIC_RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Backend variables
PORT=5000
NODE_ENV=production
CONTRACT_ADDRESS=0x31ff87832e0bc5eaee333d1db549829ba0376d45aa23a41e6b12bfe17c969595
RPC_URL=https://opbnb-testnet-rpc.bnbchain.org

# Optional variables
ARWEAVE_KEY={}
EOL
    echo -e "${GREEN}Created .env file. Please edit it with your own values if needed.${NC}"
fi

# Ask if user wants to customize environment variables
read -p "Do you want to customize environment variables? (y/n) [n]: " customize
customize=${customize:-n}

if [[ $customize == "y" || $customize == "Y" ]]; then
    echo -e "${YELLOW}Opening .env file for editing...${NC}"
    if command -v nano &> /dev/null; then
        nano .env
    elif command -v vim &> /dev/null; then
        vim .env
    else
        echo -e "${RED}No text editor found. Please edit the .env file manually.${NC}"
    fi
fi

# Run the application
echo -e "${GREEN}Starting Concordia IPFS application...${NC}"

if [ "$USE_COMPOSE" = true ]; then
    echo -e "${GREEN}Using Docker Compose...${NC}"
    docker-compose up -d
    
    # Check if the container started successfully
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Application started successfully!${NC}"
        echo -e "${GREEN}You can access it at: http://localhost:5000${NC}"
    else
        echo -e "${RED}Failed to start the application.${NC}"
        echo "Check the logs with: docker-compose logs"
    fi
else
    echo -e "${YELLOW}Using Docker...${NC}"
    
    # Build the Docker image
    echo -e "${GREEN}Building Docker image...${NC}"
    docker build -t concordia-ipfs .
    
    # Run the Docker container
    echo -e "${GREEN}Running Docker container...${NC}"
    docker run -d --name concordia-ipfs \
        --env-file .env \
        -p 5000:5000 \
        concordia-ipfs
    
    # Check if the container started successfully
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Application started successfully!${NC}"
        echo -e "${GREEN}You can access it at: http://localhost:5000${NC}"
        echo "Check the logs with: docker logs concordia-ipfs"
    else
        echo -e "${RED}Failed to start the application.${NC}"
    fi
fi

echo -e "${GREEN}=== Setup Complete ===${NC}"