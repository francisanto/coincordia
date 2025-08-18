FROM node:18-alpine3.17

WORKDIR /app

# Install dependencies
RUN apk add --no-cache python3 make g++ git curl

# Copy package files
COPY package*.json ./

# Modify package.json to fix recursive script calls
RUN sed -i 's/cd concordia-main && npm run dev/next dev/g' package.json && \
    sed -i 's/cd concordia-main && npm run build/next build/g' package.json && \
    sed -i 's/cd concordia-main && npm run start/next start/g' package.json && \
    sed -i 's/cd concordia-main && npm run lint/next lint/g' package.json && \
    sed -i 's/npm run install:all && cd concordia-main && npm run dev/next dev/g' package.json && \
    sed -i 's/npm install && cd concordia-main && npm install/npm install/g' package.json

# Install dependencies with clean npm cache
RUN npm cache clean --force && npm install

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3002
ENV NEXT_TELEMETRY_DISABLED=1

# Expose the port the app runs on
EXPOSE 3002

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3002/api/health || exit 1

# Start the application in production mode
CMD ["npm", "run", "start"]