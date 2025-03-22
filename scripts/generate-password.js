#!/usr/bin/env node

/**
 * This script generates a secure random password for PostgreSQL
 * and updates the .env file with the generated password.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Generate a secure random password
function generateSecurePassword(length = 32) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?';
  let password = '';
  
  // Use crypto.getRandomValues for better randomness
  const randomValues = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    const randomIndex = randomValues[i] % charset.length;
    password += charset[randomIndex];
  }
  
  return password;
}

// Update .env file with the generated password
function updateEnvFile() {
  const envExamplePath = path.join(rootDir, '.env.example');
  const envPath = path.join(rootDir, '.env');
  
  try {
    // Check if .env already exists
    if (!fs.existsSync(envPath)) {
      // Create .env from .env.example if it doesn't exist
      if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('Created .env file from .env.example');
      } else {
        // Create a basic .env file if .env.example doesn't exist
        fs.writeFileSync(envPath, '# PostgreSQL Configuration\nPOSTGRES_USER=memory_user\nPOSTGRES_PASSWORD=\nPOSTGRES_DB=memory_db\nPOSTGRES_HOST=localhost\nPOSTGRES_PORT=5432\n');
        console.log('Created new .env file with default settings');
      }
    }
    
    // Generate a secure password
    const password = generateSecurePassword();
    
    // Read the current .env file
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace or add the password
    if (envContent.includes('POSTGRES_PASSWORD=')) {
      // Replace existing password
      envContent = envContent.replace(/POSTGRES_PASSWORD=.*$/m, `POSTGRES_PASSWORD=${password}`);
    } else {
      // Add password if not present
      envContent += `\nPOSTGRES_PASSWORD=${password}\n`;
    }
    
    // Write the updated content back to .env
    fs.writeFileSync(envPath, envContent);
    
    console.log('\x1b[32m%s\x1b[0m', '✓ Generated secure PostgreSQL password and updated .env file');
    console.log('\x1b[33m%s\x1b[0m', '! Be sure to update your docker-compose.yml file if needed');
    
  } catch (error) {
    console.error('Error updating .env file:', error);
    process.exit(1);
  }
}

// Main function
function main() {
  console.log('\x1b[36m%s\x1b[0m', '🔒 PostgreSQL MCP Tools - Password Generation');
  
  updateEnvFile();
  
  console.log('\x1b[36m%s\x1b[0m', '🚀 Setup completed successfully!');
}

main();
