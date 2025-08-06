#!/bin/bash

# Railway Deployment Script for Concordia DApp
# This script helps automate the deployment process to Railway

set -e

echo "🚀 Starting Railway deployment for Concordia DApp..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Railway CLI is installed
check_railway_cli() {
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI is not installed. Please install it first:"
        echo "npm install -g @railway/cli"
        exit 1
    fi
    print_success "Railway CLI is installed"
}

# Check if user is logged in to Railway
check_railway_login() {
    if ! railway whoami &> /dev/null; then
        print_warning "You are not logged in to Railway. Please login:"
        railway login
    fi
    print_success "Logged in to Railway"
}

# Check if project exists, create if not
setup_project() {
    print_status "Setting up Railway project..."
    
    if [ -z "$RAILWAY_PROJECT_ID" ]; then
        print_warning "RAILWAY_PROJECT_ID not set. Creating new project..."
        railway init
        print_success "Project initialized"
    else
        print_status "Using existing project: $RAILWAY_PROJECT_ID"
        railway link $RAILWAY_PROJECT_ID
    fi
}

# Deploy the application
deploy_app() {
    print_status "Deploying to Railway..."
    
    # Deploy both services
    railway up
    
    print_success "Deployment completed!"
}

# Get deployment URLs
get_urls() {
    print_status "Getting deployment URLs..."
    
    FRONTEND_URL=$(railway domain --service frontend)
    BACKEND_URL=$(railway domain --service backend)
    
    print_success "Frontend URL: $FRONTEND_URL"
    print_success "Backend URL: $BACKEND_URL"
    
    echo ""
    print_status "Update your environment variables with these URLs:"
    echo "NEXT_PUBLIC_API_URL=$BACKEND_URL"
    echo "FRONTEND_URL=$FRONTEND_URL"
}

# Check deployment health
check_health() {
    print_status "Checking deployment health..."
    
    sleep 10  # Wait for deployment to stabilize
    
    if [ ! -z "$BACKEND_URL" ]; then
        if curl -f "$BACKEND_URL/api/health" &> /dev/null; then
            print_success "Backend health check passed"
        else
            print_error "Backend health check failed"
        fi
    fi
    
    if [ ! -z "$FRONTEND_URL" ]; then
        if curl -f "$FRONTEND_URL" &> /dev/null; then
            print_success "Frontend health check passed"
        else
            print_error "Frontend health check failed"
        fi
    fi
}

# Main deployment process
main() {
    print_status "Starting Railway deployment process..."
    
    # Pre-deployment checks
    check_railway_cli
    check_railway_login
    setup_project
    
    # Deploy
    deploy_app
    
    # Post-deployment
    get_urls
    check_health
    
    print_success "Railway deployment completed successfully!"
    echo ""
    print_status "Next steps:"
    echo "1. Update environment variables in Railway dashboard"
    echo "2. Configure custom domains if needed"
    echo "3. Set up monitoring and alerts"
    echo "4. Test your application thoroughly"
}

# Run main function
main "$@" 