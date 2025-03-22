#!/usr/bin/env node

/**
 * This script initializes the PostgreSQL database with the required schema and extensions.
 * It reads the SQL initialization file and executes it against the PostgreSQL instance.
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables
dotenv.config({ path: path.join(rootDir, '.env') });

// PostgreSQL connection configuration
const pgConfig = {
  user: process.env.POSTGRES_USER || 'memory_user',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'memory_db',
  password: process.env.POSTGRES_PASSWORD || 'change_me_in_production',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// Function to read and execute SQL initialization file
async function initializeDatabase() {
  console.log('\x1b[36m%s\x1b[0m', '🗄️  Initializing PostgreSQL database...');
  
  try {
    // Read SQL initialization file
    const sqlFilePath = path.join(rootDir, 'init', '01-init.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL initialization file not found at ${sqlFilePath}`);
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Connect to PostgreSQL
    const client = new pg.Client(pgConfig);
    await client.connect();
    
    console.log('\x1b[32m%s\x1b[0m', '✓ Connected to PostgreSQL');
    
    // Execute SQL initialization
    await client.query(sqlContent);
    
    console.log('\x1b[32m%s\x1b[0m', '✓ Executed SQL initialization scripts');
    
    // Close connection
    await client.end();
    
    console.log('\x1b[32m%s\x1b[0m', '✓ Database initialization completed successfully');
    
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `❌ Database initialization failed: ${error.message}`);
    
    if (error.message.includes('role "memory_user" does not exist')) {
      console.log('\x1b[33m%s\x1b[0m', 'ℹ️  Hint: You may need to create the PostgreSQL user first:');
      console.log('   CREATE USER memory_user WITH PASSWORD \'your_password\';');
      console.log('   ALTER USER memory_user WITH SUPERUSER;');
    }
    
    if (error.message.includes('database "memory_db" does not exist')) {
      console.log('\x1b[33m%s\x1b[0m', 'ℹ️  Hint: You may need to create the database first:');
      console.log('   CREATE DATABASE memory_db;');
      console.log('   GRANT ALL PRIVILEGES ON DATABASE memory_db TO memory_user;');
    }
    
    process.exit(1);
  }
}

// Main function
async function main() {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `❌ Unexpected error: ${error.message}`);
    process.exit(1);
  }
}

main();
