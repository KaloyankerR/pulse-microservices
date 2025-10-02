# Multi-stage Dockerfile for Pulse User Service

# Stage 1: Base image with common dependencies
FROM node:24-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    curl \
    dumb-init \
    postgresql-client \
    openssl \
    ca-certificates

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Stage 2: Dependencies - Install all dependencies
FROM base AS dependencies

# Install all dependencies (including dev dependencies)
RUN npm ci --only=production --silent && \
    npm cache clean --force

# Stage 3: Build - Development dependencies and build steps
FROM base AS build

# Install all dependencies (including dev dependencies)
RUN npm ci --silent && \
    npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Stage 4: Production - Final production image
FROM base AS production

# Copy production dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy built application from build stage
COPY --from=build /app/src ./src
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/package*.json ./

# Create logs directory and set permissions
RUN mkdir -p logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]

# Stage 5: Development - For development with hot reload
FROM build AS development

# Install nodemon globally
RUN npm install -g nodemon

# Create logs directory and set permissions
RUN mkdir -p logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start application in development mode
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"]
