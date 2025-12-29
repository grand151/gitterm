#!/usr/bin/env bun
/**
 * Standalone migration script for Docker entrypoint
 * Uses postgres package (bun native) for minimal dependencies
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import fs from "fs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error("[migrate] DATABASE_URL is required");
    process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });
const db = drizzle(sql);

try {
    // Try multiple possible locations for migrations
    const possiblePaths = [
        "/app/migrations",
        "./migrations",
        "../../../packages/db/src/migrations",
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
        await sql.end();
        process.exit(0);
    }

    console.log(`[migrate] Running migrations from ${folder}...`);
    await migrate(db, { migrationsFolder: folder });
    console.log("[migrate] Migrations completed successfully");
    await sql.end();
    process.exit(0);
} catch (error) {
    console.error("[migrate] Migration failed:", error);
    await sql.end();
    process.exit(1);
}
