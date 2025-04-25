import {defineConfig} from "drizzle-kit";

// Configuration for dbInscriptions (Neon - PostgreSQL)
const inscriptionsConfig = defineConfig({
  dialect: "postgresql",
  schema: "./drizzle/schemaInscriptions.ts", // Path for the new schema
  out: "./drizzle/inscriptions", // Separate output directory for Inscriptions migrations
  dbCredentials: {
    url: process.env.NEON_DATABASE_URL!, // Assumes Neon connection string is in this env var
  },
});

export default inscriptionsConfig;
