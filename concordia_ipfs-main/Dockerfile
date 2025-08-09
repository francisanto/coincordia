# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package*.json ./
COPY concordia-main/package*.json ./concordia-main/

# Install dependencies with increased memory limit
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm install
RUN cd concordia-main && npm install

# Copy source files
COPY . .

# Setup environment variables
COPY concordia-main/scripts/setup-env.js ./concordia-main/scripts/
RUN node concordia-main/scripts/setup-env.js

# Build the application - simplified build process
RUN cd concordia-main && npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install production dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY concordia-main/package*.json ./concordia-main/

# Install production dependencies with increased memory limit
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm install --omit=dev
RUN cd concordia-main && npm install --omit=dev

# Copy built application
COPY --from=builder /app/concordia-main/.next ./concordia-main/.next
COPY --from=builder /app/concordia-main/public ./concordia-main/public
COPY --from=builder /app/concordia-main/next.config.mjs ./concordia-main/

# Copy necessary configuration files
COPY --from=builder /app/concordia-main/.env.production ./concordia-main/.env.production
COPY --from=builder /app/concordia-main/railway.json ./concordia-main/

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 5000

# Create a healthcheck endpoint
RUN mkdir -p ./concordia-main/app/api/health
RUN echo 'export function GET() { return new Response(JSON.stringify({ status: "ok" }), { status: 200 }) }' > ./concordia-main/app/api/health/route.ts

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["npm", "run", "start"]