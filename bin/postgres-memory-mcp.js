#!/usr/bin/env node

// This is a simple wrapper script that calls the main server script
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the main server script
const serverScriptPath = path.join(__dirname, 'postgres-mcp-server.js');

// Spawn the main server script with the same arguments
const serverProcess = spawn('node', [serverScriptPath, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env
});

// Forward exit signals
serverProcess.on('exit', (code) => {
  process.exit(code);
});

// Forward signals to the server process
['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => {
    if (!serverProcess.killed) {
      serverProcess.kill(signal);
    }
  });
});
