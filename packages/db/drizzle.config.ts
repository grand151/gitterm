import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

// Load from server .env in development, but in production DATABASE_URL should be set directly
dotenv.config({
	path: "../../apps/server/.env",
});

export default defineConfig({
	schema: "./src/schema",
	out: "./src/migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL || "",
	},
});
