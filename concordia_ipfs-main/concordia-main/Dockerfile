# Base image
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm config set registry https://registry.npmjs.org/ && npm install --no-fund --no-audit --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production image
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Copy built assets from the base stage
COPY --from=base /app/package.json /app/package-lock.json ./
COPY --from=base /app/next.config.mjs ./
COPY --from=base /app/public ./public
COPY --from=base /app/.next ./.next

# Install only production dependencies
RUN npm config set registry https://registry.npmjs.org/ && npm install --only=production --no-fund --no-audit --legacy-peer-deps

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]