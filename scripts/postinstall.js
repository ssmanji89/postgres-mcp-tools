#!/usr/bin/env node

/**
 * This script runs after the package is installed.
 * It sets up the environment and initializes the database.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Run a script and handle its output
function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`Running ${scriptPath}...`);
    
    const child = spawn('node', [scriptPath, ...args], {
      stdio: 'inherit',
      cwd: rootDir
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script ${scriptPath} exited with code ${code}`));
      }
    });
    
    child.on('error', (err) => {
      reject(new Error(`Failed to run script ${scriptPath}: ${err.message}`));
    });
  });
}

// Main function
async function main() {
  console.log('\x1b[36m%s\x1b[0m', '🚀 PostgreSQL MCP Tools - Post Install Setup');
  
  try {
    // Generate secure password
    await runScript(path.join(__dirname, 'generate-password.js'));
    
    console.log('\x1b[36m%s\x1b[0m', '✅ Setup completed successfully!');
    console.log('\x1b[33m%s\x1b[0m', 'To start the MCP server:');
    console.log('   1. Start PostgreSQL: docker-compose up -d postgres');
    console.log('   2. Run MCP server:   npm run start-server');
    console.log('   or run everything:   docker-compose up -d');
    
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `❌ Setup failed: ${error.message}`);
    process.exit(1);
  }
}

main();
