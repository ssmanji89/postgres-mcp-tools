// This file serves as a wrapper for all imports from the Model Context Protocol TypeScript SDK
// We can't directly import from '@modelcontextprotocol/typescript-sdk' due to package resolution issues

import { Server as MCPServer } from '../typescript-sdk/dist/esm/server/index.js';
import { Transport } from '../typescript-sdk/dist/esm/shared/transport.js';
import http from 'http';
import { logger } from './utils/logger.js';
import { RobustHttpTransport } from './transports/robust-http-transport.js';

// Force all console.log outputs to go through the logger
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args) => {
  logger.debug(...args);
};

console.error = (...args) => {
  logger.error(...args);
};

// Create a global error handler to prevent unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

// Enhanced response object to include Express-like methods
interface EnhancedResponse extends http.ServerResponse {
  status(code: number): EnhancedResponse;
  json(data: any): void;
}

// Server class with the correct constructor parameters 
export class Server extends MCPServer {
  #transport?: RobustHttpTransport;
  private endpoints: Map<string, (req: http.IncomingMessage, res: EnhancedResponse) => Promise<void>> = new Map();

  constructor(options = {}) {
    super({
      name: 'PostgresMCP',
      version: '1.0.0'
    }, {
      capabilities: {
        resources: { subscribe: true, listChanged: true },
        tools: { listChanged: true },
        logging: {}
      },
      ...options
    });
  }

  /**
   * Get the transport instance
   * This overrides the getter from the base class to provide type safety
   */
  get transport(): Transport | undefined {
    return this.#transport;
  }

  /**
   * Start the server and listen for connections
   * @param port Port to listen on
   * @param host Host to bind to
   */
  async listen(port: number, host: string): Promise<void> {
    try {
      logger.debug(`[Server] Starting server on ${host}:${port}...`);
      
      // Create our robust transport
      this.#transport = new RobustHttpTransport();
      
      // Set up error handling for the transport
      this.#transport.onerror = (error) => {
        logger.error('Transport error:', error);
        // Don't crash the server on transport errors
      };
      
      // Start the transport first
      await this.#transport.start();
      
      // Connect the protocol to our transport
      await this.connect(this.#transport);
      
      // Create the HTTP server in the transport
      await this.#transport.createServer(port, host);
      
      logger.info(`[Server] MCP server started and listening on ${host}:${port}`);
      
      return Promise.resolve();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error starting server:', err);
      return Promise.reject(err);
    }
  }

  addEndpoint(path: string, handler: (req: http.IncomingMessage, res: EnhancedResponse) => Promise<void>) {
    // Store the handler for the endpoint
    this.endpoints.set(path, handler);
    logger.debug(`[Server] Added endpoint: ${path}`);
  }

  /**
   * Close the server and release resources
   */
  async close(): Promise<void> {
    try {
      logger.debug('[Server] Closing server...');
      
      // Close the transport
      await this.#transport?.close();
      this.#transport = undefined;
      
      logger.info('[Server] Server closed successfully');
      return Promise.resolve();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error closing server:', err);
      return Promise.reject(err);
    }
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    try {
      // Parse the URL to get the path
      const path = req.url || '/';
      
      // Find the handler for the endpoint
      const handler = this.endpoints.get(path);
      
      // Enhance the response object with Express-like methods
      const enhancedRes = res as EnhancedResponse;
      enhancedRes.status = function(code: number) {
        this.statusCode = code;
        return this;
      };
      enhancedRes.json = function(data: any) {
        this.setHeader('Content-Type', 'application/json');
        this.end(JSON.stringify(data));
      };
      
      if (handler) {
        await handler(req, enhancedRes);
      } else {
        // Return 404 if no handler found
        enhancedRes.status(404).json({ error: 'Not Found' });
      }
    } catch (error) {
      logger.error('Error handling request:', error);
      
      // Return 500 if there's an error
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  }
}

// Define the Resource interface based on the implementation requirements
export interface Resource {
  name: string;
  processMessage(message: Message, requestMetadata: any): Promise<void>;
  getContext(message: Message, requestMetadata: any): Promise<ContextItem[]>;
}

// Define the Tool interface based on the implementation requirements
export interface Tool {
  name: string;
  description?: string;
  parameters: any; // JSON Schema object
  execute(params: any): Promise<any>;
}

// Define Message and ContextItem types based on implementation needs
export interface Message {
  role: string;
  content: string;
  timestamp?: string;
}

export interface ContextItem {
  content: string;
  metadata?: any;
}