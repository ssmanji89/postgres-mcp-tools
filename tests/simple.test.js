/**
 * Simple test file to ensure the Jest configuration is working
 */

// Use explicit import for Jest
import { describe, test, expect } from '@jest/globals';

describe('Basic functionality', () => {
  test('should pass a simple test', () => {
    expect(1 + 1).toBe(2);
  });
  
  test('should handle JSON parsing', () => {
    const json = '{"key": "value"}';
    const parsed = JSON.parse(json);
    expect(parsed.key).toBe('value');
  });
  
  test('should handle Buffer operations', () => {
    const buffer = Buffer.from('test');
    expect(buffer.toString()).toBe('test');
  });
});
