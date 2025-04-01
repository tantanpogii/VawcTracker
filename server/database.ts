import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Validate database URL environment variable
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create PostgreSQL pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Drizzle database instance with our schema
export const db = drizzle({ client: pool, schema });

// Function to initialize the database (create tables, etc.)
export async function initializeDatabase() {
  console.log("Initializing database...");
  
  // Check if connection works
  try {
    const client = await pool.connect();
    client.release();
    console.log("Database connection successful");
  } catch (error) {
    console.error("Error connecting to database:", error);
    throw error;
  }
}