import { query } from '../db/client.js';
import { logger } from '../utils/logger.js';
import { generateEmbedding } from './embedding-service.js';

/**
 * Add a memory to the database
 * 
 * @param conversationId - Unique identifier for the conversation
 * @param userId - Identifier for the user
 * @param content - The content of the memory
 * @param metadata - Additional metadata for the memory
 * @returns The ID of the created memory
 */
export const addMemory = async (
  conversationId: string, 
  userId: string, 
  content: string, 
  metadata: any = {}
): Promise<number> => {
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
 * @param queryText - The text to search for
 * @param limit - Maximum number of results to return
 * @param userId - Optional user ID to filter by
 * @param conversationId - Optional conversation ID to filter by
 * @returns Array of memory objects
 */
export const searchMemories = async (
  queryText: string, 
  limit: number = 5, 
  userId: string | null = null, 
  conversationId: string | null = null
): Promise<any[]> => {
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
    
    const params: any[] = [queryEmbedding];
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
      const ids = result.rows.map((row: any) => row.id);
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
 * @param conversationId - The conversation ID to get memories for
 * @returns Array of memory objects
 */
export const getConversationMemories = async (conversationId: string): Promise<any[]> => {
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
      const ids = result.rows.map((row: any) => row.id);
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
 * @param id - The ID of the memory to delete
 * @returns True if the memory was deleted
 */
export const deleteMemory = async (id: number): Promise<boolean> => {
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
 * @param daysToKeep - Number of days to keep memories before archiving
 * @returns Number of memories archived
 */
export const archiveOldMemories = async (daysToKeep: number = 90): Promise<number> => {
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
 * @returns True if optimization was successful
 */
export const optimizeVectorIndex = async (): Promise<boolean> => {
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
