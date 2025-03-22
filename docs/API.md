# API Reference

This document provides a comprehensive API reference for PostgreSQL MCP Tools.

## MCP Server API

The MCP server implements the Model Context Protocol (MCP) specified by Anthropic.

### Server Initialization

```javascript
// Import the Server class
import { Server } from 'postgres-memory-mcp';

// Initialize the server with resources and tools
const server = new Server({
  resources: [memoryResource],
  tools: [memoryManagementTool],
  capabilities: {
    resources: { subscribe: true },
    tools: { listChanged: true }
  }
});

// Start the server
server.listen(3000, 'localhost');
```

### Resource API

Resources provide Claude with access to external data sources. The Memory Resource implements the following methods:

#### `memoryResource.processMessage(message, requestMetadata)`

Processes and stores a new message in the memory system.

**Parameters:**
- `message` (object): The message object containing text content
- `requestMetadata` (object): Metadata including conversation ID and user information

**Returns:**
- `Promise<void>`

#### `memoryResource.getContext(message, requestMetadata)`

Retrieves relevant context based on the current message.

**Parameters:**
- `message` (object): The message object to find context for
- `requestMetadata` (object): Metadata including conversation ID and user information

**Returns:**
- `Promise<Array>`: Array of relevant memory objects

### Tool API

Tools allow Claude to perform specific operations. The Memory Management Tool provides the following operations:

#### `memoryManagementTool.invoke(params, requestMetadata)`

Invokes a memory management operation.

**Parameters:**
- `params` (object): Operation parameters
  - `operation` (string): The operation to perform (e.g., "list", "archive", "optimize", "delete")
  - Additional parameters specific to each operation
- `requestMetadata` (object): Metadata including conversation ID and user information

**Returns:**
- `Promise<object>`: Operation result

Example invocation from Claude:
```
Use the memory_management tool to list memories in our current conversation.
```

## Core Library API

The core library provides programmatic access to the memory system.

### Memory Management

#### `addMemory(conversationId, userId, content, metadata)`

Adds a new memory to the system.

**Parameters:**
- `conversationId` (string): Unique identifier for the conversation
- `userId` (string): Identifier for the user
- `content` (string): The text content to store
- `metadata` (object, optional): Additional metadata for the memory

**Returns:**
- `Promise<number>`: The ID of the newly created memory

**Example:**
```javascript
import { addMemory } from 'postgres-memory-mcp';

const memoryId = await addMemory(
  'conversation-123',
  'user-456',
  'User asked about PostgreSQL vector search capabilities',
  { 
    timestamp: new Date().toISOString(),
    context: 'technical-question'
  }
);
```

#### `searchMemories(queryText, options)`

Searches for memories similar to the provided query text.

**Parameters:**
- `queryText` (string): The text to search for
- `options` (object, optional): Search options
  - `limit` (number, optional): Maximum number of results to return (default: 5)
  - `userId` (string, optional): Filter results by user ID
  - `conversationId` (string, optional): Filter results by conversation ID
  - `threshold` (number, optional): Similarity threshold (0.0-1.0, default: 0.7)
  - `excludeArchived` (boolean, optional): Whether to exclude archived memories (default: true)

**Returns:**
- `Promise<Array>`: Array of memory objects ordered by similarity

**Example:**
```javascript
import { searchMemories } from 'postgres-memory-mcp';

// Search across all conversations
const globalResults = await searchMemories('PostgreSQL vector search', {
  limit: 10,
  threshold: 0.8
});

// Search within a specific conversation
const conversationResults = await searchMemories('PostgreSQL vector search', {
  limit: 5,
  conversationId: 'conversation-123',
  excludeArchived: false
});
```

#### `getConversationMemories(conversationId, options)`

Retrieves all memories for a specific conversation.

**Parameters:**
- `conversationId` (string): The conversation ID to get memories for
- `options` (object, optional): Retrieval options
  - `limit` (number, optional): Maximum number of results to return
  - `offset` (number, optional): Number of results to skip
  - `excludeArchived` (boolean, optional): Whether to exclude archived memories (default: true)
  - `orderBy` (string, optional): Field to order by (default: 'created_at')
  - `orderDirection` (string, optional): Order direction ('asc' or 'desc', default: 'desc')

**Returns:**
- `Promise<Array>`: Array of memory objects

**Example:**
```javascript
import { getConversationMemories } from 'postgres-memory-mcp';

// Get the 20 most recent memories
const memories = await getConversationMemories('conversation-123', {
  limit: 20,
  orderBy: 'created_at',
  orderDirection: 'desc'
});
```

#### `deleteMemory(id)`

Deletes a specific memory by ID.

**Parameters:**
- `id` (number): The ID of the memory to delete

**Returns:**
- `Promise<boolean>`: True if the memory was deleted, false if not found

**Example:**
```javascript
import { deleteMemory } from 'postgres-memory-mcp';

const deleted = await deleteMemory(123);
```

#### `archiveMemory(id)`

Archives a specific memory by ID.

**Parameters:**
- `id` (number): The ID of the memory to archive

**Returns:**
- `Promise<boolean>`: True if the memory was archived, false if not found

**Example:**
```javascript
import { archiveMemory } from 'postgres-memory-mcp';

const archived = await archiveMemory(123);
```

#### `archiveOldMemories(daysToKeep)`

Archives memories older than the specified number of days.

**Parameters:**
- `daysToKeep` (number, optional): Number of days to keep memories before archiving (default: 90)

**Returns:**
- `Promise<number>`: Number of memories archived

**Example:**
```javascript
import { archiveOldMemories } from 'postgres-memory-mcp';

// Archive memories older than 30 days
const archivedCount = await archiveOldMemories(30);
```

#### `optimizeVectorIndex()`

Optimizes the vector index for better performance.

**Returns:**
- `Promise<boolean>`: True if optimization was successful

**Example:**
```javascript
import { optimizeVectorIndex } from 'postgres-memory-mcp';

await optimizeVectorIndex();
```

### Embedding Service

#### `generateEmbedding(text)`

Generates a vector embedding for the provided text.

**Parameters:**
- `text` (string): The text to generate an embedding for

**Returns:**
- `Promise<Float32Array>`: The embedding vector

**Example:**
```javascript
import { generateEmbedding } from 'postgres-memory-mcp';

const embedding = await generateEmbedding('How do vector embeddings work?');
```

#### `compareEmbeddings(embedding1, embedding2)`

Compares two embeddings and returns their similarity.

**Parameters:**
- `embedding1` (Float32Array): First embedding
- `embedding2` (Float32Array): Second embedding

**Returns:**
- `number`: Cosine similarity (0.0-1.0)

**Example:**
```javascript
import { generateEmbedding, compareEmbeddings } from 'postgres-memory-mcp';

const embedding1 = await generateEmbedding('PostgreSQL vector search');
const embedding2 = await generateEmbedding('Vector similarity in databases');

const similarity = compareEmbeddings(embedding1, embedding2);
console.log(`Similarity: ${similarity}`); // e.g., 0.87
```

### Database Management

#### `initializeDatabase()`

Initializes the database, creating necessary tables and indexes.

**Returns:**
- `Promise<boolean>`: True if initialization was successful

**Example:**
```javascript
import { initializeDatabase } from 'postgres-memory-mcp';

await initializeDatabase();
```

#### `healthCheck()`

Checks the health of the database connection.

**Returns:**
- `Promise<object>`: Health status with connection state and stats

**Example:**
```javascript
import { healthCheck } from 'postgres-memory-mcp';

const health = await healthCheck();
console.log(`Database health: ${health.isHealthy ? 'Good' : 'Bad'}`);
console.log(`Connection pool: ${health.stats.totalConnections} total, ${health.stats.idleConnections} idle`);
```

## Configuration API

### `configure(options)`

Configures the PostgreSQL MCP Tools library.

**Parameters:**
- `options` (object): Configuration options
  - `embeddingModel` (string): Embedding model to use ('openai', 'anthropic', or 'mock')
  - `openaiApiKey` (string, conditional): OpenAI API key if using OpenAI embeddings
  - `anthropicApiKey` (string, conditional): Anthropic API key if using Anthropic embeddings
  - `pgHost` (string, optional): PostgreSQL host (default: 'localhost')
  - `pgPort` (number, optional): PostgreSQL port (default: 5432)
  - `pgUser` (string, optional): PostgreSQL username (default: 'memory_user')
  - `pgPassword` (string, optional): PostgreSQL password
  - `pgDatabase` (string, optional): PostgreSQL database name (default: 'memory_db')
  - `pgPoolMin` (number, optional): Minimum pool size (default: 2)
  - `pgPoolMax` (number, optional): Maximum pool size (default: 10)
  - `port` (number, optional): MCP server port (default: 3000)
  - `logLevel` (string, optional): Logging level (default: 'info')

**Returns:**
- `object`: The current configuration

**Example:**
```javascript
import { configure } from 'postgres-memory-mcp';

configure({
  embeddingModel: 'openai',
  openaiApiKey: process.env.OPENAI_API_KEY,
  pgHost: 'postgres.example.com',
  pgPort: 5432,
  pgUser: 'app_user',
  pgPassword: process.env.DB_PASSWORD,
  pgDatabase: 'memory_db',
  pgPoolMax: 20,
  logLevel: 'debug'
});
```

## SQL Database API

PostgreSQL MCP Tools creates the following database schema:

### Tables

#### `memories`

Stores conversation memories with vector embeddings.

```sql
CREATE TABLE memories (
  id SERIAL PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived BOOLEAN DEFAULT FALSE
);
```

#### `memory_archive`

Stores archived memories.

```sql
CREATE TABLE memory_archive (
  id SERIAL PRIMARY KEY,
  original_id INTEGER,
  conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB,
  created_at TIMESTAMP,
  archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Functions

#### `memory.archive_old_memories(days_to_keep INTEGER)`

Archives memories older than the specified number of days.

**Parameters:**
- `days_to_keep` (INTEGER): Number of days to keep memories before archiving

**Returns:**
- (INTEGER): Number of memories archived

**Example:**
```sql
SELECT memory.archive_old_memories(30);
```

#### `memory.optimize_vector_index()`

Optimizes the vector index for better performance.

**Returns:**
- (VOID)

**Example:**
```sql
SELECT memory.optimize_vector_index();
```

#### `memory.search_similar(query_embedding VECTOR, similarity_threshold FLOAT, limit_count INTEGER)`

Searches for memories similar to the provided embedding.

**Parameters:**
- `query_embedding` (VECTOR): The query embedding
- `similarity_threshold` (FLOAT): Minimum similarity threshold (0.0-1.0)
- `limit_count` (INTEGER): Maximum number of results to return

**Returns:**
- Table with memory records and similarity scores

**Example:**
```sql
SELECT * FROM memory.search_similar(
  '[-0.01, 0.02, ...]'::vector,
  0.7,
  5
);
```

## Command Line Interface

The package provides a command-line interface for starting the MCP server.

### `postgres-memory-mcp`

Starts the PostgreSQL MCP Tools server.

**Options:**
- `--config <json>`: JSON configuration string
- `--config-file <path>`: Path to JSON configuration file
- `--port <number>`: Server port (default: 3000)
- `--host <string>`: Server host (default: 'localhost')
- `--log-level <string>`: Logging level (default: 'info')

**Example:**
```bash
# Start with inline config
postgres-memory-mcp --config '{"embeddingModel":"mock","pgHost":"localhost"}'

# Start with config file
postgres-memory-mcp --config-file ./config.json

# Start with specific port
postgres-memory-mcp --port 4000 --log-level debug
```

### Environment Variables

The server can also be configured using environment variables:

```bash
EMBEDDING_MODEL=openai
OPENAI_API_KEY=your-api-key
PG_HOST=localhost
PG_PORT=5432
PG_USER=memory_user
PG_PASSWORD=memory_password
PG_DATABASE=memory_db
PORT=3000
LOG_LEVEL=info
```

To start the server with environment variables:

```bash
# Load variables from .env file
postgres-memory-mcp

# Or set inline
EMBEDDING_MODEL=mock PG_HOST=localhost postgres-memory-mcp
```
