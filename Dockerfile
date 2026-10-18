# ==============================================================================
# Dockerfile Multi-Stage Production - Pantau MBG (SvelteKit + SQLite)
# ==============================================================================

# STAGE 1: Builder
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install build tools if native compilation is needed for better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install bun for fast dependency installation & build
RUN npm install -g bun@1.4.2

# Copy package descriptors
COPY package.json bun.lock* ./

# Install all dependencies (termasuk devDependencies untuk build SvelteKit)
RUN bun install --frozen-lockfile || bun install

# Copy source code and assets
COPY . .

# Generate SvelteKit types and compile production build
RUN bun run check || true
RUN bun run build

# Prune devDependencies to keep image lean
RUN rm -rf node_modules && bun install --production --frozen-lockfile || npm prune --omit=dev

# ==============================================================================
# STAGE 2: Production Runner
# ==============================================================================
FROM node:22-bookworm-slim AS runner

WORKDIR /app

# Install curl for Docker healthcheck and ca-certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    DB_PATH=/app/data/pantau_mbg.db \
    APP_NAME="Pantau MBG"

# Create non-root user and persistent data directory
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/bash -m appuser && \
    mkdir -p /app/data && \
    chown -R appuser:nodejs /app

# Copy production artifacts and dependencies
COPY --from=builder --chown=appuser:nodejs /app/build ./build
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/package.json ./package.json

# Copy seed database if present for quick start
COPY --from=builder --chown=appuser:nodejs /app/data ./data

# Switch to non-root user
USER appuser

# Expose HTTP port
EXPOSE 3000

# Health check to ensure service and SQLite DB are responsive
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start SvelteKit Node server
CMD ["node", "build/index.js"]
