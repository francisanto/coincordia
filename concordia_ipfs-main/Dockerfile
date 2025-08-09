# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
COPY concordia-main/package*.json ./concordia-main/
RUN npm run install:all

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/concordia-main/.next ./concordia-main/.next
COPY --from=builder /app/concordia-main/public ./concordia-main/public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/concordia-main/package*.json ./concordia-main/

# Install production dependencies
RUN npm run install:all --production

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start the application
CMD ["npm", "start"]