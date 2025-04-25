import {defineConfig} from "drizzle-kit";
import "dotenv/config"; // Import dotenv to load environment variables

// Configuration for dbFis (MySQL)
const fisConfig = defineConfig({
  dialect: "mysql",
  schema: "./drizzle/schemaFis.ts", // Updated path
  out: "./drizzle/fis", // Separate output directory for FIS migrations
  dbCredentials: {
    database: process.env.FIS_DB_NAME!,
    host: process.env.FIS_DB_HOST!,
    user: process.env.FIS_DB_USER!,
    password: process.env.FIS_DB_PASS!,
    ssl: {rejectUnauthorized: false},
  },
});

export default fisConfig;
