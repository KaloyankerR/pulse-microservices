# Use Node.js 20 Alpine as base image
FROM node:20-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Install OpenSSL for Prisma (required for Alpine)
RUN apk add --no-cache openssl openssl-dev libc6-compat

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Development stage
FROM base AS development

# Install all dependencies (including dev dependencies)
RUN npm install && npm cache clean --force

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy application code
COPY . .

# Change ownership of app directory to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8081/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production

# Install all dependencies (needed for TypeScript compilation and Prisma)
RUN npm ci && npm cache clean --force

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy application code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production && npm cache clean --force

# Change ownership of app directory to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8081/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application (using compiled JavaScript)
CMD ["node", "dist/server.js"]

