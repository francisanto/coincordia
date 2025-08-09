# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY concordia-main/package*.json ./concordia-main/

# Install dependencies
RUN npm ci
RUN cd concordia-main && npm ci

# Copy source files
COPY . .

# Build the application
RUN --mount=type=cache,id=s/1f65545c-bdb0-4e29-8482-ac6bfeceb13a-next/cache,target=/app/.next/cache \
    --mount=type=cache,id=s/1f65545c-bdb0-4e29-8482-ac6bfeceb13a-concordia-main/next/cache,target=/app/concordia-main/.next/cache \
    --mount=type=cache,id=s/1f65545c-bdb0-4e29-8482-ac6bfeceb13a-node_modules/cache,target=/app/node_modules/.cache \
    cd concordia-main && npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/concordia-main/.next ./concordia-main/.next
COPY --from=builder /app/concordia-main/public ./concordia-main/public
COPY --from=builder /app/concordia-main/package*.json ./concordia-main/
COPY --from=builder /app/package*.json ./

# Install production dependencies
RUN npm ci --production
RUN cd concordia-main && npm ci --production

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start the application
CMD cd concordia-main && npm start