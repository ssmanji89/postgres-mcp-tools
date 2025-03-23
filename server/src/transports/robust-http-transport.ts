import http from 'http';
import { Transport } from '../../typescript-sdk/dist/esm/shared/transport.js';
import { RobustReadBuffer, serializeMessage } from './robust-stdio.js';
import { JSONRPCMessage } from '../../typescript-sdk/dist/esm/types.js';
import { logger } from '../utils/logger.js';
import { 
  handleError, 
  tryCatch, 
  ErrorCodes, 
  createTransportError 
} from '../utils/error-handler.js';

/**
 * A robust HTTP transport for MCP that can handle non-JSON messages
 * Fully implements the Transport interface with proper message handling
 */
export class RobustHttpTransport implements Transport {
  private server: http.Server | null = null;
  private readBuffer = new RobustReadBuffer();
  
  // Public properties as required by the Transport interface
  sessionId: string;
  
  // Callback handlers as required by the Transport interface
  onmessage?: (message: JSONRPCMessage) => void;
  onclose?: () => void;
  onerror?: (error: Error) => void;
  
  // Clients to maintain bidirectional communication
  private clients: Map<string, http.ServerResponse> = new Map();
  
  constructor() {
    // Generate a unique session ID
    this.sessionId = Math.random().toString(36).substring(2, 15);
    logger.debug(`Created transport with session ID: ${this.sessionId}`);
  }
  
  /**
   * Start the transport
   * In this implementation, we initialize but don't create the HTTP server yet
   */
  async start(): Promise<void> {
    logger.debug('Transport initialized');
    return Promise.resolve();
  }
  
  /**
   * Close the transport and clean up resources
   */
  async close(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.server) {
        logger.debug('Transport already closed');
        resolve();
        return;
      }
      
      // Close active connections
      for (const [id, res] of this.clients.entries()) {
        try {
          res.end();
          this.clients.delete(id);
          logger.debug(`Closed connection to client ${id}`);
        } catch (error) {
          logger.error(`Error closing connection to client ${id}:`, error);
        }
      }
      
      // Close the server
      this.server.close(() => {
        logger.debug('HTTP server closed');
        this.server = null;
        this.readBuffer.clear();
        if (this.onclose) this.onclose();
        resolve();
      });
    });
  }
  
  /**
   * Send a message to connected clients
   * Properly implements the send method required by the Transport interface
   */
  async send(message: JSONRPCMessage): Promise<void> {
    return tryCatch(async () => {
      const serialized = serializeMessage(message);
      
      if (this.clients.size === 0) {
        logger.debug(`No clients connected, buffering message: ${serialized.substring(0, 100)}${serialized.length > 100 ? '...' : ''}`);
        return Promise.resolve();
      }
      
      // Send to all connected clients
      const sendPromises: Promise<void>[] = [];
      
      for (const [id, res] of this.clients.entries()) {
        if (!res.writableEnded) {
          sendPromises.push(
            new Promise<void>((resolve, reject) => {
              res.write(`${serialized}`, (err) => {
                if (err) {
                  const transportError = createTransportError(
                    `Error sending message to client ${id}: ${err.message}`,
                    'send'
                  );
                  if (this.onerror) this.onerror(transportError);
                  reject(transportError);
                } else {
                  resolve();
                }
              });
            })
          );
        } else {
          // Remove ended connections
          this.clients.delete(id);
        }
      }
      
      await Promise.all(sendPromises);
      logger.debug(`Sent message to ${sendPromises.length} clients`);
      
      return Promise.resolve();
    }, 'Transport.send');
  }
  
  /**
   * Process input data from clients
   * Handles JSON parsing errors gracefully
   */
  processInput(data: Buffer | string, clientId: string): void {
    try {
      // Convert to buffer if needed
      const buffer = typeof data === 'string' ? Buffer.from(data) : data;
      
      // Add to the read buffer
      this.readBuffer.append(buffer);
      
      // Process all complete messages in the buffer
      let message: JSONRPCMessage | null;
      while ((message = this.readBuffer.readMessage()) !== null) {
        if (this.onmessage && message) {
          logger.debug(`Processing message from client ${clientId}`);
          this.onmessage(message);
        }
      }
    } catch (error) {
      // Use the standardized error handler
      const processedError = handleError(error, `processInput(clientId=${clientId})`);
      
      // Call the error handler if provided
      if (this.onerror) {
        this.onerror(processedError);
      }
    }
  }
  
  /**
   * Create and start the HTTP server
   * Sets up proper bidirectional communication with clients
   */
  createServer(port: number, host: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        this.server = http.createServer((req, res) => {
          // Generate a unique client ID
          const clientId = Math.random().toString(36).substring(2, 15);
          
          // Set headers for proper HTTP streaming response
          res.setHeader('Content-Type', 'application/json-stream');
          res.setHeader('Transfer-Encoding', 'chunked');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          
          // Add client to the list of active connections
          this.clients.set(clientId, res);
          logger.debug(`New client connected: ${clientId}`);
          
          // Send a welcome message
          res.write(JSON.stringify({ type: 'connection', status: 'established', clientId }) + '\n');
          
          // Handle client disconnect
          req.on('close', () => {
            this.clients.delete(clientId);
            logger.debug(`Client disconnected: ${clientId}`);
          });
          
          // Process request body if present
          if (req.method === 'POST') {
            const chunks: Buffer[] = [];
            req.on('data', (chunk) => chunks.push(chunk));
            req.on('end', () => {
              try {
                const body = Buffer.concat(chunks);
                
                if (body.length > 0) {
                  logger.debug(`Received data from client ${clientId}, length: ${body.length}`);
                  this.processInput(body, clientId);
                }
              } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                logger.error(`Error handling request body from client ${clientId}:`, err);
                if (this.onerror) this.onerror(err);
              }
            });
          }
        });
        
        // Handle server errors
        this.server.on('error', (error) => {
          logger.error('HTTP server error:', error);
          if (this.onerror) this.onerror(error);
          reject(error);
        });
        
        // Start the server
        this.server.listen(port, host, () => {
          logger.info(`HTTP transport listening on http://${host}:${port}`);
          resolve();
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Error creating HTTP server:', err);
        if (this.onerror) this.onerror(err);
        reject(err);
      }
    });
  }
}