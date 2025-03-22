import crypto from 'crypto';
import { logger } from '../utils/logger.js';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client if API key is available
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const anthropicClient = anthropicApiKey ? new Anthropic({ apiKey: anthropicApiKey }) : null;

/**
 * Generate an embedding for text content
 * 
 * @param text - The text to generate embeddings for
 * @returns The embedding as a PostgreSQL vector string
 */
export const generateEmbedding = async (text: string): Promise<string> => {
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
      if (!anthropicClient) {
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
 * @param text - The text to generate a mock embedding for
 * @returns The mock embedding as a PostgreSQL vector string
 */
const generateMockEmbedding = (text: string): string => {
  // Create a hash of the text to use as seed
  const hash = crypto.createHash('sha256').update(text).digest('hex');
  
  // Convert hash to an array of numbers
  const hashNums: number[] = [];
  for (let i = 0; i < hash.length; i += 2) {
    hashNums.push(parseInt(hash.substring(i, i + 2), 16) / 255);
  }
  
  // Expand the hash to the required size (1536 dimensions)
  const embedding: number[] = [];
  for (let i = 0; i < 1536; i++) {
    // Use a simple formula to generate a value between -1 and 1
    const val = Math.cos(i * (hashNums[i % hashNums.length] + 0.1)) * 0.99;
    embedding.push(val);
  }
  
  // Format as a pgvector string
  return `[${embedding.join(',')}]`;
};

/**
 * Generate an OpenAI embedding
 * 
 * @param text - The text to generate an embedding for
 * @returns The embedding as a PostgreSQL vector string
 */
const generateOpenAIEmbedding = async (text: string): Promise<string> => {
  logger.info('Generating OpenAI embedding');
  
  try {
    // Make the actual API call to OpenAI
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input: text
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }
    
    const responseData = await response.json();
    
    // Extract the embedding from the response
    const embedding = responseData.data[0].embedding;
    
    return `[${embedding.join(',')}]`;
  } catch (error) {
    logger.error('Error calling OpenAI API:', error);
    throw error;
  }
};

/**
 * Generate an Anthropic embedding
 * 
 * @param text - The text to generate an embedding for
 * @returns The embedding as a PostgreSQL vector string
 */
const generateAnthropicEmbedding = async (text: string): Promise<string> => {
  logger.info('Generating Anthropic embedding');
  
  if (!anthropicClient) {
    throw new Error('Anthropic client not initialized');
  }
  
  try {
    // Make the actual API call to Anthropic
    // Note: Directly using fetch since the SDK version might not have embeddings support
    const response = await fetch('https://api.anthropic.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey as string,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        input: text
      })
    });
    
    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }
    
    const responseData = await response.json();
    
    // Extract the embedding from the response
    const embedding = responseData.data[0].embedding;
    
    return `[${embedding.join(',')}]`;
  } catch (error) {
    logger.error('Error calling Anthropic API:', error);
    throw error;
  }
};
