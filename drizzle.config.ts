import {defineConfig} from "drizzle-kit";

export default defineConfig({
  dialect: "mysql", // Match the application driver
  schema: "./app/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    database: process.env.FIS_DB_NAME!,
    host: process.env.FIS_DB_HOST!,
    user: process.env.FIS_DB_USER!,
    password: process.env.FIS_DB_PASS!,
    ssl: {rejectUnauthorized: false},
  },
});
