import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const instanceStatusEnum = pgEnum('instance_status', ['pending', 'running', 'stopped', 'terminated'] as const);
export const workspaceStatusEnum = pgEnum('workspace_status', ['pending', 'running', 'stopped', 'terminated'] as const);

export const cloudAccount = pgTable("cloud_account", {
	id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    roleArn: text("role_arn").notNull(),
    providerId: uuid("provider_id").notNull().references(() => cloudProvider.id, { onDelete: "cascade" }),
    region: text("region").notNull(),
    externalId: text("external_id").notNull(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const cloudProvider = pgTable("cloud_provider", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


export const image = pgTable("image", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	imageId: text("image_id").notNull(),
    agentTypeId: uuid("agent_type_id").notNull().references(() => agentType.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const agentType = pgTable("agent_type", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});


export type NewCloudProvider = typeof cloudProvider.$inferInsert;
export type NewImage = typeof image.$inferInsert;
export type NewAgentType = typeof agentType.$inferInsert;
export type NewCloudAccount = typeof cloudAccount.$inferInsert;

export type CloudProvider = typeof cloudProvider.$inferSelect;
export type Image = typeof image.$inferSelect;
export type AgentType = typeof agentType.$inferSelect;
export type CloudAccount = typeof cloudAccount.$inferSelect;
