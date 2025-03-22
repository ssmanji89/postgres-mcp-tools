# Architecture Overview

This document provides a detailed overview of the architecture of PostgreSQL MCP Tools.

## System Architecture

PostgreSQL MCP Tools consists of several key components:

1. **MCP Server**: Implements the Model Context Protocol to communicate with Claude
2. **Vector Database**: PostgreSQL with pgvector for semantic search
3. **Embedding Service**: Converts text to vector embeddings
4. **Memory Service**: Manages memory storage and retrieval
5. **CLI Interface**: Command-line interface for configuration and execution

### Architecture Diagram

```
┌─────────────┐      ┌─────────────┐      ┌─────────────────────┐
│             │      │             │      │                     │
│   Claude    │◄────►│  MCP Server │◄────►│  Memory Service     │
│             │      │             │      │                     │
└─────────────┘      └──────┬──────┘      └──────────┬──────────┘
                            │                         │
                            │                         │
                            ▼                         ▼
                     ┌─────────────┐          ┌───────────────┐
                     │             │          │               │
                     │  Embedding  │          │  PostgreSQL   │
                     │  Service    │          │  + pgvector   │
                     │             │          │               │
                     └─────────────┘          └───────────────┘
```

## Component Details

### MCP Server

The MCP Server is the main interface for Claude to access the memory system. It implements:

- **Server**: Handles HTTP/WebSocket connections from Claude
- **Resources**: Provides access to memory resources
- **Tools**: Implements memory management tools

The server is built using the Anthropic Model Context Protocol TypeScript SDK.

### Vector Database

PostgreSQL with the pgvector extension provides:

- **Vector Storage**: Stores embedding vectors efficiently
- **Vector Search**: Performs similarity search operations
- **Metadata Storage**: Stores additional context and metadata

### Embedding Service

The Embedding Service converts text to vector representations using:

- **OpenAI Embeddings**: High-quality embeddings using OpenAI's API
- **Anthropic Embeddings**: Claude-optimized embeddings
- **Mock Embeddings**: Deterministic embeddings for testing

### Memory Service

The Memory Service handles:

- **Memory Storage**: Saves conversation context
- **Memory Retrieval**: Fetches relevant memories
- **Archive Management**: Manages older memories

### CLI Interface

The CLI provides:

- **Configuration**: Sets up connection and embedding options
- **Server Control**: Starts and manages the MCP server
- **Database Setup**: Initializes the PostgreSQL database

## Data Flow

1. **Memory Storage Flow**:
   - Claude sends messages to the MCP server
   - Messages are processed through the Memory Resource
   - Text is converted to embeddings
   - Embeddings and metadata are stored in PostgreSQL

2. **Memory Retrieval Flow**:
   - Claude sends a query to the MCP server
   - Query is converted to an embedding
   - Similar vectors are retrieved from PostgreSQL
   - Relevant memories are returned to Claude

3. **Memory Management Flow**:
   - Claude calls the Memory Management Tool
   - Tool processes the request
   - Operations are performed on the database
   - Results are returned to Claude

## Database Schema

The primary database schema consists of:

### Memories Table

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

### Indexes

```sql
CREATE INDEX ON memories (conversation_id);
CREATE INDEX ON memories (user_id);
CREATE INDEX ON memories (created_at);
CREATE INDEX ON memories (archived);
CREATE INDEX vector_idx ON memories USING ivfflat (embedding vector_cosine_ops);
```

## Implementation

The system is implemented in:

- **Server**: TypeScript for the MCP server implementation
- **Database Interface**: Node.js with pg for PostgreSQL interaction
- **Embedding**: API clients for OpenAI and Anthropic
- **CLI**: Node.js command-line interface

## Configuration

The system can be configured through:

- **Environment Variables**: For server deployment
- **JSON Configuration**: For Claude Desktop integration
- **Command-Line Arguments**: For direct execution

## Security Considerations

- **API Keys**: Securely stored, never logged
- **Database Credentials**: Managed through environment variables
- **Limited Permissions**: Read-only database access where possible
- **Input Validation**: Sanitized inputs to prevent injection attacks

## Performance Considerations

- **Connection Pooling**: Optimized database connections
- **Embedding Caching**: Avoid redundant embedding generation
- **Vector Index Optimization**: Regularly maintained for performance
- **Query Optimization**: Efficient vector search parameters

## Extension Points

The architecture is designed to be extensible:

- **Custom Resources**: Add new MCP resources
- **Additional Tools**: Extend with new MCP tools
- **Embedding Models**: Support for additional embedding providers
- **Database Backends**: Potential for alternative vector databases
