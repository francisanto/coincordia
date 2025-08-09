@echo off
setlocal enabledelayedexpansion

echo === Concordia IPFS Docker Setup ===

:: Check if Docker is installed
docker --version > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: Docker is not installed. Please install Docker first.
    echo Visit https://docs.docker.com/get-docker/ for installation instructions.
    exit /b 1
)

:: Check if Docker Compose is installed
docker-compose --version > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Warning: Docker Compose is not installed. Using Docker only.
    set USE_COMPOSE=false
) else (
    set USE_COMPOSE=true
)

:: Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file with default values...
    (
        echo # Frontend variables
        echo NEXT_PUBLIC_CONTRACT_ADDRESS=0x31ff87832e0bc5eaee333d1db549829ba0376d45aa23a41e6b12bfe17c969595
        echo NEXT_PUBLIC_NETWORK=opBNB Testnet
        echo NEXT_PUBLIC_RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
        echo NEXT_PUBLIC_API_URL=http://localhost:5000/api
        echo.
        echo # Backend variables
        echo PORT=5000
        echo NODE_ENV=production
        echo CONTRACT_ADDRESS=0x31ff87832e0bc5eaee333d1db549829ba0376d45aa23a41e6b12bfe17c969595
        echo RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
        echo.
        echo # Optional variables
        echo ARWEAVE_KEY={}
    ) > .env
    echo Created .env file. Please edit it with your own values if needed.
)

:: Ask if user wants to customize environment variables
set /p customize=Do you want to customize environment variables? (y/n) [n]: 
if not defined customize set customize=n

if /i "%customize%"=="y" (
    echo Opening .env file for editing...
    notepad .env
)

:: Run the application
echo Starting Concordia IPFS application...

if "%USE_COMPOSE%"=="true" (
    echo Using Docker Compose...
    docker-compose up -d
    
    if %ERRORLEVEL% equ 0 (
        echo Application started successfully!
        echo You can access it at: http://localhost:5000
    ) else (
        echo Failed to start the application.
        echo Check the logs with: docker-compose logs
    )
) else (
    echo Using Docker...
    
    echo Building Docker image...
    docker build -t concordia-ipfs .
    
    echo Running Docker container...
    docker run -d --name concordia-ipfs --env-file .env -p 5000:5000 concordia-ipfs
    
    if %ERRORLEVEL% equ 0 (
        echo Application started successfully!
        echo You can access it at: http://localhost:5000
        echo Check the logs with: docker logs concordia-ipfs
    ) else (
        echo Failed to start the application.
    )
)

echo === Setup Complete ===
pause