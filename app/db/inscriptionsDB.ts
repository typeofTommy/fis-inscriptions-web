import {drizzle} from "drizzle-orm/neon-http";
import {neon} from "@neondatabase/serverless";
import {config} from "dotenv";

config({path: ".env"});

const databaseUrl = process.env.NEON_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("NEON_DATABASE_URL environment variable is required");
}

const sql = neon(databaseUrl);
export const db = drizzle({client: sql});
