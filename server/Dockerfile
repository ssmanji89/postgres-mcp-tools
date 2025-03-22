FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Set environment variables
ENV NODE_ENV production
ENV PORT 3000

# Expose port
EXPOSE 3000

# Run the application
CMD ["node", "dist/index.js"]
