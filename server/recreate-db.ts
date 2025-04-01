import { db } from './db';
import { seedUsers } from './seed';
import { Pool } from '@neondatabase/serverless';

export async function recreateDatabase() {
  try {
    console.log("Recreating database tables...");
    
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL not set, skipping database recreation");
      return false;
    }

    // Create a pool to connect
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Drop all tables first (in correct order due to foreign keys)
    await pool.query(`
      DROP TABLE IF EXISTS notes CASCADE;
      DROP TABLE IF EXISTS services CASCADE;
      DROP TABLE IF EXISTS cases CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    
    console.log("Tables dropped successfully");

    // Recreate tables with proper schema
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        position TEXT,
        office TEXT,
        role TEXT DEFAULT 'editor' NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cases (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        victim_name TEXT NOT NULL,
        victim_age INTEGER,
        victim_gender TEXT,
        barangay TEXT,
        incident_date TIMESTAMP WITH TIME ZONE NOT NULL,
        incident_type TEXT NOT NULL,
        incident_location TEXT,
        perpetrator_name TEXT NOT NULL,
        perpetrator_relationship TEXT,
        encoder_name TEXT NOT NULL,
        status TEXT NOT NULL,
        priority TEXT,
        case_notes TEXT
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
    
    console.log("Tables created successfully");
    
    // Seed with initial user data
    await seedUsers();
    
    console.log("Database recreated and seeded successfully");
    return true;
  } catch (error) {
    console.error("Error recreating database:", error);
    return false;
  }
}