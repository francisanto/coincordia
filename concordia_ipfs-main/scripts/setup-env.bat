@echo off
setlocal enabledelayedexpansion

echo === Concordia IPFS Environment Setup ===

:: Determine the project root directory
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."
set "CONCORDIA_MAIN=%PROJECT_ROOT%\concordia-main"

echo Project root: %PROJECT_ROOT%
echo Concordia main directory: %CONCORDIA_MAIN%

:: Check if env.template exists
if not exist "%CONCORDIA_MAIN%\env.template" (
    echo Error: env.template not found in %CONCORDIA_MAIN%
    exit /b 1
)

:: Create .env.local file if it doesn't exist
set "ENV_FILE=%CONCORDIA_MAIN%\.env.local"
if not exist "%ENV_FILE%" (
    echo Creating .env.local file from template...
    copy "%CONCORDIA_MAIN%\env.template" "%ENV_FILE%" > nul
    echo Created .env.local file. Please edit it with your own values.
)

:: Ask if user wants to customize environment variables
set /p customize=Do you want to customize environment variables? (y/n) [n]: 
if not defined customize set customize=n

if /i "%customize%"=="y" (
    echo Opening .env.local file for editing...
    notepad "%ENV_FILE%"
)

:: Create .env.production file for Docker
set "ENV_PROD_FILE=%CONCORDIA_MAIN%\.env.production"
if not exist "%ENV_PROD_FILE%" (
    echo Creating .env.production file for Docker...
    
    :: Check if env.production.template exists
    if exist "%CONCORDIA_MAIN%\env.production.template" (
        copy "%CONCORDIA_MAIN%\env.production.template" "%ENV_PROD_FILE%" > nul
    ) else (
        :: Copy from .env.local if it exists, otherwise from env.template
        if exist "%ENV_FILE%" (
            copy "%ENV_FILE%" "%ENV_PROD_FILE%" > nul
        ) else (
            copy "%CONCORDIA_MAIN%\env.template" "%ENV_PROD_FILE%" > nul
        )
    )
    
    echo Created .env.production file.
)

:: Create .env file in project root for Docker Compose
set "ROOT_ENV_FILE=%PROJECT_ROOT%\.env"
if not exist "%ROOT_ENV_FILE%" (
    echo Creating .env file in project root for Docker Compose...
    
    :: Extract variables from .env.production
    if exist "%ENV_PROD_FILE%" (
        type "%ENV_PROD_FILE%" | findstr /v "^#" | findstr "=" > "%ROOT_ENV_FILE%"
    ) else (
        :: Extract from .env.local if it exists, otherwise from env.template
        if exist "%ENV_FILE%" (
            type "%ENV_FILE%" | findstr /v "^#" | findstr "=" > "%ROOT_ENV_FILE%"
        ) else (
            type "%CONCORDIA_MAIN%\env.template" | findstr /v "^#" | findstr "=" > "%ROOT_ENV_FILE%"
        )
    )
    
    echo Created .env file in project root.
)

echo === Environment Setup Complete ===
echo You can now run the application with:
echo npm run dev - For development
echo docker-compose up -d - For Docker deployment

pause