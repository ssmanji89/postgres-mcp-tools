#!/usr/bin/env node

/**
 * Script to fix server dependencies
 * This resolves TypeScript compilation issues with missing type declarations
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'server');

console.log('Installing server dependencies...');

try {
  // Install server dependencies
  execSync('npm install', { 
    cwd: serverDir, 
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' }
  });
  
  console.log('Server dependencies installed successfully.');
  
  // Install type declarations explicitly
  console.log('Installing type declarations...');
  execSync('npm install --save-dev @types/express@4.17.21 @types/pg@8.10.7', { 
    cwd: serverDir, 
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' }
  });
  
  console.log('Type declarations installed successfully.');
} catch (error) {
  console.error('Error installing server dependencies:', error.message);
  process.exit(1);
}
