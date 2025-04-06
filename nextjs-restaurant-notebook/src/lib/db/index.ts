import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Use environment variables for the database connection
const DATABASE_URL = process.env.DATABASE_URL;

// Create a database connection only on the server
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

if (DATABASE_URL) {
  const sql = neon(DATABASE_URL);
  db = drizzle(sql, { schema });
} else {
  console.warn("DATABASE_URL is not defined. Database connection not established.");
}

export { db };