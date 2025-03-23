import { Server } from './typescript-sdk-wrapper.js';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { healthCheck } from './db/client.js';
import { registerResources } from './resources/index.js';
import { registerTools } from './tools/index.js';
import express from 'express';
import { registerGlobalErrorHandlers, tryCatch, errorHandlerMiddleware } from './utils/error-handler.js';

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

// Register global error handlers
registerGlobalErrorHandlers();

// Start the server
const startServer = async () => {
  return tryCatch(async () => {
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
    
    // Add error middleware to Express
    app.use(errorHandlerMiddleware());
    
    // Add health endpoint
    logger.debug('Adding health endpoint...');
    app.get('/health', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        logger.debug('Health endpoint requested');
        const isHealthy = await healthCheck();
        logger.debug(`Health check result: ${isHealthy}`);
        
        if (isHealthy) {
          res.status(200).json({ status: 'ok', message: 'Service is healthy' });
        } else {
          res.status(500).json({ status: 'error', message: 'Service is unhealthy' });
        }
      } catch (error) {
        // Pass error to the error middleware
        next(error);
      }
    });
    logger.debug('Health endpoint added');
    
    // Add a simple root endpoint
    logger.debug('Adding root endpoint...');
    app.get('/', (req: express.Request, res: express.Response) => {
      logger.debug('Root endpoint requested');
      res.status(200).json({ 
        message: 'PostgreSQL MCP Server is running',
        version: '1.0.2',
        features: ['Robust transport layer', 'Error handling', 'HTTP API']
      });
    });
    logger.debug('Root endpoint added');
    
    // Add version endpoint
    app.get('/version', (req: express.Request, res: express.Response) => {
      res.status(200).json({ 
        version: '1.0.2',
        name: 'postgres-memory-mcp',
        robustTransport: true,
        errorHandling: true
      });
    });
    
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
      // Exit gracefully
      setTimeout(() => process.exit(0), 500);
    };
    
    // Register shutdown handlers
    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);
    logger.debug('Shutdown handlers registered');
  }, 'startServer');
};

// Start the server
logger.info('Starting PostgreSQL MCP server with robust transport layer...');
startServer().then(() => {
  logger.info('Server started successfully');
  logger.info('Robust transport layer initialized successfully');
}).catch((error) => {
  logger.error('Failed to start server:', error);
  // Don't exit immediately, give it a moment to log the error
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});
