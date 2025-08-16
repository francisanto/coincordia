# ---------- Stage 1: Build Frontend ----------
    FROM node:18-bullseye-slim AS frontend-builder

    WORKDIR /app
    
    # Copy frontend package files
    COPY package*.json ./
    
    # Install frontend dependencies
    RUN npm install --omit=dev
    
    # Copy the rest of the frontend code
    COPY . .
    
    # Build frontend
    RUN npm run build
    
    # ---------- Stage 2: Setup Backend ----------
    FROM node:18-bullseye-slim AS backend
    
    WORKDIR /app/backend
    
    # Copy backend package files
    COPY backend/package*.json ./
    
    # Install backend dependencies
    RUN npm install --omit=dev
    
    # Copy backend code
    COPY backend/ .
    
    # Optionally copy frontend build into backend (if backend serves static frontend)
    COPY --from=frontend-builder /app/build ./public
    
    # Expose Railway port
    EXPOSE 3000
    
    # Start backend
    CMD ["node", "server-mongodb.js"]
    