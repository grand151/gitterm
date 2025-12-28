#!/bin/sh
set -e

# Run database migrations and seed for self-hosted deployments
# Skip if DEPLOYMENT_MODE is not "self-hosted" or if explicitly disabled
if [ "$DEPLOYMENT_MODE" = "self-hosted" ]; then
    echo "[entrypoint] Self-hosted mode detected"
    
    # Run migrations unless disabled
    if [ "$RUN_MIGRATIONS" != "false" ]; then
        echo "[entrypoint] Running database migrations..."
        bun run /app/migrate.mjs || echo "[entrypoint] Migration failed or already up to date"
    fi
    
    # Run seed unless disabled
    if [ "$RUN_SEED" != "false" ]; then
        echo "[entrypoint] Running database seed..."
        bun run /app/seed.mjs || echo "[entrypoint] Seed failed or already seeded"
    fi
else
    echo "[entrypoint] Managed mode - skipping database bootstrap"
fi

# Start the server
echo "[entrypoint] Starting server..."
exec bun run dist/index.mjs
