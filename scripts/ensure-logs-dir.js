#!/usr/bin/env node

/**
 * Script to ensure the logs directory exists
 * This fixes issues with winston file transports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const logsDir = path.join(rootDir, 'logs');
const serverLogsDir = path.join(serverDir, 'logs');

console.log('Ensuring logs directories exist...');

// Create logs directories
const createDirectory = (dir) => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    } catch (error) {
      console.error(`Error creating directory ${dir}: ${error.message}`);
    }
  } else {
    console.log(`Directory already exists: ${dir}`);
  }
};

// Create logs directories
createDirectory(logsDir);
createDirectory(serverLogsDir);

console.log('Logs directories setup completed.');
