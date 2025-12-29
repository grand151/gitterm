# Build stage
FROM oven/bun:1.3 AS builder

WORKDIR /app

# Copy root package files for workspace resolution
COPY package.json bun.lock ./
COPY packages ./packages
COPY apps ./apps

# Install dependencies
RUN bun install --frozen-lockfile

# Build the Next.js app
WORKDIR /app/apps/web

# Set build-time environment variables
# These are inlined during build for NEXT_PUBLIC_* vars
# Runtime values should match these or be set via Railway
ENV NODE_ENV=production
ENV NEXT_PUBLIC_BASE_DOMAIN=placeholder.dev
ENV NEXT_PUBLIC_ROUTING_MODE=subdomain
ENV NEXT_PUBLIC_ENABLE_BILLING=false
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
