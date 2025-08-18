# Docker Deployment Guide for Concordia IPFS

This guide provides instructions for deploying the Concordia IPFS application using Docker.

## Prerequisites

- Docker installed on your system
- Git to clone the repository

### Checking Docker Setup

You can verify your Docker setup using our check scripts:

#### For Linux/macOS:
```bash
./scripts/docker-check.sh
```

#### For Windows:
```bash
.\scripts\docker-check.bat
```

These scripts will verify that:
- Docker is installed and running
- Docker Compose is available
- You have sufficient permissions
- Your system has enough resources

## Environment Variables

The application requires several environment variables to function properly. These can be set in the following ways:

1. Using a `.env.production` file in the `concordia-main` directory
2. Setting environment variables in your Docker run command
3. Using Docker Compose environment variables

### Required Environment Variables

#### Frontend Variables

```
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address_here
NEXT_PUBLIC_NETWORK=opBNB Testnet
NEXT_PUBLIC_RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

#### Backend Variables

```
PORT=5000
NODE_ENV=production
CONTRACT_ADDRESS=your_contract_address_here
RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
```

#### Optional Variables

```
ARWEAVE_KEY=your_arweave_key_here
```

## Building and Running with Docker

### Option 1: Using Docker Compose (Recommended)

The easiest way to deploy the application is using Docker Compose:

```bash
# Clone the repository (if you haven't already)
git clone https://github.com/yourusername/concordia_ipfs.git
cd concordia_ipfs

# Start the application
docker-compose up -d
```

This will build the Docker image and start the container with all the necessary environment variables and port mappings.

### Option 2: Manual Docker Commands

#### Build the Docker Image

```bash
docker build -t concordia-ipfs .
```

#### Run the Docker Container

```bash
docker run -p 5000:5000 \
  -e NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address_here \
  -e ARWEAVE_KEY=your_arweave_key_here \
  concordia-ipfs
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all required environment variables are set
   - Ensure Docker has enough memory allocated (at least 4GB)
   - Check for network issues when installing dependencies

2. **Runtime Errors**
   - Check the container logs: `docker logs <container_id>`
   - Verify environment variables are correctly set
   - Ensure ports are properly mapped

3. **IPFS/Arweave Connection Issues**
   - The application will fall back to simulation mode if Arweave key is not provided
   - Check network connectivity to IPFS and Arweave services

## Health Check

The application includes a health check endpoint at `/api/health` that returns a 200 OK response when the service is running properly.

### Using the Health Check Script

A health check script is provided to verify the application is running correctly:

```bash
# Check the default endpoint (http://localhost:5000/api/health)
node scripts/check-health.js

# Check a custom endpoint
node scripts/check-health.js http://your-domain.com/api/health
```

The script will output the application status, environment, version, and timestamp if the service is healthy.

## Memory Considerations

The Next.js build process can be memory-intensive. If you encounter memory issues during build:

1. Increase Docker's memory allocation
2. Use the `NODE_OPTIONS="--max-old-space-size=4096"` environment variable

## Security Notes

1. Never commit sensitive environment variables to version control
2. Use Docker secrets or environment variables for sensitive information
3. Regularly rotate API keys and credentials