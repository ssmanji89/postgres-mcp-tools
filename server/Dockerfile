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

# Fix pg module import issue
RUN sed -i 's/import { Pool } from '"'"'pg'"'"';/import pkg from '"'"'pg'"'"';\nconst { Pool } = pkg;/' dist/db/client.js

# Set environment variables
ENV NODE_ENV production
ENV PORT 3000

# Expose port
EXPOSE 3000

# Run the application
CMD ["node", "dist/index.js"]
