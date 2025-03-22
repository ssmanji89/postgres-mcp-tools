import { Server } from './typescript-sdk-wrapper.js';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { healthCheck } from './db/client.js';
import { registerResources } from './resources/index.js';
import { registerTools } from './tools/index.js';

// Load environment variables
dotenv.config();

// Get configuration from environment
const PORT = parseInt(process.env.MCP_SERVER_PORT || '3000', 10);
const HOST = process.env.MCP_SERVER_HOST || 'localhost';

// Create the MCP server
const server = new Server({
  resources: registerResources(),
  tools: registerTools(),
});

// Start the server
const startServer = async () => {
  try {
    // Check database connection
    const isHealthy = await healthCheck();
    if (!isHealthy) {
      logger.error('Database health check failed. Exiting.');
      process.exit(1);
    }
    
    // Start the MCP server
    await server.listen(PORT, HOST);
    logger.info(`MCP Server listening on ${HOST}:${PORT}`);
    
    // Add health endpoint
    server.addEndpoint('/health', async (req: any, res: any) => {
      const isHealthy = await healthCheck();
      
      if (isHealthy) {
        res.status(200).json({ status: 'ok', message: 'Service is healthy' });
      } else {
        res.status(500).json({ status: 'error', message: 'Service is unhealthy' });
      }
    });
    
    // Handle server shutdown
    const handleShutdown = async () => {
      logger.info('Shutting down MCP server...');
      await server.close();
      process.exit(0);
    };
    
    // Register shutdown handlers
    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);
    
  } catch (error) {
    logger.error('Error starting MCP server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
