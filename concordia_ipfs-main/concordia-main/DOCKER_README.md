# Concordia Docker Setup

This document provides instructions for setting up and running the Concordia application using Docker.

## Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/) installed on your machine
- [Docker Compose](https://docs.docker.com/compose/install/) installed on your machine

## Project Structure

The project consists of three main components:

1. **Frontend**: Next.js application
2. **Backend**: Express.js API server
3. **Database**: MongoDB for data storage

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd concordia-main
```

### 2. Environment Variables

The Docker Compose file includes the necessary environment variables for development. For production, you may want to create a `.env` file with your specific configuration.

### 3. Build and Run with Docker Compose

```bash
docker-compose up --build
```

This command will:
- Build the frontend and backend Docker images
- Start all services defined in the docker-compose.yml file
- Set up the MongoDB database

### 4. Access the Application

- Frontend: http://localhost:5000
- Backend API: http://localhost:3002
- MongoDB: mongodb://localhost:27017

## Health Checks

All services include health checks to ensure they're running properly:

- Frontend: http://localhost:5000
- Backend: http://localhost:3002/health
- MongoDB: Internal health check via Docker

## Stopping the Application

To stop all running containers:

```bash
docker-compose down
```

To stop and remove all data (including the MongoDB volume):

```bash
docker-compose down -v
```

## Troubleshooting

### Viewing Logs

To view logs for all services:

```bash
docker-compose logs
```

To view logs for a specific service:

```bash
docker-compose logs frontend
docker-compose logs backend
docker-compose logs mongodb
```

### Container Health Status

Check the health status of your containers:

```bash
docker ps
```

Look for the `STATUS` column which should show `healthy` for each container.

## Production Deployment

For production deployment, consider:

1. Using Docker Swarm or Kubernetes for orchestration
2. Setting up proper SSL certificates
3. Implementing a reverse proxy like Nginx
4. Using Docker secrets for sensitive information