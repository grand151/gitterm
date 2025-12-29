# Build stage
FROM oven/bun:1.3 AS builder

WORKDIR /app

# Copy root package files for workspace resolution
COPY package.json bun.lock ./
COPY packages ./packages
COPY apps ./apps

# Install dependencies
RUN bun install --frozen-lockfile

# Build the server app
WORKDIR /app/apps/server
RUN bun run build

# Production stage
FROM oven/bun:1.3-slim AS runner

WORKDIR /app

# Copy root package files and install dependencies
COPY --from=builder /app/package.json /app/bun.lock ./
COPY --from=builder /app/node_modules ./node_modules

# Copy packages (needed for db scripts, auth, etc.)
COPY --from=builder /app/packages ./packages

# Copy built server output
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json

# Copy entrypoint script
COPY --from=builder /app/apps/server/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Expose port (configurable via PORT env)
EXPOSE 3000

# ============================================================================
# Railway Pre-deploy commands:
#
#   cd /app/packages/db && bun run db:migrate
#   cd /app/packages/db && bun run db:seed
#   cd /app/packages/db && bun run db:seed-admin
#
# ============================================================================

# Use entrypoint to start the server
ENTRYPOINT ["./docker-entrypoint.sh"]
