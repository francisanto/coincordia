# Use Node.js 18 Debian slim image
FROM node:18-bullseye-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy rest of code
COPY . .

# Build the app
RUN npm run build

# Use Railway PORT
EXPOSE 3000  
ENV PORT $PORT

# Start the app
CMD ["npm", "start"]
