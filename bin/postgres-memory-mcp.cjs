#!/usr/bin/env node

// This is a modified wrapper script that redirects stdout logging to stderr
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Helper function to log to stderr with timestamp
function logToStderr(message) {
  const timestamp = new Date().toISOString();
  fs.writeSync(2, `${timestamp} [postgres-mcp-wrapper] ${message}\n`);
}

logToStderr('Starting postgres-memory-mcp wrapper');

// Find the directory of this script
const scriptDir = __dirname;
// Path to the main server script
const serverScriptPath = path.join(scriptDir, 'postgres-mcp-server.js');

logToStderr(`Using server script at: ${serverScriptPath}`);

// Parse command line arguments
const args = process.argv.slice(2);
let configArg = args.find(arg => arg.startsWith('--config='));
let config = {};

// If --config is provided, parse it
if (configArg) {
  try {
    const configStr = configArg.replace('--config=', '');
    config = JSON.parse(configStr);
    logToStderr(`Using provided configuration: ${JSON.stringify(config)}`);
  } catch (error) {
    logToStderr(`Error parsing configuration: ${error}`);
    process.exit(1);
  }
}

// Create a temporary file for redirecting stdout to stderr
const tmpDir = '/tmp';
const stdoutPipePath = path.join(tmpDir, `postgres-mcp-stdout-${process.pid}.pipe`);

try {
  // Create pipe if it doesn't exist
  if (!fs.existsSync(stdoutPipePath)) {
    try {
      // Check if the file exists as a regular file and remove it
      if (fs.existsSync(stdoutPipePath)) {
        fs.unlinkSync(stdoutPipePath);
      }
      
      // Create the named pipe
      spawn('mkfifo', [stdoutPipePath]).on('exit', (code) => {
        if (code !== 0) {
          logToStderr(`Failed to create named pipe: ${stdoutPipePath}`);
          process.exit(1);
        }
        
        startServerProcess();
      });
    } catch (error) {
      logToStderr(`Error creating named pipe: ${error}`);
      process.exit(1);
    }
  } else {
    startServerProcess();
  }
} catch (error) {
  logToStderr(`Error setting up logging redirection: ${error}`);
  process.exit(1);
}

function startServerProcess() {
  // Start a process to read from the pipe and write to stderr
  const pipeReader = spawn('cat', [stdoutPipePath], { stdio: ['ignore', 'pipe', 'inherit'] });
  
  // Redirect the pipe reader's stdout to stderr
  pipeReader.stdout.on('data', (data) => {
    // Add timestamp and prefix to each line
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        const timestamp = new Date().toISOString();
        fs.writeSync(2, `${timestamp} [postgres-mcp-stdout] ${line}\n`);
      }
    });
  });
  
  // Add environment variables to redirect logger
  const updatedEnv = {
    ...process.env,
    // Add environment variables to indicate stderr logging
    FORCE_STDERR_LOGGING: 'true',
    LOG_LEVEL: 'debug'
  };
  
  // Spawn the main server script with modified stdio
  logToStderr('Spawning server process with redirected output');
  const serverProcess = spawn('node', [serverScriptPath, ...args], {
    stdio: ['ignore', fs.openSync(stdoutPipePath, 'w'), 'inherit'],
    env: updatedEnv
  });
  
  // Forward exit signals
  serverProcess.on('exit', (code) => {
    logToStderr(`Server process exited with code ${code}`);
    
    // Clean up the named pipe
    try {
      fs.unlinkSync(stdoutPipePath);
      logToStderr(`Removed named pipe: ${stdoutPipePath}`);
    } catch (error) {
      logToStderr(`Error removing named pipe: ${error}`);
    }
    
    process.exit(code);
  });
  
  // Forward signals to the server process
  ['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => {
      logToStderr(`Received ${signal}, forwarding to server process`);
      if (!serverProcess.killed) {
        serverProcess.kill(signal);
      }
    });
  });
}
