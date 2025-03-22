# PostgreSQL MCP Tools

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/postgres-memory-mcp.svg)](https://www.npmjs.com/package/postgres-memory-mcp)

A production-ready PostgreSQL-based memory system with vector embeddings for AI applications. Includes a Model Context Protocol (MCP) server implementation for seamless integration with Anthropic's Claude.

## Features

- 🚀 **Production-Ready:** Optimized PostgreSQL configuration with pgvector for vector similarity search
- 🔒 **Secure:** Environment-based configuration with secure defaults
- 🧠 **AI Integration:** Model Context Protocol (MCP) server implementation for Claude Desktop integration
- 📊 **Vector Search:** High-performance semantic search using vector embeddings
- 🐳 **Docker Support:** Simple deployment with Docker and Docker Compose
- 🔄 **Flexible:** Support for multiple embedding models including OpenAI and Anthropic
- 📝 **Complete Documentation:** Comprehensive guides and API documentation

## Quick Start

### Prerequisites

- [Claude Desktop](https://claude.ai/downloads) installed on your computer
- [Node.js](https://nodejs.org/) 18.0.0 or higher
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended for PostgreSQL)

### Installation

#### 1. Install the package globally

```bash
npm install -g postgres-mcp-tools
```

This will automatically:
- Generate a secure random password for PostgreSQL
- Create a `.env` file with the generated credentials
- Set up the necessary configuration

#### 2. Start PostgreSQL with Docker (recommended)

The easiest way to start is using the included Docker Compose file:

```bash
# Start with Docker Compose
cd node_modules/postgres-mcp-tools
docker-compose up -d
```

You can also run PostgreSQL manually if you prefer:

```bash
# Get the generated password from your .env file
PASSWORD=$(grep POSTGRES_PASSWORD .env | cut -d '=' -f2)

docker run -d \
  --name postgres-memory \
  -e POSTGRES_USER=memory_user \
  -e POSTGRES_PASSWORD=$PASSWORD \
  -e POSTGRES_DB=memory_db \
  -p 5432:5432 \
  ankane/pgvector
```

#### 3. Configure Claude Desktop

Find the appropriate configuration directory for your operating system:

**For macOS**:
```bash
mkdir -p ~/Library/Application\ Support/Claude/
```

**For Windows**:
```bash
mkdir -p %APPDATA%\Claude\
```

**For Linux**:
```bash
mkdir -p ~/.config/Claude/
```

Create or edit the configuration file:

**For macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**For Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**For Linux**: `~/.config/Claude/claude_desktop_config.json`

Add the following content:

```json
{
  "mcpServers": {
    "postgres_memory": {
      "command": "postgres-mcp-server",
      "args": [
        "--config",
        "{\"embeddingModel\":\"mock\",\"pgHost\":\"localhost\",\"pgPort\":5432,\"pgUser\":\"memory_user\",\"pgPassword\":\"YOUR_GENERATED_PASSWORD\",\"pgDatabase\":\"memory_db\"}"
      ]
    }
  }
}
```

Replace `YOUR_GENERATED_PASSWORD` with the password generated during installation (found in your `.env` file).

#### 4. Restart Claude Desktop

Fully exit Claude Desktop (quit from the system tray/menu bar) and restart it for the changes to take effect.

#### 5. Verify Installation

Once restarted, Claude Desktop should automatically connect to the PostgreSQL MCP server. You can verify this by asking Claude:

```
Can you check if the memory system is working properly?
```

Claude should respond indicating it has access to the memory system.

## Using Claude with Memory

Once set up, Claude will automatically:

1. **Store conversations** in the PostgreSQL database with vector embeddings
2. **Retrieve relevant memories** when you ask related questions
3. **Maintain context** across multiple conversations

### Testing Memory Functionality

Try these prompts to test if memory is working:

- "Please remember that my favorite color is blue"
- Later: "What's my favorite color?"
- "Let's discuss PostgreSQL vector search capabilities"
- Later: "What were we discussing earlier about databases?"

### Memory Management Commands

You can use Claude to manage memories directly:

- To list memories: "Use the memory_management tool to list the memories in our current conversation"
- To archive old memories: "Use the memory_management tool to archive memories older than 30 days"
- To optimize the vector index: "Use the memory_management tool to optimize the vector index"
- To delete a specific memory: "Use the memory_management tool to delete memory 123"

## Advanced Configuration

### Embedding Models

The system supports three embedding models:

1. **OpenAI** (recommended for production):
   ```json
   {
     "embeddingModel": "openai",
     "openaiApiKey": "your-openai-api-key"
   }
   ```

2. **Anthropic** (if you have API access):
   ```json
   {
     "embeddingModel": "anthropic",
     "anthropicApiKey": "your-anthropic-api-key"
   }
   ```

3. **Mock** (for development/testing, no API key needed):
   ```json
   {
     "embeddingModel": "mock"
   }
   ```

### Full Configuration Options

Here are all the available configuration options:

```json
{
  "port": 3000,                             // Server port
  "embeddingModel": "mock",                 // "mock", "openai", or "anthropic"
  "openaiApiKey": "your-openai-api-key",    // Required for OpenAI embeddings
  "anthropicApiKey": "your-anthropic-api-key", // Required for Anthropic embeddings
  "pgHost": "localhost",                    // PostgreSQL host
  "pgPort": 5432,                           // PostgreSQL port
  "pgUser": "memory_user",                  // PostgreSQL username
  "pgPassword": "memory_password",          // PostgreSQL password
  "pgDatabase": "memory_db",                // PostgreSQL database name
  "pgPoolMin": 2,                           // Min database connections
  "pgPoolMax": 10,                          // Max database connections
  "logLevel": "info",                       // "error", "warn", "info", "debug"
  "metadata": {                             // Optional additional metadata
    "userId": "user-123",
    "projectName": "research"
  }
}
```

### Production PostgreSQL Configuration

For production deployments, consider these PostgreSQL settings:

```sql
ALTER SYSTEM SET max_connections = '100';
ALTER SYSTEM SET shared_buffers = '1GB';
ALTER SYSTEM SET effective_cache_size = '3GB';
ALTER SYSTEM SET maintenance_work_mem = '256MB';
ALTER SYSTEM SET work_mem = '64MB';
ALTER SYSTEM SET random_page_cost = '1.1';
ALTER SYSTEM SET effective_io_concurrency = '200';
```

Additional recommendations for high-traffic deployments:

```sql
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = '0.05';
ALTER SYSTEM SET autovacuum_analyze_scale_factor = '0.025';
ALTER SYSTEM SET checkpoint_completion_target = '0.9';
ALTER SYSTEM SET wal_buffers = '16MB';
```

## Troubleshooting

### Common Issues

1. **Authentication failed errors**
   - If you see "password authentication failed for user 'memory_user'" errors, run:
     ```bash
     npm run fix-postgres-auth
     npm run run-with-config
     ```
   - This fixes authentication method mismatches between PostgreSQL and the client

2. **Database connection errors**
   - Verify PostgreSQL is running: `docker ps`
   - Check your configuration for correct database credentials
   - Ensure the port isn't already in use: `netstat -an | grep 5432`
   - Try a different port if 5432 is occupied
   - **Use the troubleshooting script**: `npm run troubleshoot`

3. **MCP server not starting**
   - Check for Node.js version compatibility (v18+): `node --version`
   - Verify the package is installed globally: `npm list -g postgres-memory-mcp`
   - Try reinstalling the package: `npm uninstall -g postgres-memory-mcp && npm install -g postgres-memory-mcp`
   - Run with explicit configuration: `npm run run-with-config`

4. **Claude not connecting to the MCP server**
   - Ensure the configuration file is in the correct location
   - Check that the command path is correct
   - Restart Claude Desktop completely (quit from system tray/menu bar)
   - Look for error logs in the Claude Desktop application
   - **Use the troubleshooting script with the `--claude-config` option**: `npm run troubleshoot`

5. **Module format errors**
   - For "Cannot use import statement outside a module" errors, see the [Troubleshooting Guide](docs/TROUBLESHOOTING.md#module-format-errors)
   - Try using the `.mjs` extension for scripts with ES Module syntax
   - Add `"type": "module"` to your package.json if you're using your own project

### Interactive Troubleshooting

This package includes an interactive troubleshooting script that can help diagnose and fix common issues:

```bash
# Run the interactive troubleshooter
npm run troubleshoot

# Or if installed globally
postgres-mcp-troubleshoot
```

The troubleshooter will:
- Check Docker container status
- Test database connections
- Initialize database schema if needed
- Generate configuration files
- Create startup scripts
- Set up Claude Desktop configuration

### Advanced Troubleshooting

For more detailed troubleshooting:

1. Run the MCP server manually with debug logging:
   ```bash
   DEBUG=mcp:* postgres-memory-mcp
   ```

2. Test database connectivity directly:
   ```bash
   docker exec -it postgres-memory psql -U memory_user -d memory_db
   ```

3. Verify the pgvector extension:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```

4. Reset and reinitialize the database:
   ```bash
   docker rm -f postgres-memory
   docker run -d --name postgres-memory -e POSTGRES_USER=memory_user -e POSTGRES_PASSWORD=memory_password -e POSTGRES_DB=memory_db -p 5432:5432 ankane/pgvector
   ```

5. If you encounter module format errors like `SyntaxError: Cannot use import statement outside a module`, try one of these solutions:
   - Run the script with the `.mjs` extension: `mv your-script.js your-script.mjs && node your-script.mjs`
   - Add `"type": "module"` to your package.json if you're working in your own project
   - Create a CommonJS version of the script by replacing ES Module syntax with CommonJS syntax:
     ```javascript
     // Change this:
     import path from 'path';
     
     // To this:
     const path = require('path');
     ```

For more detailed help, see the [MCP Integration Guide](docs/MCP.md).

## Documentation

- [Claude Desktop Setup Guide](CLAUDE_DESKTOP_SETUP.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [MCP Integration Guide](docs/MCP.md)
- [Production Deployment](docs/PRODUCTION.md)
- [Memory Concepts](docs/MEMORY_CONCEPTS.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)

## Upgrading

To upgrade PostgreSQL MCP Tools to the latest version:

```bash
npm update -g postgres-memory-mcp
```

Then restart Claude Desktop to use the updated version.

## Uninstalling

To remove PostgreSQL MCP Tools:

1. Delete the MCP server configuration from Claude Desktop
2. Stop and remove the Docker container:
   ```bash
   docker stop postgres-memory
   docker rm postgres-memory
   ```
3. Uninstall the NPM package:
   ```bash
   npm uninstall -g postgres-memory-mcp
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Anthropic for developing the Model Context Protocol
- PostgreSQL and pgvector contributors
- OpenAI for their embeddings API
