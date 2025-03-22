import crypto from 'crypto';
import { query, transaction } from '../utils/db.js';
import { logger } from '../utils/logger.js';

/**
 * Generate an embedding for text content
 * This is a placeholder function that should be replaced with a real embedding model in production
 * 
 * @param {string} text - The text to generate embeddings for
 * @returns {string} - The embedding as a PostgreSQL vector string
 */
export const generateEmbedding = async (text) => {
  const embeddingModel = process.env.EMBEDDING_MODEL || 'mock';
  
  switch (embeddingModel) {
    case 'openai':
      // Production: Use OpenAI embeddings
      if (!process.env.OPENAI_API_KEY) {
        logger.warn('OPENAI_API_KEY not set, falling back to mock embeddings');
        return generateMockEmbedding(text);
      }
      try {
        return await generateOpenAIEmbedding(text);
      } catch (error) {
        logger.error('Error generating OpenAI embedding:', error);
        return generateMockEmbedding(text);
      }
    
    case 'anthropic':
      // Production: Use Anthropic embeddings
      if (!process.env.ANTHROPIC_API_KEY) {
        logger.warn('ANTHROPIC_API_KEY not set, falling back to mock embeddings');
        return generateMockEmbedding(text);
      }
      try {
        return await generateAnthropicEmbedding(text);
      } catch (error) {
        logger.error('Error generating Anthropic embedding:', error);
        return generateMockEmbedding(text);
      }
      
    case 'mock':
    default:
      // Development: Use mock embeddings
      return generateMockEmbedding(text);
  }
};

/**
 * Generate a mock embedding for development and testing
 * 
 * @param {string} text - The text to generate a mock embedding for
 * @returns {string} - The mock embedding as a PostgreSQL vector string
 */
const generateMockEmbedding = (text) => {
  // Create a hash of the text to use as seed
  const hash = crypto.createHash('sha256').update(text).digest('hex');
  
  // Convert hash to an array of numbers
  const hashNums = [];
  for (let i = 0; i < hash.length; i += 2) {
    hashNums.push(parseInt(hash.substring(i, i + 2), 16) / 255);
  }
  
  // Expand the hash to the required size (1536 dimensions)
  const embedding = [];
  for (let i = 0; i < 1536; i++) {
    // Use a simple formula to generate a value between -1 and 1
    const val = Math.cos(i * (hashNums[i % hashNums.length] + 0.1)) * 0.99;
    embedding.push(val);
  }
  
  // Format as a pgvector string
  return `[${embedding.join(',')}]`;
};

/**
 * Generate an OpenAI embedding (to be replaced with actual API call)
 * 
 * @param {string} text - The text to generate an embedding for
 * @returns {string} - The embedding as a PostgreSQL vector string
 */
const generateOpenAIEmbedding = async (text) => {
  // Placeholder for actual API call
  // In a real implementation, this would call the OpenAI API
  logger.info('Generating OpenAI embedding');
  
  // This is where you'd make the actual API call
  // const response = await openai.createEmbedding({
  //   model: "text-embedding-ada-002",
  //   input: text,
  // });
  
  // return `[${response.data.data[0].embedding.join(',')}]`;
  
  // For now, return a mock embedding
  return generateMockEmbedding(text);
};

/**
 * Generate an Anthropic embedding (to be replaced with actual API call)
 * 
 * @param {string} text - The text to generate an embedding for
 * @returns {string} - The embedding as a PostgreSQL vector string
 */
const generateAnthropicEmbedding = async (text) => {
  // Placeholder for actual API call
  // In a real implementation, this would call the Anthropic API
  logger.info('Generating Anthropic embedding');
  
  // This is where you'd make the actual API call
  // const response = await anthropic.embeddings.create({
  //   model: "claude-3-sonnet-20240229",
  //   input: text,
  // });
  
  // return `[${response.data.embedding.join(',')}]`;
  
  // For now, return a mock embedding
  return generateMockEmbedding(text);
};

/**
 * Add a memory to the database
 * 
 * @param {string} conversationId - Unique identifier for the conversation
 * @param {string} userId - Identifier for the user
 * @param {string} content - The content of the memory
 * @param {Object} metadata - Additional metadata for the memory
 * @returns {number} - The ID of the created memory
 */
export const addMemory = async (conversationId, userId, content, metadata = {}) => {
  try {
    logger.info(`Adding memory for conversation ${conversationId}`);
    
    // Generate an embedding for the content
    const embedding = await generateEmbedding(content);
    
    // Insert the memory into the database
    const result = await query(`
      INSERT INTO memory.conversations 
        (conversation_id, user_id, content, embedding, metadata)
      VALUES 
        ($1, $2, $3, $4, $5)
      RETURNING id
    `, [
      conversationId, 
      userId, 
      content, 
      embedding, 
      metadata
    ]);
    
    const memoryId = result.rows[0].id;
    logger.info(`Memory added with ID: ${memoryId}`);
    
    return memoryId;
  } catch (error) {
    logger.error('Error adding memory:', error);
    throw error;
  }
};

/**
 * Search for memories by similarity
 * 
 * @param {string} queryText - The text to search for
 * @param {number} limit - Maximum number of results to return
 * @param {string} userId - Optional user ID to filter by
 * @param {string} conversationId - Optional conversation ID to filter by
 * @returns {Array} - Array of memory objects
 */
export const searchMemories = async (queryText, limit = 5, userId = null, conversationId = null) => {
  try {
    logger.info(`Searching memories similar to: "${queryText.substring(0, 50)}..."`);
    
    // Generate an embedding for the query text
    const queryEmbedding = await generateEmbedding(queryText);
    
    // Build the SQL query with optional filters
    let sql = `
      SELECT 
        id, 
        conversation_id, 
        user_id,
        content, 
        timestamp,
        metadata,
        embedding <=> $1 as similarity
      FROM memory.conversations
      WHERE is_archived = FALSE
    `;
    
    const params = [queryEmbedding];
    let paramIndex = 2;
    
    // Add filters if provided
    if (userId) {
      sql += ` AND user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }
    
    if (conversationId) {
      sql += ` AND conversation_id = $${paramIndex}`;
      params.push(conversationId);
      paramIndex++;
    }
    
    // Add ordering and limit
    sql += `
      ORDER BY similarity ASC
      LIMIT $${paramIndex}
    `;
    params.push(limit);
    
    // Execute the query
    const result = await query(sql, params);
    
    // Update last_accessed timestamp for retrieved memories
    if (result.rows.length > 0) {
      const ids = result.rows.map(row => row.id);
      await query(`
        UPDATE memory.conversations
        SET last_accessed = NOW()
        WHERE id = ANY($1)
      `, [ids]);
    }
    
    logger.info(`Found ${result.rows.length} similar memories`);
    return result.rows;
  } catch (error) {
    logger.error('Error searching memories:', error);
    throw error;
  }
};

/**
 * Get all memories for a specific conversation
 * 
 * @param {string} conversationId - The conversation ID to get memories for
 * @returns {Array} - Array of memory objects
 */
export const getConversationMemories = async (conversationId) => {
  try {
    logger.info(`Getting memories for conversation ${conversationId}`);
    
    const result = await query(`
      SELECT 
        id, 
        user_id,
        content, 
        timestamp,
        metadata
      FROM memory.conversations
      WHERE conversation_id = $1
        AND is_archived = FALSE
      ORDER BY timestamp ASC
    `, [conversationId]);
    
    logger.info(`Found ${result.rows.length} memories for conversation ${conversationId}`);
    
    // Update last_accessed timestamp for retrieved memories
    if (result.rows.length > 0) {
      const ids = result.rows.map(row => row.id);
      await query(`
        UPDATE memory.conversations
        SET last_accessed = NOW()
        WHERE id = ANY($1)
      `, [ids]);
    }
    
    return result.rows;
  } catch (error) {
    logger.error(`Error getting memories for conversation ${conversationId}:`, error);
    throw error;
  }
};

/**
 * Delete a memory by ID
 * 
 * @param {number} id - The ID of the memory to delete
 * @returns {boolean} - True if the memory was deleted
 */
export const deleteMemory = async (id) => {
  try {
    logger.info(`Deleting memory ${id}`);
    
    const result = await query(`
      DELETE FROM memory.conversations
      WHERE id = $1
      RETURNING id
    `, [id]);
    
    const deleted = result.rows.length > 0;
    logger.info(deleted ? `Memory ${id} deleted` : `Memory ${id} not found`);
    
    return deleted;
  } catch (error) {
    logger.error(`Error deleting memory ${id}:`, error);
    throw error;
  }
};

/**
 * Archive memories older than a certain number of days
 * 
 * @param {number} daysToKeep - Number of days to keep memories before archiving
 * @returns {number} - Number of memories archived
 */
export const archiveOldMemories = async (daysToKeep = 90) => {
  try {
    logger.info(`Archiving memories older than ${daysToKeep} days`);
    
    const result = await query(`
      SELECT memory.archive_old_memories($1) as archived_count
    `, [daysToKeep]);
    
    const archivedCount = result.rows[0].archived_count;
    logger.info(`Archived ${archivedCount} memories`);
    
    return archivedCount;
  } catch (error) {
    logger.error(`Error archiving old memories:`, error);
    throw error;
  }
};

/**
 * Optimize the vector index for better performance
 * 
 * @returns {boolean} - True if optimization was successful
 */
export const optimizeVectorIndex = async () => {
  try {
    logger.info('Optimizing vector index');
    
    await query(`
      SELECT memory.optimize_vector_index()
    `);
    
    logger.info('Vector index optimization completed');
    return true;
  } catch (error) {
    logger.error('Error optimizing vector index:', error);
    throw error;
  }
};

export default {
  addMemory,
  searchMemories,
  getConversationMemories,
  deleteMemory,
  archiveOldMemories,
  optimizeVectorIndex,
  generateEmbedding
};
