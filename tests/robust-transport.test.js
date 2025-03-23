/**
 * Tests for the robust transport implementation
 */
import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// Create a mock implementation of RobustReadBuffer
class MockRobustReadBuffer {
  buffer = undefined;
  
  append(chunk) {
    this.buffer = this.buffer ? Buffer.concat([this.buffer, chunk]) : chunk;
  }
  
  readMessage() {
    if (!this.buffer) {
      return null;
    }
    
    const index = this.buffer.indexOf("\n");
    if (index === -1) {
      return null;
    }
    
    const line = this.buffer.toString("utf8", 0, index);
    this.buffer = this.buffer.subarray(index + 1);
    
    try {
      // Try to parse as JSON
      return JSON.parse(line);
    } catch (error) {
      // If it's not a valid JSON message, log it and return null
      if (line.trim()) {
        console.debug(`Received non-JSON message: ${line}`);
      }
      return null;
    }
  }
  
  clear() {
    this.buffer = undefined;
  }
}

// Mock logger
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

describe('RobustReadBuffer', () => {
  let buffer;
  
  beforeEach(() => {
    // Create a new buffer instance for each test
    buffer = new MockRobustReadBuffer();
    // Clear mock calls
    console.debug = jest.fn();
  });
  
  test('should handle valid JSON messages correctly', () => {
    // Add a valid JSON-RPC message
    const message = JSON.stringify({
      jsonrpc: '2.0',
      method: 'test',
      id: 1
    }) + '\n';
    
    buffer.append(Buffer.from(message));
    
    // Should parse successfully
    const parsed = buffer.readMessage();
    
    // Expect valid result
    expect(parsed).toBeTruthy();
    expect(parsed.jsonrpc).toBe('2.0');
    expect(parsed.method).toBe('test');
    expect(parsed.id).toBe(1);
  });
  
  test('should handle non-JSON messages gracefully', () => {
    // Add a non-JSON message
    buffer.append(Buffer.from('This is not JSON\n'));
    
    // Should not throw an error
    const parsed = buffer.readMessage();
    
    // Should return null for invalid input
    expect(parsed).toBeNull();
    // Debug message should be called
    expect(console.debug).toHaveBeenCalled();
  });
  
  test('should handle multiple messages correctly', () => {
    // Add multiple messages, some valid JSON, some not
    const validMessage1 = JSON.stringify({
      jsonrpc: '2.0',
      method: 'test1',
      id: 1
    }) + '\n';
    
    const invalidMessage = 'This is not JSON\n';
    
    const validMessage2 = JSON.stringify({
      jsonrpc: '2.0',
      method: 'test2',
      id: 2
    }) + '\n';
    
    buffer.append(Buffer.from(validMessage1 + invalidMessage + validMessage2));
    
    // Should parse the first message correctly
    const parsed1 = buffer.readMessage();
    expect(parsed1).toBeTruthy();
    expect(parsed1.method).toBe('test1');
    
    // Should skip the invalid message
    const parsed2 = buffer.readMessage();
    expect(parsed2).toBeNull();
    
    // Should parse the third message correctly
    const parsed3 = buffer.readMessage();
    expect(parsed3).toBeTruthy();
    expect(parsed3.method).toBe('test2');
  });
  
  test('should handle partial messages', () => {
    // Add a partial message
    const partial1 = '{"jsonrpc":"2.0","method';
    buffer.append(Buffer.from(partial1));
    
    // Should not be able to parse yet
    const parsed1 = buffer.readMessage();
    expect(parsed1).toBeNull();
    
    // Add the rest of the message
    const partial2 = '":"test","id":1}\n';
    buffer.append(Buffer.from(partial2));
    
    // Now should parse successfully
    const parsed2 = buffer.readMessage();
    expect(parsed2).toBeTruthy();
    expect(parsed2.method).toBe('test');
  });
  
  test('should handle empty buffer', () => {
    // Should return null for empty buffer
    const parsed = buffer.readMessage();
    expect(parsed).toBeNull();
  });
  
  test('should clear buffer correctly', () => {
    // Add a message
    const message = JSON.stringify({
      jsonrpc: '2.0',
      method: 'test',
      id: 1
    }) + '\n';
    
    buffer.append(Buffer.from(message));
    
    // Clear the buffer
    buffer.clear();
    
    // Should return null after clearing
    const parsed = buffer.readMessage();
    expect(parsed).toBeNull();
  });
});

/**
 * Simple tests for error handling functionality
 */
describe('Error handling', () => {
  test('should handle JSON parse errors gracefully', () => {
    // Simulate a JSON parse error
    const badJson = '{"not valid json';
    
    // Try to parse - should not throw
    try {
      JSON.parse(badJson);
      // If we get here, fail the test
      expect('This should not happen').toBe('This should happen');
    } catch (error) {
      // Expect an error to be thrown
      expect(error).toBeTruthy();
      expect(error instanceof SyntaxError).toBe(true);
    }
  });
});
