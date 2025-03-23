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

logger.info('Starting PostgreSQL MCP server...');
logger.debug(`MCP_PORT: ${MCP_PORT}`);
logger.debug(`HTTP_PORT: ${HTTP_PORT}`);
logger.debug(`HOST: ${HOST}`);

// Create the MCP server
const server = new Server({
  resources: registerResources(),
  tools: registerTools(),
});

// Create an Express app for HTTP endpoints
const app = express();
logger.debug('Express app created');

// Start the server
const startServer = async () => {
  try {
    // Check database connection
    logger.debug('Checking database connection...');
    const isHealthy = await healthCheck();
    if (!isHealthy) {
      logger.error('Database health check failed. Exiting.');
      process.exit(1);
    }
    logger.info('Database connection successful');
    
    // Start the MCP server
    logger.debug(`Starting MCP server on ${HOST}:${MCP_PORT}...`);
    await server.listen(MCP_PORT, HOST);
    logger.info(`MCP Server listening on ${HOST}:${MCP_PORT}`);
    logger.info('MCP server started');
    
    // Add health endpoint
    logger.debug('Adding health endpoint...');
    app.get('/health', async (req, res) => {
      logger.debug('Health endpoint requested');
      try {
        const isHealthy = await healthCheck();
        logger.debug(`Health check result: ${isHealthy}`);
        
        if (isHealthy) {
          res.status(200).json({ status: 'ok', message: 'Service is healthy' });
        } else {
          res.status(500).json({ status: 'error', message: 'Service is unhealthy' });
        }
      } catch (error) {
        logger.error('Error handling health check:', error);
        res.status(500).json({ status: 'error', message: 'Error handling health check' });
      }
    });
    logger.debug('Health endpoint added');
    
    // Add a simple root endpoint
    logger.debug('Adding root endpoint...');
    app.get('/', (req, res) => {
      logger.debug('Root endpoint requested');
      res.status(200).json({ message: 'PostgreSQL MCP Server is running' });
    });
    logger.debug('Root endpoint added');
    
    // Start the Express server on a different port
    logger.debug(`Starting Express server on ${HOST}:${HTTP_PORT}...`);
    app.listen(HTTP_PORT, HOST, () => {
      logger.info(`Express server listening on ${HOST}:${HTTP_PORT}`);
    });
    
    // Handle server shutdown
    const handleShutdown = async () => {
      logger.info('Shutdown requested');
      logger.info('Shutting down MCP server...');
      await server.close();
      process.exit(0);
    };
    
    // Register shutdown handlers
    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);
    logger.debug('Shutdown handlers registered');
    
  } catch (error) {
    logger.error('Error starting MCP server:', error);
    process.exit(1);
  }
};

// Start the server
logger.info('Starting server...');
startServer().then(() => {
  logger.info('Server started successfully');
}).catch((error) => {
  logger.error('Failed to start server:', error);
});
