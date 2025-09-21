#!/bin/bash

# Colors for terminal output
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
NC="\033[0m" # No Color

echo -e "${YELLOW}Starting Concordia Docker environment...${NC}"

# Build and start the containers
docker-compose up --build -d

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
sleep 10

# Check container health
FRONTEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' concordia-main_frontend_1 2>/dev/null || echo "container not found")
BACKEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' concordia-main_backend_1 2>/dev/null || echo "container not found")
MONGODB_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' concordia-main_mongodb_1 2>/dev/null || echo "container not found")

echo -e "${GREEN}Container Health Status:${NC}"
echo -e "Frontend: ${FRONTEND_HEALTH}"
echo -e "Backend: ${BACKEND_HEALTH}"
echo -e "MongoDB: ${MONGODB_HEALTH}"

echo -e "\n${GREEN}Concordia is now running!${NC}"
echo -e "Frontend: http://localhost:5000"
echo -e "Backend API: http://localhost:3002"
echo -e "\nTo view logs: docker-compose logs -f"
echo -e "To stop: docker-compose down"