#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
let configArg = args.find(arg => arg.startsWith('--config='));
let config = {};

// If --config is provided, parse it
if (configArg) {
  try {
    const configStr = configArg.replace('--config=', '');
    config = JSON.parse(configStr);
    console.log('Using provided configuration:', config);
  } catch (error) {
    console.error('Error parsing configuration:', error);
    process.exit(1);
  }
}

// Default configuration values
config.port = config.port || process.env.MCP_SERVER_PORT || 3000;
config.host = config.host || process.env.MCP_SERVER_HOST || 'localhost';
config.pgHost = config.pgHost || process.env.POSTGRES_HOST || 'localhost';
config.pgPort = config.pgPort || process.env.POSTGRES_PORT || 5432;
config.pgUser = config.pgUser || process.env.POSTGRES_USER || 'memory_user';
config.pgPassword = config.pgPassword || process.env.POSTGRES_PASSWORD;
config.pgDatabase = config.pgDatabase || process.env.POSTGRES_DB || 'memory_db';
config.embeddingModel = config.embeddingModel || process.env.EMBEDDING_MODEL || 'mock';

// Export configuration as environment variables
process.env.MCP_SERVER_PORT = config.port.toString();
process.env.MCP_SERVER_HOST = config.host;
process.env.POSTGRES_HOST = config.pgHost;
process.env.POSTGRES_PORT = config.pgPort.toString();
process.env.POSTGRES_USER = config.pgUser;
process.env.POSTGRES_PASSWORD = config.pgPassword;
process.env.POSTGRES_DB = config.pgDatabase;
process.env.EMBEDDING_MODEL = config.embeddingModel;

// If API keys are provided in configuration
if (config.openaiApiKey) {
  process.env.OPENAI_API_KEY = config.openaiApiKey;
}
if (config.anthropicApiKey) {
  process.env.ANTHROPIC_API_KEY = config.anthropicApiKey;
}

// Determine the path to the server executable
const serverPath = path.resolve(__dirname, '../server/dist/index.js');

// Check if the server executable exists
if (!fs.existsSync(serverPath)) {
  console.error(`Server executable not found at: ${serverPath}`);
  console.error('Make sure to build the server first: npm run build-server');
  process.exit(1);
}

console.log(`Starting PostgreSQL MCP Server on ${config.host}:${config.port}`);
console.log(`Using database: ${config.pgHost}:${config.pgPort}/${config.pgDatabase}`);
console.log(`Embedding model: ${config.embeddingModel}`);

// Start the server
const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: process.env
});

// Handle server exit
server.on('exit', (code) => {
  console.log(`PostgreSQL MCP Server exited with code ${code}`);
  process.exit(code);
});

// Forward signals to the server process
['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => {
    if (!server.killed) {
      server.kill(signal);
    }
  });
});
