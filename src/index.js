import dotenv from 'dotenv';
import {
  addMemory,
  searchMemories,
  getConversationMemories,
  deleteMemory,
  archiveOldMemories,
  optimizeVectorIndex,
  generateEmbedding
} from './memory/index.js';
import { logger } from './utils/logger.js';
import { healthCheck } from './utils/db.js';

// Load environment variables
dotenv.config();

// Export all primary functions
export {
  addMemory,
  searchMemories,
  getConversationMemories,
  deleteMemory,
  archiveOldMemories,
  optimizeVectorIndex,
  generateEmbedding,
  healthCheck,
  logger
};

// Main function for direct execution
const main = async () => {
  try {
    logger.info('PostgreSQL Memory Tools starting up...');
    
    // Check database connection
    const isHealthy = await healthCheck();
    if (!isHealthy) {
      logger.error('Database health check failed. Exiting.');
      process.exit(1);
    }
    
    logger.info('Database connection successful.');
    logger.info('PostgreSQL Memory Tools ready for use.');
    
    // If invoked directly, run a simple demonstration
    if (process.argv[2] === '--demo') {
      await runDemo();
    }
  } catch (error) {
    logger.error('Error during startup:', error);
    process.exit(1);
  }
};

// Simple demonstration function
const runDemo = async () => {
  try {
    const conversationId = `demo-${Date.now()}`;
    const userId = 'demo-user';
    
    logger.info('POSTGRESQL MEMORY SYSTEM DEMO');
    logger.info('=============================');
    
    // Add a test memory
    logger.info('Adding test memory...');
    await addMemory(
      conversationId,
      userId,
      'User: What are vector embeddings?\nAI: Vector embeddings are numerical representations of text that capture semantic meaning.',
      { context: 'technical explanation' }
    );
    
    // Search for similar memories
    logger.info('Searching for similar memories...');
    const searchResults = await searchMemories('How do vector embeddings work?', 3);
    
    logger.info(`Found ${searchResults.length} similar memories:`);
    searchResults.forEach((memory, index) => {
      logger.info(`${index + 1}. [${memory.similarity.toFixed(4)}] ${memory.content.substring(0, 100)}...`);
    });
    
    // Get all memories for the conversation
    logger.info('Getting all memories for the conversation...');
    const conversationMemories = await getConversationMemories(conversationId);
    
    logger.info(`Found ${conversationMemories.length} memories for conversation ${conversationId}`);
    
    logger.info('Demo completed');
  } catch (error) {
    logger.error('Error running demo:', error);
  }
};

// Run the main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default {
  addMemory,
  searchMemories,
  getConversationMemories,
  deleteMemory,
  archiveOldMemories,
  optimizeVectorIndex,
  generateEmbedding,
  healthCheck,
  logger
};
