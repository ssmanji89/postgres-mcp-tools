# Installation Guide for PostgreSQL MCP Tools

This guide covers installation and initial setup of the PostgreSQL MCP Tools, with special attention to the robust transport layer that ensures reliable communication with Claude and other MCP clients.

## Prerequisites

- Node.js 18.x or higher
- npm 7.x or higher
- PostgreSQL 13.x or higher with pgvector extension
- Docker (optional, for containerized setup)

## Installation Options

### Option 1: Global Installation

```bash
# Install globally
npm install -g postgres-mcp-tools
```

### Option 2: Local Installation

```bash
# Clone the repository
git clone https://github.com/ssmanji89/postgres-mcp-tools.git

# Navigate to the directory
cd postgres-mcp-tools

# Install dependencies
npm install
```

### Option 3: Docker Installation

```bash
# Pull and run with Docker Compose
docker-compose up -d
```

## Configuration

Create a `.env` file based on the `.env.example` with the following settings:

```
# PostgreSQL Connection
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=memory_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=memory_db

# Embedding Model
EMBEDDING_MODEL=mock  # Options: mock, openai, anthropic

# API Keys (if using openai or anthropic)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Server Configuration
MCP_SERVER_PORT=3000
HTTP_PORT=8080
```

## Running the Server

### Start the PostgreSQL database

If using the local PostgreSQL installation:

```bash
# Ensure PostgreSQL is running
# You may need to create the database and user first
```

If using Docker:

```bash
# Start PostgreSQL with pgvector
docker-compose up -d postgres
```

### Start the MCP Server

```bash
# Start the MCP server
npm run start-server
```

## Verifying the Installation

Run the transport test to verify proper functioning:

```bash
npm run test-transport
```

This script tests both valid and invalid message handling to ensure the robust transport layer is working correctly.

## Troubleshooting

If you encounter issues:

1. Check the logs for error messages
2. Verify PostgreSQL connection settings
3. Ensure the pgvector extension is installed
4. Verify ports 3000 and 8080 are available

### Common Issues

#### JSON Parsing Errors

If you see errors like "Not valid JSON", this typically indicates that plain text log messages are being mixed with JSON-RPC protocol messages. The robust transport layer added in version 1.0.10 should handle these gracefully, but you may need to update to the latest version:

```bash
npm update postgres-mcp-tools
```

#### Connection Issues

If Claude cannot connect to the MCP server:

1. Verify the server is running (`npm run health-check`)
2. Check firewall settings allowing connections on the configured ports
3. Ensure the correct host/port is configured in Claude
4. Verify network connectivity between Claude and the MCP server

## Integration with Claude Desktop

For detailed instructions on integrating with Claude Desktop, see [CLAUDE_DESKTOP_SETUP.md](../CLAUDE_DESKTOP_SETUP.md).

## Next Steps

Once installation is complete, your PostgreSQL MCP server should be handling communication with Claude properly, including the robust handling of non-JSON messages that might otherwise cause crashes.

For more detailed documentation on the robust transport layer, see [ROBUST_TRANSPORT.md](ROBUST_TRANSPORT.md).
