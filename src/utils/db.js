// Database connection manager
import pg from 'pg';
import dotenv from 'dotenv';
import { logger } from './logger.js';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Configure connection pool
const poolConfig = {
  user: process.env.POSTGRES_USER || 'memory_user',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'memory_db',
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  max: parseInt(process.env.PG_MAX_CONNECTIONS || '20', 10), // Maximum number of clients
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// Create a connection pool
const pool = new Pool(poolConfig);

// Pool error handler
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Get a client from the pool
export const getClient = async () => {
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    logger.error('Error connecting to database', error);
    throw error;
  }
};

// Query helper function
export const query = async (text, params) => {
  const start = Date.now();
  
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries for optimization
    if (duration > 100) {
      logger.warn(`Slow query (${duration}ms): ${text}`);
    }
    
    return res;
  } catch (error) {
    logger.error(`Query error: ${error.message}`, {
      query: text,
      params,
      error: error.stack,
    });
    throw error;
  }
};

// Transaction helper function
export const transaction = async (callback) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Health check function
export const healthCheck = async () => {
  try {
    const result = await query('SELECT NOW()');
    return result.rows[0] ? true : false;
  } catch (error) {
    logger.error('Database health check failed', error);
    return false;
  }
};

// Close the pool
export const closePool = async () => {
  try {
    await pool.end();
    logger.info('Database pool closed');
  } catch (error) {
    logger.error('Error closing database pool', error);
    throw error;
  }
};

export default {
  query,
  getClient,
  transaction,
  healthCheck,
  closePool,
};
