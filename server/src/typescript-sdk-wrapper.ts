// This file serves as a wrapper for all imports from the Model Context Protocol TypeScript SDK
// We can't directly import from '@modelcontextprotocol/typescript-sdk' due to package resolution issues

import { Server as MCPServer } from '../typescript-sdk/dist/esm/server/index.js';
import http from 'http';
import { logger } from './utils/logger.js';

// Force all console.log outputs to go through the logger
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args) => {
  logger.debug(...args);
};

console.error = (...args) => {
  logger.error(...args);
};

// Enhanced response object to include Express-like methods
interface EnhancedResponse extends http.ServerResponse {
  status(code: number): EnhancedResponse;
  json(data: any): void;
}

// Server class with the correct constructor parameters 
export class Server extends MCPServer {
  private httpServer: http.Server | null = null;
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

  async listen(port: number, host: string) {
    // Create an HTTP server
    this.httpServer = http.createServer((req, res) => this.handleRequest(req, res as EnhancedResponse));
    
    return new Promise<void>((resolve, reject) => {
      if (!this.httpServer) {
        return reject(new Error('HTTP server not initialized'));
      }
      
      this.httpServer.listen(port, host, () => {
        logger.debug(`[Server] Started listening on ${host}:${port}`);
        resolve();
      }).on('error', (error) => {
        reject(error);
      });
    });
  }

  addEndpoint(path: string, handler: (req: http.IncomingMessage, res: EnhancedResponse) => Promise<void>) {
    // Store the handler for the endpoint
    this.endpoints.set(path, handler);
    logger.debug(`[Server] Added endpoint: ${path}`);
  }

  async close() {
    return new Promise<void>((resolve, reject) => {
      if (!this.httpServer) {
        return resolve();
      }
      
      this.httpServer.close((error) => {
        if (error) {
          return reject(error);
        }
        resolve();
      });
    });
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