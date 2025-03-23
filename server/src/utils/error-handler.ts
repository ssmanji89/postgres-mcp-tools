/**
 * Error handling utilities for the MCP server
 * This module provides a standardized approach to error handling
 */

import { logger } from './logger.js';

/**
 * Custom error class for MCP server errors
 * Provides additional context and standardized formatting
 */
export class MCPError extends Error {
  public code: string;
  public context?: string;
  public originalError?: Error;
  
  constructor(code: string, message: string, context?: string, originalError?: Error) {
    super(message);
    this.name = 'MCPError';
    this.code = code;
    this.context = context;
    this.originalError = originalError;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MCPError);
    }
  }
  
  /**
   * Format the error for logging or display
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : undefined
    };
  }
}

/**
 * Error codes for common error types
 */
export const ErrorCodes = {
  SERVER_ERROR: 'SERVER_ERROR',
  TRANSPORT_ERROR: 'TRANSPORT_ERROR',
  PROTOCOL_ERROR: 'PROTOCOL_ERROR',
  JSON_PARSE_ERROR: 'JSON_PARSE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  TIMEOUT: 'TIMEOUT'
};

/**
 * Handle unexpected errors globally
 * @param error The error to handle
 * @param context Additional context for the error
 */
export function handleError(error: unknown, context?: string): MCPError {
  // Create a standardized error object
  let mcpError: MCPError;
  
  if (error instanceof MCPError) {
    // Already a MCPError, just update context if provided
    if (context && !error.context) {
      error.context = context;
    }
    mcpError = error;
  } else if (error instanceof Error) {
    // Convert standard Error to MCPError
    mcpError = new MCPError(
      ErrorCodes.SERVER_ERROR,
      error.message,
      context,
      error
    );
  } else if (typeof error === 'string') {
    // Convert string error to MCPError
    mcpError = new MCPError(
      ErrorCodes.SERVER_ERROR,
      error,
      context
    );
  } else {
    // Handle unknown error type
    mcpError = new MCPError(
      ErrorCodes.SERVER_ERROR,
      'Unknown error occurred',
      context,
      new Error(String(error))
    );
  }
  
  // Log the error
  logger.error(`${mcpError.code}: ${mcpError.message}${mcpError.context ? ` [${mcpError.context}]` : ''}`);
  
  if (mcpError.originalError && mcpError.originalError.stack) {
    logger.debug(`Original error stack: ${mcpError.originalError.stack}`);
  }
  
  return mcpError;
}

/**
 * Try to execute a function and handle any errors
 * @param fn The function to execute
 * @param context Context for error reporting
 */
export async function tryCatch<T>(fn: () => Promise<T>, context?: string): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw handleError(error, context);
  }
}

/**
 * Create error handling middleware for express-like functions
 */
export function errorHandlerMiddleware() {
  return (err: any, req: any, res: any, next: any) => {
    const mcpError = handleError(err, 'HTTP Request');
    
    res.status(500).json({
      error: {
        code: mcpError.code,
        message: mcpError.message
      }
    });
  };
}

/**
 * Register global error handlers for process-level events
 */
export function registerGlobalErrorHandlers() {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    handleError(error, 'Uncaught Exception');
    // Don't exit the process by default, just log the error
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    handleError(reason instanceof Error ? reason : new Error(String(reason)), 'Unhandled Promise Rejection');
    // Don't exit the process by default, just log the error
  });
  
  // Handle process warnings
  process.on('warning', (warning) => {
    logger.warn(`Process Warning: ${warning.name}: ${warning.message}`);
    logger.debug(`Warning Stack: ${warning.stack}`);
  });
  
  // Handle process termination
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received. Shutting down gracefully.');
    // Allow other shutdown handlers to run
  });
  
  // Handle process interruption
  process.on('SIGINT', () => {
    logger.info('SIGINT signal received. Shutting down gracefully.');
    // Allow other shutdown handlers to run
  });
  
  logger.info('Global error handlers registered');
}

/**
 * Special handler for JSON parsing errors
 * @param data The string that failed to parse
 * @param context Additional context for the error
 */
export function handleJsonParseError(data: string, context?: string): MCPError {
  // Truncate data for logging if too long
  const truncatedData = data.length > 100 
    ? `${data.substring(0, 100)}... (truncated, total length: ${data.length})`
    : data;
  
  // Create a specific JSON parsing error
  const error = new MCPError(
    ErrorCodes.JSON_PARSE_ERROR,
    `Failed to parse data as JSON: ${truncatedData}`,
    context
  );
  
  // Log as debug since this can happen regularly with non-JSON messages
  logger.debug(`${error.code}: ${error.message}${error.context ? ` [${error.context}]` : ''}`);
  
  return error;
}

/**
 * Create a specific transport error
 * @param message Error message
 * @param context Additional context for the error
 */
export function createTransportError(message: string, context?: string): MCPError {
  return new MCPError(ErrorCodes.TRANSPORT_ERROR, message, context);
}

/**
 * Create a specific protocol error
 * @param message Error message
 * @param context Additional context for the error
 */
export function createProtocolError(message: string, context?: string): MCPError {
  return new MCPError(ErrorCodes.PROTOCOL_ERROR, message, context);
}

/**
 * Safely parse JSON with error handling
 * @param data String to parse as JSON
 * @param context Context for error messages
 */
export function safeJsonParse<T>(data: string, context?: string): T | null {
  try {
    return JSON.parse(data) as T;
  } catch (error) {
    handleJsonParseError(data, context);
    return null;
  }
}

// Export all error utilities
export default {
  MCPError,
  ErrorCodes,
  handleError,
  tryCatch,
  errorHandlerMiddleware,
  registerGlobalErrorHandlers,
  handleJsonParseError,
  createTransportError,
  createProtocolError,
  safeJsonParse
};
