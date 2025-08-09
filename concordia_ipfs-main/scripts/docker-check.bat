@echo off
setlocal enabledelayedexpansion

echo === Concordia IPFS Docker Check ===

:: Check if Docker is installed
docker --version > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: Docker is not installed.
    echo Please install Docker from https://docs.docker.com/get-docker/
    exit /b 1
)

:: Check Docker version
for /f "tokens=*" %%i in ('docker --version') do set DOCKER_VERSION=%%i
echo [✓] Docker is installed: %DOCKER_VERSION%

:: Check if Docker daemon is running
docker info > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: Docker daemon is not running.
    echo Please start Docker Desktop and try again.
    exit /b 1
)

echo [✓] Docker daemon is running

:: Check if Docker Compose is installed
docker-compose --version > nul 2>&1
if %ERRORLEVEL% equ 0 (
    for /f "tokens=*" %%i in ('docker-compose --version') do set COMPOSE_VERSION=%%i
    echo [✓] Docker Compose is installed: %COMPOSE_VERSION%
) else (
    echo Warning: Docker Compose is not installed as a standalone binary.
    
    :: Check if Docker Compose plugin is available
    docker compose version > nul 2>&1
    if %ERRORLEVEL% equ 0 (
        for /f "tokens=*" %%i in ('docker compose version') do set COMPOSE_PLUGIN_VERSION=%%i
        echo [✓] Docker Compose plugin is available: %COMPOSE_PLUGIN_VERSION%
    ) else (
        echo Warning: Docker Compose plugin is not available.
        echo You can still use Docker, but Docker Compose functionality will not be available.
    )
)

:: Check if user can run Docker without admin privileges
docker run --rm hello-world > nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [✓] User has permission to run Docker commands
) else (
    echo Warning: You may need to run as Administrator to use Docker commands.
)

:: Check available disk space
for /f "tokens=3" %%i in ('wmic logicaldisk where "DeviceID='%~d0'" get FreeSpace^,Size /format:value ^| find "FreeSpace"') do set FREE_BYTES=%%i
set /a FREE_GB=%FREE_BYTES:~0,-9%
echo [✓] Available disk space: %FREE_GB% GB

echo === Docker Check Complete ===
echo Your system is ready to run Concordia IPFS in Docker.

pause