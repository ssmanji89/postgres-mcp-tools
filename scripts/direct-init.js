#!/usr/bin/env node

/**
 * This script initializes the PostgreSQL database directly inside the Docker container
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Read SQL initialization file
const sqlFilePath = path.join(rootDir, 'init', '01-init.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Create a temporary SQL file
const tempSqlPath = path.join('/tmp', 'postgres-init.sql');
fs.writeFileSync(tempSqlPath, sqlContent);

console.log(`Created temporary SQL file at ${tempSqlPath}`);

// Copy file to container
const copyCmd = spawn('docker', ['cp', tempSqlPath, 'memory-postgres:/tmp/init.sql']);

copyCmd.on('close', (code) => {
  if (code !== 0) {
    console.error(`Failed to copy SQL file to container: ${code}`);
    process.exit(1);
  }
  
  console.log('SQL file copied to container');
  
  // Execute SQL file in container
  const execCmd = spawn('docker', ['exec', 'memory-postgres', 'psql', '-U', 'memory_user', '-d', 'memory_db', '-f', '/tmp/init.sql']);
  
  execCmd.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });
  
  execCmd.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });
  
  execCmd.on('close', (code) => {
    if (code !== 0) {
      console.error(`SQL execution failed with code ${code}`);
      process.exit(1);
    }
    
    console.log('Database initialization completed successfully');
    
    // Clean up
    fs.unlinkSync(tempSqlPath);
  });
});
