# ---------- Stage 1: Build Frontend ----------
    FROM node:18-bullseye-slim AS frontend-builder

    WORKDIR /app
    
    # Install build tools for native deps
    RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
    
    # Copy frontend package files
    COPY package*.json ./
    
    # Install dependencies (safer than npm ci)
    RUN npm install --legacy-peer-deps --omit=dev
    
    # Copy rest of frontend
    COPY . .
    
    # Build frontend
    RUN npm run build
    
    
    # ---------- Stage 2: Setup Backend ----------
    FROM node:18-bullseye-slim AS backend
    
    WORKDIR /app/backend
    
    # Install build tools
    RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
    
    # Copy backend package files
    COPY backend/package*.json ./
    
    # Install backend deps
    RUN npm install --legacy-peer-deps

    
    # Copy backend code
    COPY backend/ .
    
    # Copy frontend build into backend (if backend serves frontend)
    COPY --from=frontend-builder /app/build ./public
    
    # Expose port
    EXPOSE 3000
    
    # Healthcheck
    HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
      CMD curl -f http://localhost:${PORT:-3000}/api/health || exit 1
    
    # Start backend
    CMD ["node", "server-mongodb.js"]
    