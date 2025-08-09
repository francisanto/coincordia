#!/bin/bash

# Concordia IPFS Docker Check Script
# This script checks if Docker and Docker Compose are installed and working correctly

set -e

# Colors for output
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${GREEN}=== Concordia IPFS Docker Check ===${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed.${NC}"
    echo "Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
fi

# Check Docker version
DOCKER_VERSION=$(docker --version)
echo -e "${GREEN}✓ Docker is installed: ${DOCKER_VERSION}${NC}"

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Error: Docker daemon is not running.${NC}"
    echo "Please start Docker and try again."
    exit 1
fi

echo -e "${GREEN}✓ Docker daemon is running${NC}"

# Check if Docker Compose is installed
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    echo -e "${GREEN}✓ Docker Compose is installed: ${COMPOSE_VERSION}${NC}"
else
    echo -e "${YELLOW}Warning: Docker Compose is not installed as a standalone binary.${NC}"
    
    # Check if Docker Compose plugin is available
    if docker compose version &> /dev/null; then
        COMPOSE_PLUGIN_VERSION=$(docker compose version)
        echo -e "${GREEN}✓ Docker Compose plugin is available: ${COMPOSE_PLUGIN_VERSION}${NC}"
    else
        echo -e "${YELLOW}Warning: Docker Compose plugin is not available.${NC}"
        echo "You can still use Docker, but Docker Compose functionality will not be available."
    fi
fi

# Check if user can run Docker without sudo
if docker run --rm hello-world &> /dev/null; then
    echo -e "${GREEN}✓ User has permission to run Docker commands${NC}"
else
    echo -e "${YELLOW}Warning: You may need to use sudo to run Docker commands or add your user to the docker group.${NC}"
    echo "Run: sudo usermod -aG docker $USER"
    echo "Then log out and log back in to apply the changes."
fi

# Check available disk space
DISK_SPACE=$(df -h . | awk 'NR==2 {print $4}')
echo -e "${GREEN}✓ Available disk space: ${DISK_SPACE}${NC}"

# Check available memory
if command -v free &> /dev/null; then
    AVAILABLE_MEM=$(free -h | awk '/^Mem:/ {print $7}')
    echo -e "${GREEN}✓ Available memory: ${AVAILABLE_MEM}${NC}"
fi

echo -e "${GREEN}=== Docker Check Complete ===${NC}"
echo -e "${GREEN}Your system is ready to run Concordia IPFS in Docker.${NC}"