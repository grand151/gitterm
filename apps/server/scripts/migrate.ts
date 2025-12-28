#!/usr/bin/env bun
/**
 * Standalone migration script for Docker entrypoint
 * Run with: bun run migrate.mjs
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import fs from "fs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error("[migrate] DATABASE_URL is required");
    process.exit(1);
}

const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
});

try {
    const db = drizzle(pool);

    // Try multiple possible locations for migrations
    const possiblePaths = [
        "/app/migrations",
        "./migrations",
    ];

    let folder: string | undefined;
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            folder = p;
            break;
        }
    }

    if (!folder) {
        console.log("[migrate] No migrations folder found, skipping");
        process.exit(0);
    }

    console.log(`[migrate] Running migrations from ${folder}...`);
    await migrate(db, { migrationsFolder: folder });
    console.log("[migrate] Migrations completed successfully");
    process.exit(0);
} catch (error) {
    console.error("[migrate] Migration failed:", error);
    process.exit(1);
} finally {
    await pool.end();
}
