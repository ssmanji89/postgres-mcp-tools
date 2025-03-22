import { Resource, Message, ContextItem } from '../typescript-sdk-wrapper.js';
import { searchMemories, addMemory } from '../services/memory-service.js';
import { logger } from '../utils/logger.js';

/**
 * Memory Resource for storing and retrieving memories via MCP
 */
export class MemoryResource implements Resource {
  // Resource name as required by MCP
  readonly name = 'memory';

  // Maximum messages to keep in the context
  private readonly maxContextItems = 10;

  /**
   * Process a new message and store it as a memory
   * @param message The message to process
   * @param requestMetadata Metadata from the request
   */
  async processMessage(message: Message, requestMetadata: any): Promise<void> {
    try {
      // Extract conversation ID from metadata, or generate one
      const conversationId = requestMetadata.conversationId || `conv-${Date.now()}`;
      const userId = requestMetadata.userId || 'anonymous';
      
      // Add the message to memory
      await addMemory(
        conversationId,
        userId,
        message.content,
        {
          role: message.role,
          timestamp: message.timestamp || new Date().toISOString(),
          metadata: requestMetadata
        }
      );
      
      logger.info(`Stored message from ${message.role} in conversation ${conversationId}`);
    } catch (error) {
      logger.error('Error processing message:', error);
      // We don't want to fail the model call if memory storage fails
    }
  }

  /**
   * Get relevant context items based on the current message
   * @param message The current message
   * @param requestMetadata Metadata from the request
   */
  async getContext(message: Message, requestMetadata: any): Promise<ContextItem[]> {
    try {
      // Extract conversation ID from metadata
      const conversationId = requestMetadata.conversationId;
      
      // If no conversation ID, return empty context
      if (!conversationId) {
        logger.warn('No conversation ID provided, cannot retrieve memories');
        return [];
      }
      
      // Search for similar memories
      const memories = await searchMemories(
        message.content,
        this.maxContextItems,
        null, // userId (optional)
        conversationId
      );
      
      // Convert memories to context items
      const contextItems = memories.map(memory => ({
        content: memory.content,
        metadata: {
          timestamp: memory.timestamp,
          similarity: memory.similarity,
          ...memory.metadata
        }
      }));
      
      logger.info(`Retrieved ${contextItems.length} memories for context`);
      return contextItems;
    } catch (error) {
      logger.error('Error getting context:', error);
      // Return empty context on error
      return [];
    }
  }
}
