import {drizzle} from "drizzle-orm/neon-http";
import {neon} from "@neondatabase/serverless";
import {config} from "dotenv";

config({path: ".env"});

// Check if we're in test mode
const isTestMode = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

// Test database instance - will be set by tests
let testDb: any = null;

// Function to set test database (called by test setup)
export function setTestDatabase(database: any) {
  testDb = database;
}

// Function to get the current database instance
export function getDatabase() {
  if (isTestMode && testDb) {
    return testDb;
  }
  
  const databaseUrl = process.env.NEON_DATABASE_URL;
  
  if (databaseUrl) {
    const sql = neon(databaseUrl);
    return drizzle({client: sql});
  } else {
    // Create a placeholder that will throw a descriptive error at runtime
    return new Proxy({} as any, {
      get() {
        throw new Error("NEON_DATABASE_URL environment variable is required");
      }
    });
  }
}

// Export the database instance
export const db = new Proxy({} as any, {
  get(target, prop) {
    const currentDb = getDatabase();
    return currentDb[prop];
  }
});
