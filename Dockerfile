# Use Node.js 18 Debian slim image
FROM node:18-bullseye-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (skip strict npm ci)
RUN npm install --legacy-peer-deps

# Copy rest of the app
COPY . .

# Build the frontend
RUN npm run build

# Railway exposes PORT automatically
EXPOSE 3000

CMD ["npm", "start"]
