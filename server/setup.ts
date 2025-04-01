import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "@shared/schema";
import { DBStorage } from "./db-storage";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

export async function setupDatabase() {
  console.log("Setting up database...");

  try {
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL not set, skipping database setup");
      return false;
    }

    // Create a client to connect
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Test connection
    const client = await pool.connect();
    console.log("Database connection successful");
    client.release();

    // Create database schema
    const db = drizzle({ client: pool, schema });

    // Push schema to database
    console.log("Pushing schema to database...");
    
    // Execute SQL to create tables if not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        position TEXT,
        office TEXT
      );

      CREATE TABLE IF NOT EXISTS cases (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        date_reported TIMESTAMP WITH TIME ZONE NOT NULL,
        entry_date TIMESTAMP WITH TIME ZONE NOT NULL,
        victim_name TEXT NOT NULL,
        perpetrator_name TEXT NOT NULL,
        barangay TEXT NOT NULL,
        status TEXT NOT NULL,
        encoder_id INTEGER NOT NULL,
        encoder_name TEXT NOT NULL,
        encoder_position TEXT NOT NULL,
        encoder_office TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        type TEXT NOT NULL,
        date_provided TIMESTAMP WITH TIME ZONE NOT NULL,
        provider TEXT NOT NULL,
        notes TEXT,
        case_id INTEGER NOT NULL,
        FOREIGN KEY (case_id) REFERENCES cases (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        content TEXT NOT NULL,
        case_id INTEGER NOT NULL,
        author_id INTEGER NOT NULL,
        FOREIGN KEY (case_id) REFERENCES cases (id) ON DELETE CASCADE,
        FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE
      );
    `);
    
    console.log("Database tables created successfully");
    
    // Seed the database with initial data
    const dbStorage = new DBStorage();
    await dbStorage.seedDatabase();
    console.log("Database seeded successfully");
    
    return true;
  } catch (error) {
    console.error("Error setting up database:", error);
    return false;
  }
}