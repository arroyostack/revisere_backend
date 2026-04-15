# Multi-stage Dockerfile for ContractLens Backend API
# Stage 1: Build the TypeScript application
# =============================================================================
# Purpose: Compile TypeScript source code into optimized JavaScript for production.
#         This stage is ephemeral and won't be part of the final runtime image.
# =============================================================================
FROM docker.io/node:20-alpine AS typescript_builder

# Set metadata for the build stage
LABEL stage="typescript_builder"
LABEL description="Compiles TypeScript to JavaScript for production deployment"

# Define non-root user for security ( Alpine uses numeric UID )
# Note: Using 1001 to avoid conflicts with existing system users/groups in the base image
RUN addgroup -g 1001 -S appgroup 2>/dev/null || true && \
    adduser -u 1001 -S appuser -G appgroup 2>/dev/null || true

# Set working directory for build operations
WORKDIR /application_build

# Copy dependency manifest files first ( dependency cache optimization )
# =============================================================================
# Security: Copy package files first to leverage Docker layer caching.
#          If only package files change, dependencies will be cached.
# =============================================================================
COPY package.json package-lock.json* ./

# Install all dependencies ( including devDependencies for TypeScript compilation )
# =============================================================================
# Note: The builder stage needs TypeScript ( devDependencies ) to compile the source.
#       The production stage will only have production dependencies.
# =============================================================================
RUN npm ci

# Copy source code and configuration
COPY tsconfig.json nest-cli.json ./
COPY src/ ./src/

# Compile TypeScript to JavaScript
# =============================================================================
# Note: The 'build' script runs 'tsc --incremental false' per package.json
#       --incremental false ensures clean build without cached .tsbuildinfo
# =============================================================================
RUN npm run build

# =============================================================================
# Stage 2: Production Runtime
# =============================================================================
# Purpose: Minimal runtime image with only the compiled application.
# =============================================================================
FROM docker.io/node:20-alpine AS production_runtime

# Set metadata for the runtime stage
LABEL stage="production_runtime"
LABEL description="Runs the compiled ContractLens Backend API"

# Create non-root user for security ( must match GID/UID from builder stage )
# Note: Using 1001 to match builder stage and avoid conflicts
RUN addgroup -g 1001 -S appgroup 2>/dev/null || true && \
    adduser -u 1001 -S appuser -G appgroup 2>/dev/null || true

# Set working directory for the application
WORKDIR /application

# Set ownership of the working directory
# =============================================================================
# Security: Running as non-root user reduces impact of potential container escape.
# =============================================================================
RUN chown -R appuser:appgroup /application

# Switch to non-root user
USER appuser

# Copy compiled artifacts from the builder stage
# =============================================================================
# Note: Only the dist folder (compiled JavaScript) is copied to the runtime image.
#       This follows the principle of least privilege - no source code in production.
# =============================================================================
COPY --from=typescript_builder --chown=appuser:appgroup /application_build/dist ./dist

# Copy package files needed for production runtime dependencies
COPY --from=typescript_builder --chown=appuser:appgroup /application_build/package.json \
    /application_build/package-lock.json* ./

# Install production-only Node.js dependencies
RUN npm ci --omit=dev

# Expose the HTTP port
# =============================================================================
# Note: PORT defaults to 3000 per .env.example
#       This port must match the targetPort in Koyeb configuration
# =============================================================================
EXPOSE 3000

# Define health check for container orchestration ( Kubernetes, Koyeb, etc. )
# =============================================================================
# Purpose: Allows orchestrators to verify the container is healthy.
# Interval: Check every 30 seconds
# Timeout:  Consider unhealthy if response takes more than 5 seconds
# Retries:  Container will be restarted after 3 consecutive failures
# =============================================================================
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3000/health || exit 1

# Set default environment variables with sensible defaults
# ==============================================================================
# PORT: HTTP port the application listens on
# NODE_ENV: Production environment for optimal runtime behavior
# ==============================================================================
ENV PORT=3000
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Run the compiled NestJS application
# =============================================================================
# Note: Uses 'start:prod' script which runs 'node dist/main.js'
#       This starts the NestJS factory compiled from TypeScript
# =============================================================================
CMD ["npm", "run", "start:prod"]