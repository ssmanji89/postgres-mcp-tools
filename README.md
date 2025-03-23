# PostgreSQL MCP Tools

PostgreSQL-based memory system with vector search capabilities for AI applications, including MCP integration for Claude.

## Overview

This package provides a memory system built on PostgreSQL with pgvector that enables:

- Storage and retrieval of vectorized content for semantic search
- Persistent memory across sessions
- Integration with Claude through the Model Context Protocol (MCP)
- Support for multiple embedding models (OpenAI, Anthropic, or mock for testing)

## Installation

```bash
npm install -g postgres-mcp-tools
```

## Quick Start

### Start PostgreSQL

```bash
# Start PostgreSQL in Docker
docker-compose up -d postgres
```

### Start the MCP Server

```bash
# Start the MCP server
docker-compose up -d mcp-server
```

### Configure Claude Desktop

See [CLAUDE_DESKTOP_SETUP.md](CLAUDE_DESKTOP_SETUP.md) for detailed instructions.

## Features

- **Vector Search**: Store and search content using vector embeddings
- **Multiple Embedding Models**: Support for OpenAI, Anthropic, or mock embeddings
- **MCP Integration**: Connect directly to Claude via the Model Context Protocol
- **REST API**: Access memory programmatically through HTTP endpoints
- **Docker Support**: Run everything in containers for easy deployment

## Configuration

Configuration is managed through environment variables or command-line arguments:

- `POSTGRES_HOST`: PostgreSQL host (default: localhost)
- `POSTGRES_PORT`: PostgreSQL port (default: 5432)
- `POSTGRES_USER`: PostgreSQL username (default: memory_user)
- `POSTGRES_PASSWORD`: PostgreSQL password
- `POSTGRES_DB`: PostgreSQL database name (default: memory_db)
- `EMBEDDING_MODEL`: Embedding model to use: "openai", "anthropic", or "mock" (default: mock)
- `OPENAI_API_KEY`: OpenAI API key (if using OpenAI embeddings)
- `ANTHROPIC_API_KEY`: Anthropic API key (if using Anthropic embeddings)
- `MCP_SERVER_PORT`: MCP server port (default: 3000)
- `HTTP_PORT`: HTTP API port (default: 8080)

## Docker Setup

The easiest way to run PostgreSQL MCP Tools is using Docker:

```bash
# Start everything
docker-compose up -d

# Stop everything
docker-compose down
```

## Development

```bash
# Install dependencies
npm install

# Build the server
npm run build-server

# Run tests
npm test
```

## Claude Desktop Integration

As of version 1.0.9, PostgreSQL MCP Tools now properly integrates with Claude Desktop by ensuring all debug logs go to stderr instead of stdout, maintaining proper JSON-RPC protocol communication.

## License

MIT
