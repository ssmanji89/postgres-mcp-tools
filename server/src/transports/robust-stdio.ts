import { JSONRPCMessageSchema, JSONRPCMessage } from '../../typescript-sdk/dist/esm/types.js';
import { serializeMessage } from '../../typescript-sdk/dist/esm/shared/stdio.js';
import { logger } from '../utils/logger.js';
import { handleJsonParseError, safeJsonParse, ErrorCodes, MCPError } from '../utils/error-handler.js';

/**
 * Enhanced buffer implementation that gracefully handles non-JSON input
 * This is a complete rewrite rather than extending ReadBuffer to avoid
 * accessing private properties
 */
export class RobustReadBuffer {
  private buffer?: Buffer;
  
  /**
   * Add data to the buffer
   */
  append(chunk: Buffer): void {
    this.buffer = this.buffer ? Buffer.concat([this.buffer, chunk]) : chunk;
  }
  
  /**
   * Read a complete message from the buffer
   * Returns null if no complete message is available
   * Unlike the original ReadBuffer, this version handles non-JSON content
   * gracefully
   */
  readMessage(): JSONRPCMessage | null {
    if (!this.buffer) {
      return null;
    }
    
    const index = this.buffer.indexOf("\n");
    if (index === -1) {
      return null;
    }
    
    const line = this.buffer.toString("utf8", 0, index);
    this.buffer = this.buffer.subarray(index + 1);
    
    try {
      // Try to parse as JSON-RPC message
      return deserializeMessage(line);
    } catch (error) {
      // If it's not a valid JSON-RPC message, log it instead
      if (line.trim()) {
        // Use our special handler for JSON parse errors
        handleJsonParseError(line, 'RobustReadBuffer');
      }
      return null;
    }
  }
  
  /**
   * Clear the buffer
   */
  clear(): void {
    this.buffer = undefined;
  }
}

/**
 * Safely deserialize a message string into a JSON-RPC message object
 * Adds error handling to prevent crashes on non-JSON input
 */
export function deserializeMessage(line: string): JSONRPCMessage {
  // First try to parse the JSON
  const json = safeJsonParse<any>(line, 'deserializeMessage');
  
  if (!json) {
    throw new MCPError(
      ErrorCodes.JSON_PARSE_ERROR,
      'Failed to parse message as JSON',
      'deserializeMessage'
    );
  }
  
  try {
    // Then validate it as a JSON-RPC message
    return JSONRPCMessageSchema.parse(json);
  } catch (error) {
    // Log the error but with the actual content for debugging
    logger.debug(`Invalid JSON-RPC message format: ${line}`);
    
    // If validation fails, throw a protocol error
    throw new MCPError(
      ErrorCodes.PROTOCOL_ERROR,
      'Message is not a valid JSON-RPC message',
      'deserializeMessage',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Re-export serializeMessage for convenience
 */
export { serializeMessage };