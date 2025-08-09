#!/bin/bash

# Concordia IPFS Environment Setup Script
# This script helps set up environment variables for the Concordia IPFS application

set -e

# Colors for output
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${GREEN}=== Concordia IPFS Environment Setup ===${NC}"

# Determine the project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONCORDIA_MAIN="$PROJECT_ROOT/concordia-main"

echo -e "${GREEN}Project root: $PROJECT_ROOT${NC}"
echo -e "${GREEN}Concordia main directory: $CONCORDIA_MAIN${NC}"

# Check if env.template exists
if [ ! -f "$CONCORDIA_MAIN/env.template" ]; then
    echo -e "${RED}Error: env.template not found in $CONCORDIA_MAIN${NC}"
    exit 1
fi

# Create .env.local file if it doesn't exist
ENV_FILE="$CONCORDIA_MAIN/.env.local"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Creating .env.local file from template...${NC}"
    cp "$CONCORDIA_MAIN/env.template" "$ENV_FILE"
    echo -e "${GREEN}Created .env.local file. Please edit it with your own values.${NC}"
fi

# Ask if user wants to customize environment variables
read -p "Do you want to customize environment variables? (y/n) [n]: " customize
customize=${customize:-n}

if [[ $customize == "y" || $customize == "Y" ]]; then
    echo -e "${YELLOW}Opening .env.local file for editing...${NC}"
    if command -v nano &> /dev/null; then
        nano "$ENV_FILE"
    elif command -v vim &> /dev/null; then
        vim "$ENV_FILE"
    else
        echo -e "${RED}No text editor found. Please edit the .env.local file manually.${NC}"
    fi
fi

# Create .env.production file for Docker
ENV_PROD_FILE="$CONCORDIA_MAIN/.env.production"
if [ ! -f "$ENV_PROD_FILE" ]; then
    echo -e "${YELLOW}Creating .env.production file for Docker...${NC}"
    
    # Check if env.production.template exists
    if [ -f "$CONCORDIA_MAIN/env.production.template" ]; then
        cp "$CONCORDIA_MAIN/env.production.template" "$ENV_PROD_FILE"
    else
        # Copy from .env.local if it exists, otherwise from env.template
        if [ -f "$ENV_FILE" ]; then
            cp "$ENV_FILE" "$ENV_PROD_FILE"
        else
            cp "$CONCORDIA_MAIN/env.template" "$ENV_PROD_FILE"
        fi
    fi
    
    echo -e "${GREEN}Created .env.production file.${NC}"
fi

# Create .env file in project root for Docker Compose
ROOT_ENV_FILE="$PROJECT_ROOT/.env"
if [ ! -f "$ROOT_ENV_FILE" ]; then
    echo -e "${YELLOW}Creating .env file in project root for Docker Compose...${NC}"
    
    # Extract variables from .env.production
    if [ -f "$ENV_PROD_FILE" ]; then
        grep -v '^#' "$ENV_PROD_FILE" | grep '=' > "$ROOT_ENV_FILE"
    else
        # Extract from .env.local if it exists, otherwise from env.template
        if [ -f "$ENV_FILE" ]; then
            grep -v '^#' "$ENV_FILE" | grep '=' > "$ROOT_ENV_FILE"
        else
            grep -v '^#' "$CONCORDIA_MAIN/env.template" | grep '=' > "$ROOT_ENV_FILE"
        fi
    fi
    
    echo -e "${GREEN}Created .env file in project root.${NC}"
fi

echo -e "${GREEN}=== Environment Setup Complete ===${NC}"
echo -e "${GREEN}You can now run the application with:${NC}"
echo -e "${YELLOW}npm run dev${NC} - For development"
echo -e "${YELLOW}docker-compose up -d${NC} - For Docker deployment"