import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

// Load environment variables
dotenv.config();

// Database connection configuration
const poolConfig = {
  user: process.env.POSTGRES_USER || 'memory_user',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'memory_db',
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  max: parseInt(process.env.PG_MAX_CONNECTIONS || '20', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// Create a connection pool
const pool = new Pool(poolConfig);

// Pool error handler
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Get a client from the pool
 * @returns A database client
 */
export const getClient = async (): Promise<PoolClient> => {
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    logger.error('Error connecting to database', error);
    throw error;
  }
};

/**
 * Execute a query on the database
 * @param text The SQL query
 * @param params The query parameters
 * @returns The query result
 */
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries for optimization
    if (duration > 100) {
      logger.warn(`Slow query (${duration}ms): ${text}`);
    }
    
    return res;
  } catch (error: any) {
    logger.error(`Query error: ${error.message}`, {
      query: text,
      params,
      error: error.stack,
    });
    throw error;
  }
};

/**
 * Execute a transaction on the database
 * @param callback The callback function to execute within the transaction
 * @returns The result of the callback
 */
export const transaction = async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
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

/**
 * Check the health of the database connection
 * @returns True if the database is healthy, false otherwise
 */
export const healthCheck = async (): Promise<boolean> => {
  try {
    const result = await query('SELECT NOW()');
    return result.rows[0] ? true : false;
  } catch (error) {
    logger.error('Database health check failed', error);
    return false;
  }
};

/**
 * Close the database connection pool
 */
export const closePool = async (): Promise<void> => {
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
