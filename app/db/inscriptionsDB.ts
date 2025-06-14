import {drizzle} from "drizzle-orm/neon-http";
import {neon} from "@neondatabase/serverless";
import {config} from "dotenv";

config({path: ".env"});

const databaseUrl = process.env.NEON_DATABASE_URL;

// During build time, we might not have database access
// Create a placeholder that will fail at runtime if used without proper env
let db: ReturnType<typeof drizzle>;

if (databaseUrl) {
  const sql = neon(databaseUrl);
  db = drizzle({client: sql});
} else {
  // Create a placeholder that will throw a descriptive error at runtime
  db = new Proxy({} as any, {
    get() {
      throw new Error("NEON_DATABASE_URL environment variable is required");
    }
  });
}

export { db };
