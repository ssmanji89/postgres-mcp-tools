import { Tool } from '../typescript-sdk-wrapper.js';
import { MemoryManagementTool } from './memory-management-tool.js';

/**
 * Register all MCP tools
 */
export const registerTools = (): Tool[] => {
  return [
    new MemoryManagementTool(),
  ];
};
