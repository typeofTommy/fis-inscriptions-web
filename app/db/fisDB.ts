import "dotenv/config";
import {drizzle} from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const poolConnection = mysql.createPool({
  host: process.env.FIS_DB_HOST,
  user: process.env.FIS_DB_USER,
  password: process.env.FIS_DB_PASS,
  ssl: {rejectUnauthorized: false},
  database: process.env.FIS_DB_NAME,
  // Connection pool settings
  connectionLimit: 5, // Reduce from default 10 to 5
  queueLimit: 0, // Unlimited queue
  waitForConnections: true, // Wait for available connection
  enableKeepAlive: true, // Enable keep-alive
  keepAliveInitialDelay: 0, // Immediate keep-alive
  idleTimeout: 20000, // Close idle connections after 60 seconds
  pool: {
    min: 5,
    max: 10,
    idleTimeout: 20000,
    createTimeout: 20000,
  },
});
export const fisDB = drizzle({client: poolConnection});
