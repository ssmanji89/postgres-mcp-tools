import { Resource } from '../typescript-sdk-wrapper.js';
import { MemoryResource } from './memory-resource.js';

/**
 * Register all MCP resources
 */
export const registerResources = (): Resource[] => {
  return [
    new MemoryResource(),
  ];
};
