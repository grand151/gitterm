import dotenv from "dotenv";

dotenv.config({
	path: "../../apps/server/.env",
});

import { drizzle } from "drizzle-orm/node-postgres";

export const db = drizzle(process.env.DATABASE_URL || "");

export {
	eq,
	and,
	or,
	asc,
	desc,
	sql,
	like,
	not
  } from "drizzle-orm";