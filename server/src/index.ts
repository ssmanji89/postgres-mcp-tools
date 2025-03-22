import { Server } from './typescript-sdk-wrapper.js';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { healthCheck } from './db/client.js';
import { registerResources } from './resources/index.js';
import { registerTools } from './tools/index.js';
import express from 'express';

// Load environment variables
dotenv.config();

// Get configuration from environment
const MCP_PORT = parseInt(process.env.MCP_SERVER_PORT || '3000', 10);
const HTTP_PORT = parseInt(process.env.HTTP_PORT || '8080', 10);
const HOST = process.env.MCP_SERVER_HOST || '0.0.0.0';

console.log('Starting PostgreSQL MCP server...');
console.log(`MCP_PORT: ${MCP_PORT}`);
console.log(`HTTP_PORT: ${HTTP_PORT}`);
console.log(`HOST: ${HOST}`);

// Create the MCP server
const server = new Server({
  resources: registerResources(),
  tools: registerTools(),
});

// Create an Express app for HTTP endpoints
const app = express();
console.log('Express app created');

// Start the server
const startServer = async () => {
  try {
    // Check database connection
    console.log('Checking database connection...');
    const isHealthy = await healthCheck();
    if (!isHealthy) {
      logger.error('Database health check failed. Exiting.');
      process.exit(1);
    }
    console.log('Database connection successful');
    
    // Start the MCP server
    console.log(`Starting MCP server on ${HOST}:${MCP_PORT}...`);
    await server.listen(MCP_PORT, HOST);
    logger.info(`MCP Server listening on ${HOST}:${MCP_PORT}`);
    console.log('MCP server started');
    
    // Add health endpoint
    console.log('Adding health endpoint...');
    app.get('/health', async (req, res) => {
      console.log('Health endpoint requested');
      try {
        const isHealthy = await healthCheck();
        console.log(`Health check result: ${isHealthy}`);
        
        if (isHealthy) {
          res.status(200).json({ status: 'ok', message: 'Service is healthy' });
        } else {
          res.status(500).json({ status: 'error', message: 'Service is unhealthy' });
        }
      } catch (error) {
        console.error('Error handling health check:', error);
        logger.error('Error handling health check:', error);
        res.status(500).json({ status: 'error', message: 'Error handling health check' });
      }
    });
    console.log('Health endpoint added');
    
    // Add a simple root endpoint
    console.log('Adding root endpoint...');
    app.get('/', (req, res) => {
      console.log('Root endpoint requested');
      res.status(200).json({ message: 'PostgreSQL MCP Server is running' });
    });
    console.log('Root endpoint added');
    
    // Start the Express server on a different port
    console.log(`Starting Express server on ${HOST}:${HTTP_PORT}...`);
    app.listen(HTTP_PORT, HOST, () => {
      console.log(`Express server listening on ${HOST}:${HTTP_PORT}`);
      logger.info(`Express server listening on ${HOST}:${HTTP_PORT}`);
    });
    
    // Handle server shutdown
    const handleShutdown = async () => {
      console.log('Shutdown requested');
      logger.info('Shutting down MCP server...');
      await server.close();
      process.exit(0);
    };
    
    // Register shutdown handlers
    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);
    console.log('Shutdown handlers registered');
    
  } catch (error) {
    console.error('Error starting MCP server:', error);
    logger.error('Error starting MCP server:', error);
    process.exit(1);
  }
};

// Start the server
console.log('Starting server...');
startServer().then(() => {
  console.log('Server started successfully');
}).catch((error) => {
  console.error('Failed to start server:', error);
});
