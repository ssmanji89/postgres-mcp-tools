import winston from 'winston';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Ensure logs directory exists
const createLogsDirectory = () => {
  // Get the current working directory
  const cwd = process.cwd();
  
  // Define the logs directory path
  const logsDir = path.join(cwd, 'logs');
  
  // Create the logs directory if it doesn't exist
  if (!fs.existsSync(logsDir)) {
    try {
      fs.mkdirSync(logsDir, { recursive: true });
      console.error(`Created logs directory at: ${logsDir}`);
    } catch (error) {
      console.error(`Failed to create logs directory: ${error instanceof Error ? error.message : String(error)}`);
      // Continue without file logging
    }
  }
};

// Create logs directory before initializing file transports
createLogsDirectory();

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : process.env.LOG_LEVEL || 'info';
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Create custom format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transport array based on environment
const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
      ),
    ),
    // Force all log levels to stderr
    stderrLevels: Object.keys(levels),
  }),
];

// Add file transport in production
const fileTransports: winston.transport[] = [];
if (process.env.NODE_ENV === 'production') {
  try {
    // Use absolute paths for log files
    const logsDir = path.join(process.cwd(), 'logs');
    
    const errorFileTransport = new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      // Handle file errors gracefully
      handleExceptions: true,
      handleRejections: true,
    });
    
    const combinedFileTransport = new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      // Handle file errors gracefully
      handleExceptions: true,
      handleRejections: true,
    });
    
    fileTransports.push(errorFileTransport, combinedFileTransport);
  } catch (error) {
    console.error(`Error setting up file transports: ${error instanceof Error ? error.message : String(error)}`);
    // Continue with console logging only
  }
}

// Create the logger instance
export const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports: [
    ...transports,
    ...fileTransports
  ],
});

export default logger;
