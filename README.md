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
# Install globally (preferred)
npm install -g postgres-mcp-tools

# If you encounter dependency errors, try:
npm install -g postgres-mcp-tools --force --no-save

# If you're still having issues, you can install from the GitHub repo:
git clone https://github.com/ssmanji89/postgres-mcp-tools.git
cd postgres-mcp-tools
npm install
npm run setup-mcp-sdk
npm link
```

## Quick Start

For detailed installation instructions including troubleshooting, see [INSTALLATION.md](docs/INSTALLATION.md).

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

### Test the Robust Transport

```bash
# Verify the robust transport functionality
npm run test-transport
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

# Install test dependencies
npm run update-deps

# Build the server
npm run build-server

# Run minimal tests (recommended)
npm run test:basic

# Run transport tests (may require configuration)
npm run test:transport
```

> **Note**: The test setup is configured for ESM compatibility in a primarily ESM project. If you encounter issues, try the alternate test configuration with `npm run test:alt`.

See [tests/README.md](tests/README.md) for more information on testing.

## Claude Desktop Integration

As of version 1.0.9, PostgreSQL MCP Tools now properly integrates with Claude Desktop by ensuring all debug logs go to stderr instead of stdout, maintaining proper JSON-RPC protocol communication.

### Latest Release: v1.0.11 (2025-03-23)

We've implemented a production-ready robust transport layer that handles non-JSON messages gracefully. This fixes issues where plain text log messages were causing the server to crash with JSON parsing errors.

Key improvements:
- Added error handling for non-JSON messages in the transport layer
- Implemented a robust HTTP transport that doesn't crash on invalid input
- Added global error handlers to prevent unhandled exceptions and rejections
- Improved logging to help diagnose issues
- Properly handles bidirectional communication with clients
- Maintains session information required by the MCP protocol
- Updated Claude Desktop configuration format for proper port settings

For detailed information about the robust transport implementation, see [ROBUST_TRANSPORT.md](docs/ROBUST_TRANSPORT.md).

If you previously experienced JSON parsing errors when starting the server, this update should resolve those issues.

See full [RELEASE_NOTES.md](RELEASE_NOTES.md) for all changes.

#### Upgrading to v1.0.11

If you're upgrading from a previous version, run:

```bash
# First, remove the old version
npm uninstall -g postgres-mcp-tools

# Then install the new version
npm install -g postgres-mcp-tools

# If you encounter dependency errors, try:
npm install -g postgres-mcp-tools --force --no-save

# Or install from the GitHub repo:
git clone https://github.com/ssmanji89/postgres-mcp-tools.git
cd postgres-mcp-tools
npm install
npm run setup-mcp-sdk
npm link
```

Then update your Claude Desktop configuration as described in [CLAUDE_DESKTOP_SETUP.md](CLAUDE_DESKTOP_SETUP.md) and restart the MCP server:

```bash
npm run start-server
```

## License

MIT
