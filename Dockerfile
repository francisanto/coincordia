# Use Node.js 20 Alpine image
FROM node:20-alpine
# 🔍 TEMP: make npm super chatty and show logs on failure
RUN set -eux; \
    node -v; npm -v; \
    npm ci --verbose --no-audit || (echo "----- NPM LOGS -----" && ls -l /root/.npm/_logs || true && (cat /root/.npm/_logs/* 2>/dev/null || true) && exit 1)


# Install build dependencies (for native modules like sharp/bcrypt/canvas)
RUN apk add --no-cache python3 make g++ libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (prefer lockfile if you fix it)
RUN npm ci --omit=dev || npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
