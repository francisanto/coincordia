# Use Node.js 18 Debian slim image
FROM node:18-bullseye-slim

# Set working directory to backend
WORKDIR /app/backend

# Copy package.json and package-lock.json from backend folder
COPY backend/package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the backend code
COPY backend/ .

# Build the app (if you have a build script)
RUN npm run build

# Expose Railway default port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
