/**
 * Test script for the robust HTTP transport
 * 
 * This example demonstrates how to:
 * 1. Create and start the MCP server with the robust transport
 * 2. Connect a client to the server
 * 3. Send both valid and invalid messages to test error handling
 * 
 * Usage:
 *   node examples/test-robust-transport.js
 */

import http from 'http';
import { Server } from '../server/dist/typescript-sdk-wrapper.js';
import { logger } from '../server/dist/utils/logger.js';

// Configure server and client ports
const HOST = 'localhost';
const PORT = 3001;

// Create the server
const server = new Server({
  name: 'TestServer',
  version: '1.0.0'
});

// Create a simple client to test the server
class TestClient {
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this.connected = false;
  }
  
  async connect() {
    return new Promise((resolve, reject) => {
      // Make a POST request to establish connection
      const options = {
        hostname: this.host,
        port: this.port,
        path: '/',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json-stream'
        }
      };
      
      // Create the request
      this.req = http.request(options, (res) => {
        console.log(`Connected to server with status code: ${res.statusCode}`);
        this.connected = true;
        
        // Handle incoming data
        res.on('data', (chunk) => {
          try {
            const data = chunk.toString();
            console.log(`Received from server: ${data}`);
          } catch (error) {
            console.error('Error parsing server response:', error);
          }
        });
        
        // Handle connection close
        res.on('end', () => {
          console.log('Connection closed by server');
          this.connected = false;
        });
        
        resolve();
      });
      
      // Handle errors
      this.req.on('error', (error) => {
        console.error('Error connecting to server:', error);
        this.connected = false;
        reject(error);
      });
      
      // End the request
      this.req.end();
    });
  }
  
  async sendValidMessage() {
    if (!this.connected) {
      throw new Error('Not connected to server');
    }
    
    // Create a valid JSON-RPC message
    const validMessage = {
      jsonrpc: '2.0',
      method: 'ping',
      id: 1
    };
    
    // Send the message
    await this.sendRequest(validMessage);
    console.log('Valid message sent');
  }
  
  async sendInvalidMessage() {
    if (!this.connected) {
      throw new Error('Not connected to server');
    }
    
    // Create an invalid message (not JSON-RPC)
    const invalidMessage = 'This is not a valid JSON-RPC message';
    
    // Send the message
    await this.sendRequest(invalidMessage);
    console.log('Invalid message sent');
  }
  
  async sendMalformedJSON() {
    if (!this.connected) {
      throw new Error('Not connected to server');
    }
    
    // Create malformed JSON
    const malformedJSON = '{"jsonrpc":"2.0","method":"ping","id":1';
    
    // Send the message
    await this.sendRequest(malformedJSON);
    console.log('Malformed JSON sent');
  }
  
  async sendRequest(message) {
    return new Promise((resolve, reject) => {
      // Make a POST request to send the message
      const options = {
        hostname: this.host,
        port: this.port,
        path: '/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      // Create the request
      const req = http.request(options, (res) => {
        // Handle response
        res.on('data', (chunk) => {
          console.log(`Response: ${chunk.toString()}`);
        });
        
        res.on('end', () => {
          resolve();
        });
      });
      
      // Handle errors
      req.on('error', (error) => {
        console.error('Error sending message:', error);
        reject(error);
      });
      
      // Send the message
      if (typeof message === 'object') {
        req.write(JSON.stringify(message));
      } else {
        req.write(message);
      }
      
      req.end();
    });
  }
  
  disconnect() {
    if (this.req) {
      this.req.destroy();
      this.connected = false;
      console.log('Disconnected from server');
    }
  }
}

// Run the test
async function runTest() {
  try {
    console.log('Starting test of robust transport...');
    
    // Start the server
    console.log(`Starting server on ${HOST}:${PORT}...`);
    await server.listen(PORT, HOST);
    console.log('Server started');
    
    // Create and connect the client
    console.log('Creating test client...');
    const client = new TestClient(HOST, PORT);
    await client.connect();
    console.log('Client connected');
    
    // Test valid message
    console.log('\nTesting valid message...');
    await client.sendValidMessage();
    
    // Test invalid message - should be handled gracefully
    console.log('\nTesting invalid message (should be handled gracefully)...');
    await client.sendInvalidMessage();
    
    // Test malformed JSON - should be handled gracefully
    console.log('\nTesting malformed JSON (should be handled gracefully)...');
    await client.sendMalformedJSON();
    
    // Disconnect client
    console.log('\nDisconnecting client...');
    client.disconnect();
    
    // Stop the server
    console.log('\nStopping server...');
    await server.close();
    console.log('Server stopped');
    
    console.log('\nTest completed successfully');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Ensure server is stopped
    try {
      await server.close();
    } catch (e) {
      // Ignore
    }
    
    // Exit process
    setTimeout(() => process.exit(0), 1000);
  }
}

// Run the test
runTest();
