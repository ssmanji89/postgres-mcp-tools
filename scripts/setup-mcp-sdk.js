#!/usr/bin/env node

/**
 * Script to setup the MCP SDK dependencies properly
 * This resolves issues with circular dependencies and Git-based installations
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const sdkDir = path.join(serverDir, 'typescript-sdk');

console.log('Setting up MCP SDK dependencies...');

// Check if the typescript-sdk directory exists
if (!fs.existsSync(sdkDir)) {
  console.log('MCP SDK directory not found. Cloning from GitHub...');
  
  try {
    // Create the directory
    fs.mkdirSync(sdkDir, { recursive: true });
    
    // Clone the repository
    execSync(
      'git clone https://github.com/modelcontextprotocol/typescript-sdk.git .',
      { cwd: sdkDir, stdio: 'inherit' }
    );
    
    console.log('MCP SDK cloned successfully.');
  } catch (error) {
    console.error('Error cloning MCP SDK:', error.message);
    process.exit(1);
  }
}

// Install dependencies in the SDK directory
console.log('Installing MCP SDK dependencies...');
try {
  execSync('npm install', { cwd: sdkDir, stdio: 'inherit' });
  console.log('MCP SDK dependencies installed successfully.');
} catch (error) {
  console.error('Error installing MCP SDK dependencies:', error.message);
  process.exit(1);
}

// Update the server's package.json to reference the local SDK
console.log('Updating server package.json...');
try {
  const serverPackageJsonPath = path.join(serverDir, 'package.json');
  const serverPackageJson = JSON.parse(fs.readFileSync(serverPackageJsonPath, 'utf-8'));
  
  // Add the MCP SDK reference
  if (!serverPackageJson.dependencies['@modelcontextprotocol/typescript-sdk']) {
    serverPackageJson.dependencies['@modelcontextprotocol/typescript-sdk'] = 'file:./typescript-sdk';
    fs.writeFileSync(
      serverPackageJsonPath,
      JSON.stringify(serverPackageJson, null, 2),
      'utf-8'
    );
  }
  
  console.log('Server package.json updated successfully.');
} catch (error) {
  console.error('Error updating server package.json:', error.message);
  process.exit(1);
}

console.log('MCP SDK setup completed successfully.');
