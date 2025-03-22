import { Tool } from '../typescript-sdk-wrapper.js';
import { logger } from '../utils/logger.js';
import { archiveOldMemories, optimizeVectorIndex, getConversationMemories, deleteMemory } from '../services/memory-service.js';

/**
 * Tool for managing memories in the system
 */
export class MemoryManagementTool implements Tool {
  // Tool name as required by MCP
  readonly name = 'memory_management';
  
  // Tool description
  readonly description = 'Manage memory operations like archiving old memories, optimizing indexes, or deleting specific memories';
  
  // Tool parameters schema
  readonly parameters = {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['archive', 'optimize', 'list', 'delete'],
        description: 'The operation to perform on memories'
      },
      days_to_keep: {
        type: 'number',
        description: 'For archive operations, number of days to keep memories before archiving'
      },
      conversation_id: {
        type: 'string',
        description: 'For list operations, the conversation ID to list memories for'
      },
      memory_id: {
        type: 'number',
        description: 'For delete operations, the ID of the memory to delete'
      }
    },
    required: ['operation']
  };
  
  /**
   * Execute the tool with provided parameters
   * @param params The parameters for the tool
   * @returns The result of the operation
   */
  async execute(params: any): Promise<any> {
    try {
      const { operation } = params;
      
      switch (operation) {
        case 'archive':
          return this.archiveMemories(params);
        
        case 'optimize':
          return this.optimizeIndex();
        
        case 'list':
          return this.listMemories(params);
        
        case 'delete':
          return this.deleteMemory(params);
        
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      logger.error('Error executing memory management tool:', error);
      throw error;
    }
  }
  
  /**
   * Archive old memories
   * @param params The parameters for archiving
   * @returns Result of the archive operation
   */
  private async archiveMemories(params: any): Promise<any> {
    const daysToKeep = params.days_to_keep || 90;
    
    const archivedCount = await archiveOldMemories(daysToKeep);
    
    return {
      status: 'success',
      operation: 'archive',
      archived_count: archivedCount,
      message: `Successfully archived ${archivedCount} memories older than ${daysToKeep} days`
    };
  }
  
  /**
   * Optimize the vector index
   * @returns Result of the optimization operation
   */
  private async optimizeIndex(): Promise<any> {
    await optimizeVectorIndex();
    
    return {
      status: 'success',
      operation: 'optimize',
      message: 'Successfully optimized vector index'
    };
  }
  
  /**
   * List memories for a conversation
   * @param params The parameters for listing memories
   * @returns List of memories
   */
  private async listMemories(params: any): Promise<any> {
    const { conversation_id } = params;
    
    if (!conversation_id) {
      throw new Error('conversation_id is required for list operation');
    }
    
    const memories = await getConversationMemories(conversation_id);
    
    return {
      status: 'success',
      operation: 'list',
      conversation_id,
      memories_count: memories.length,
      memories
    };
  }
  
  /**
   * Delete a specific memory
   * @param params The parameters for deleting a memory
   * @returns Result of the delete operation
   */
  private async deleteMemory(params: any): Promise<any> {
    const { memory_id } = params;
    
    if (!memory_id) {
      throw new Error('memory_id is required for delete operation');
    }
    
    const deleted = await deleteMemory(memory_id);
    
    if (!deleted) {
      return {
        status: 'error',
        operation: 'delete',
        message: `Memory with ID ${memory_id} not found`
      };
    }
    
    return {
      status: 'success',
      operation: 'delete',
      memory_id,
      message: `Successfully deleted memory with ID ${memory_id}`
    };
  }
}
