FROM node:14-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache python3 make g++ git curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --no-package-lock

# Copy source files
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3002
ENV NEXT_TELEMETRY_DISABLED=1

# Expose the port the app runs on
EXPOSE 3002

# Start the application in development mode
CMD ["npm", "run", "dev"]