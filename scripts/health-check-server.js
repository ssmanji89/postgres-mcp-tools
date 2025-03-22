#!/usr/bin/env node

import http from 'http';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Log the current directory and environment variables
console.log(`Current directory: ${__dirname}`);
console.log(`POSTGRES_USER: ${process.env.POSTGRES_USER}`);
console.log(`POSTGRES_HOST: ${process.env.POSTGRES_HOST}`);
console.log(`POSTGRES_DB: ${process.env.POSTGRES_DB}`);
console.log(`POSTGRES_PORT: ${process.env.POSTGRES_PORT}`);
console.log(`Password length: ${process.env.POSTGRES_PASSWORD ? process.env.POSTGRES_PASSWORD.length : 0}`);

// Create a PostgreSQL connection pool
const pool = new Pool({
  user: 'memory_user',
  host: '127.0.0.1', // Connect to the Docker container's PostgreSQL server
  database: 'memory_db',
  password: "#9H{+GOc$|J,tAJQt894e:vV=PZ-CI&>", // Hardcoded for testing
  port: 5432,
});

// Health check server info endpoint
const healthInfo = {
  message: 'PostgreSQL MCP Health Check Server',
  endpoints: {
    '/': 'Server information',
    '/health': 'Database health check endpoint',
    '/docker-health': 'Docker container health check'
  }
};

// Create an HTTP server
const server = http.createServer(async (req, res) => {
  console.log(`Request received: ${req.method} ${req.url}`);

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Handle GET requests to the health endpoint
  if (req.method === 'GET' && req.url === '/health') {
    try {
      // Check database connection
      console.log('Executing database query...');
      const result = await pool.query('SELECT NOW()');
      console.log('Query result:', result.rows[0]);
      
      if (result.rows[0]) {
        // Database is healthy
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ 
          status: 'ok', 
          message: 'Service is healthy',
          timestamp: new Date().toISOString()
        }));
      } else {
        // Database query returned no results
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ 
          status: 'error', 
          message: 'Database query returned no results' 
        }));
      }
    } catch (error) {
      // Database connection failed
      console.error('Health check failed:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        status: 'error', 
        message: `Database connection failed: ${error.message}` 
      }));
    }
    return;
  }

  // Handle GET requests to the docker-health endpoint
  if (req.method === 'GET' && req.url === '/docker-health') {
    try {
      // Run a command to check if Docker containers are running
      const { execSync } = await import('child_process');
      
      try {
        const output = execSync('docker ps | grep postgres-mcp-tools').toString();
        console.log('Docker ps output:', output);
        
        // Check if both containers are running
        const mcpServerRunning = output.includes('mcp-server');
        const postgresRunning = output.includes('memory-postgres');
        
        if (mcpServerRunning && postgresRunning) {
          // Both containers are running
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            status: 'ok', 
            message: 'Docker containers are running',
            mcp_server: true,
            postgres: true,
            timestamp: new Date().toISOString()
          }));
        } else {
          // Some containers are not running
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            status: 'error', 
            message: 'Some Docker containers are not running',
            mcp_server: mcpServerRunning,
            postgres: postgresRunning
          }));
        }
      } catch (error) {
        // Docker command failed
        console.error('Docker check failed:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ 
          status: 'error', 
          message: 'Failed to check Docker containers' 
        }));
      }
    } catch (error) {
      // Child process import failed
      console.error('Docker check failed:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        status: 'error', 
        message: 'Failed to import child_process module' 
      }));
    }
    return;
  }

  // Handle GET requests to the root
  if (req.method === 'GET' && req.url === '/') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(healthInfo));
    return;
  }

  // Handle all other requests
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Not Found' }));
});

// Start the server
const PORT = 6060;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Health check server listening on ${HOST}:${PORT}`);
  console.log('Available endpoints:');
  Object.entries(healthInfo.endpoints).forEach(([endpoint, description]) => {
    console.log(`  ${endpoint}: ${description}`);
  });
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('Shutting down health check server...');
  server.close(() => {
    console.log('Health check server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

process.on('SIGTERM', () => {
  console.log('Shutting down health check server...');
  server.close(() => {
    console.log('Health check server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});