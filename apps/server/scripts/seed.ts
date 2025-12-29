#!/usr/bin/env bun
/**
 * Standalone seed script for Railway pre-deploy
 * Uses postgres package (bun native) for minimal dependencies
 * 
 * Environment variables:
 *   DATABASE_URL - Required: PostgreSQL connection string
 *   ADMIN_EMAIL - Optional: Admin user email
 *   ADMIN_PASSWORD - Optional: Admin user password
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { pgTable, text, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import postgres from "postgres";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error("[seed] DATABASE_URL is required");
    process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });
const db = drizzle(sql);

// ============================================================================
// Table Definitions (inline to avoid workspace imports)
// ============================================================================

const cloudProvider = pgTable("cloud_provider", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    isEnabled: boolean("is_enabled").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

const agentType = pgTable("agent_type", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    serverOnly: boolean("server_only").default(false),
    isEnabled: boolean("is_enabled").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

const image = pgTable("image", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    imageId: text("image_id").notNull(),
    agentTypeId: uuid("agent_type_id").references(() => agentType.id),
    isEnabled: boolean("is_enabled").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

const region = pgTable("region", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    location: text("location"),
    externalRegionIdentifier: text("external_region_identifier").notNull().unique(),
    cloudProviderId: uuid("cloud_provider_id").references(() => cloudProvider.id),
    isEnabled: boolean("is_enabled").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// better-auth user table
const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    role: text("role").default("user"),
    plan: text("plan").default("free"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// better-auth account table (for password storage)
const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull().references(() => user.id),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// Password Hashing (compatible with better-auth's scrypt format)
// ============================================================================

async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
    return `${salt}:${derivedKey.toString("hex")}`;
}

function generateId(): string {
    return randomBytes(16).toString("hex");
}

// ============================================================================
// Seed Data
// ============================================================================

const seedCloudProviders = [
    { name: "Railway" },
    { name: "AWS" },
    { name: "Local" },
];

const seedAgentTypes = [
    { name: "OpenCode", serverOnly: false },
    { name: "OpenCode Server", serverOnly: true },
    { name: "OpenCode Web", serverOnly: false },
];

const seedImages = [
    { name: "gitterm-opencode", imageId: "opeoginni/gitterm-opencode", agentTypeName: "OpenCode" },
    { name: "gitterm-opencode-server", imageId: "opeoginni/gitterm-opencode-server", agentTypeName: "OpenCode Server" },
    { name: "gitterm-opencode-web", imageId: "opeoginni/gitterm-opencode-server", agentTypeName: "OpenCode Web" },
];

const seedRegions = [
    { name: "US West Metal", location: "California, USA", externalRegionIdentifier: "us-west2", providerName: "Railway" },
    { name: "US East Metal", location: "Virginia, USA", externalRegionIdentifier: "us-east4-eqdc4a", providerName: "Railway" },
    { name: "EU West Metal", location: "Amsterdam, Netherlands", externalRegionIdentifier: "europe-west4-drams3a", providerName: "Railway" },
    { name: "Southeast Asia Metal", location: "Singapore", externalRegionIdentifier: "asia-southeast1-eqsg3a", providerName: "Railway" },
    { name: "Local", location: "Local Machine", externalRegionIdentifier: "local", providerName: "Local" },
];

// ============================================================================
// Seed Functions
// ============================================================================

async function seedAdminUser(): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        console.log("[seed] No ADMIN_EMAIL/ADMIN_PASSWORD set, skipping admin user creation");
        return;
    }

    console.log("[seed] Seeding admin user...");

    // Check if user already exists
    const existing = await db.select().from(user).where(eq(user.email, adminEmail)).limit(1);

    if (existing.length > 0) {
        const existingUser = existing[0]!;
        // Ensure they have admin role
        if (existingUser.role !== "admin") {
            await db
                .update(user)
                .set({ role: "admin", updatedAt: new Date() })
                .where(eq(user.id, existingUser.id));
            console.log(`[seed]   Upgraded existing user "${adminEmail}" to admin role`);
        } else {
            console.log(`[seed]   Admin user "${adminEmail}" already exists`);
        }
        return;
    }

    // Create new admin user
    const userId = generateId();
    const accountId = generateId();
    const hashedPassword = await hashPassword(adminPassword);
    const now = new Date();

    await db.insert(user).values({
        id: userId,
        name: "Admin",
        email: adminEmail,
        emailVerified: true,
        role: "admin",
        plan: "pro",
        createdAt: now,
        updatedAt: now,
    });

    await db.insert(account).values({
        id: accountId,
        accountId: userId,
        providerId: "credential",
        userId: userId,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
    });

    console.log(`[seed]   Created admin user "${adminEmail}"`);
}

async function seedCloudProvidersAndRegions(): Promise<void> {
    const providerMap = new Map<string, string>();
    const agentTypeMap = new Map<string, string>();

    // Seed providers
    console.log("[seed] Seeding cloud providers...");
    for (const provider of seedCloudProviders) {
        const existing = await db.select().from(cloudProvider).where(eq(cloudProvider.name, provider.name)).limit(1);
        if (existing.length > 0) {
            console.log(`[seed]   Provider "${provider.name}" already exists`);
            providerMap.set(provider.name, existing[0]!.id);
        } else {
            const [created] = await db.insert(cloudProvider).values({ name: provider.name, isEnabled: true }).returning();
            console.log(`[seed]   Created provider "${provider.name}"`);
            providerMap.set(provider.name, created!.id);
        }
    }

    // Seed agent types
    console.log("[seed] Seeding agent types...");
    for (const agent of seedAgentTypes) {
        const existing = await db.select().from(agentType).where(eq(agentType.name, agent.name)).limit(1);
        if (existing.length > 0) {
            console.log(`[seed]   Agent type "${agent.name}" already exists`);
            agentTypeMap.set(agent.name, existing[0]!.id);
        } else {
            const [created] = await db.insert(agentType).values({ name: agent.name, serverOnly: agent.serverOnly, isEnabled: true }).returning();
            console.log(`[seed]   Created agent type "${agent.name}"`);
            agentTypeMap.set(agent.name, created!.id);
        }
    }

    // Seed images
    console.log("[seed] Seeding images...");
    for (const img of seedImages) {
        const existing = await db.select().from(image).where(eq(image.name, img.name)).limit(1);
        if (existing.length > 0) {
            console.log(`[seed]   Image "${img.name}" already exists`);
        } else {
            const agentTypeId = agentTypeMap.get(img.agentTypeName);
            if (!agentTypeId) {
                console.log(`[seed]   Skipping image "${img.name}" - agent type not found`);
                continue;
            }
            await db.insert(image).values({ name: img.name, imageId: img.imageId, agentTypeId, isEnabled: true });
            console.log(`[seed]   Created image "${img.name}"`);
        }
    }

    // Seed regions
    console.log("[seed] Seeding regions...");
    for (const reg of seedRegions) {
        const existing = await db.select().from(region).where(eq(region.externalRegionIdentifier, reg.externalRegionIdentifier)).limit(1);
        if (existing.length > 0) {
            console.log(`[seed]   Region "${reg.name}" already exists`);
        } else {
            const providerId = providerMap.get(reg.providerName);
            if (!providerId) {
                console.log(`[seed]   Skipping region "${reg.name}" - provider not found`);
                continue;
            }
            await db.insert(region).values({
                name: reg.name,
                location: reg.location,
                externalRegionIdentifier: reg.externalRegionIdentifier,
                cloudProviderId: providerId,
                isEnabled: true,
            });
            console.log(`[seed]   Created region "${reg.name}"`);
        }
    }
}

// ============================================================================
// Main
// ============================================================================

try {
    console.log("[seed] Starting database seed...");

    await seedCloudProvidersAndRegions();
    await seedAdminUser();

    console.log("[seed] Database seed completed");
    await sql.end();
    process.exit(0);
} catch (error) {
    console.error("[seed] Seed failed:", error);
    await sql.end();
    process.exit(1);
}
