# Claude Desktop Setup Guide for PostgreSQL MCP Tools

This guide provides detailed instructions for setting up Claude Desktop to work with the PostgreSQL MCP Tools memory system.

## Prerequisites

Before starting, ensure you have:

1. [Claude Desktop](https://claude.ai/downloads) installed on your computer
2. [Node.js](https://nodejs.org/) 18.0.0 or higher
3. [Docker Desktop](https://www.docker.com/products/docker-desktop/) for running PostgreSQL

## Important Note About Claude Desktop Integration

**New in version 1.0.10**: PostgreSQL MCP Tools has been updated with a robust transport layer that handles mixed message formats gracefully, preventing JSON parsing errors. This update:

- Ensures proper integration with Claude Desktop by directing all debug logs to stderr instead of stdout
- Handles non-JSON messages gracefully, preventing server crashes
- Provides comprehensive error handling for all message types
- Maintains proper JSON-RPC protocol communication with the MCP framework

For details on the robust transport implementation, see [ROBUST_TRANSPORT.md](docs/ROBUST_TRANSPORT.md).

## Installation Steps

### 1. Install PostgreSQL MCP Tools

Install the package globally using npm:

```bash
npm install -g postgres-mcp-tools
```

This will:
- Install the required dependencies
- Generate a secure random password for PostgreSQL
- Create a `.env` file with configuration settings

### 2. Start PostgreSQL Database

The easiest way to run PostgreSQL is using Docker:

```bash
# Navigate to where postgres-mcp-tools is installed
cd $(npm root -g)/postgres-mcp-tools

# Start PostgreSQL with Docker Compose
docker-compose up -d postgres
```

Verify that PostgreSQL is running:

```bash
docker ps
```

You should see a container named `memory-postgres` in the list.

### 3. Configure Claude Desktop

First, locate your Claude Desktop configuration directory:

**macOS**:
```bash
mkdir -p ~/Library/Application\ Support/Claude/
cd ~/Library/Application\ Support/Claude/
```

**Windows**:
```bash
mkdir -p %APPDATA%\Claude\
cd %APPDATA%\Claude\
```

**Linux**:
```bash
mkdir -p ~/.config/Claude/
cd ~/.config/Claude/
```

Create or edit the configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**Linux**: `~/.config/Claude/claude_desktop_config.json`  

Add the following content to the file:

```json
{
  "mcpServers": {
    "postgres_memory": {
      "command": "postgres-mcp-server",
      "args": [
        "--config",
        "{\"embeddingModel\":\"mock\",\"pgHost\":\"localhost\",\"pgPort\":5432,\"pgUser\":\"memory_user\",\"pgPassword\":\"YOUR_GENERATED_PASSWORD\",\"pgDatabase\":\"memory_db\",\"mcpPort\":3000}"
      ],
      "env": {
        "FORCE_STDERR_LOGGING": "true",
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

The configuration includes:
- `FORCE_STDERR_LOGGING`: Ensures all logging output is directed to stderr, essential for proper MCP protocol communication
- `NODE_ENV`: Sets the runtime environment ("production" recommended for stable operation)
- `LOG_LEVEL`: Controls the verbosity of logging (options: debug, info, warn, error)
- `mcpPort`: Explicitly defines the MCP server port (default: 3000)

Replace `YOUR_GENERATED_PASSWORD` with the password from your `.env` file:

```bash
# Get password from .env file
cd $(npm root -g)/postgres-mcp-tools
cat .env | grep POSTGRES_PASSWORD
```

### 4. Start the MCP Server

You can run the MCP server either through Docker or directly:

**Option 1: Run with Docker (recommended for production)**:
```bash
cd $(npm root -g)/postgres-mcp-tools
docker-compose up -d
```

**Option 2: Run directly (better for development)**:
```bash
cd $(npm root -g)/postgres-mcp-tools
npm run start-server
```

### 5. Restart Claude Desktop

1. Completely quit Claude Desktop (from system tray/menu bar)
2. Restart Claude Desktop
3. The MCP server should connect automatically

## Verification

To verify that Claude is connected to the memory system, ask:

```
Can you check if the PostgreSQL memory system is connected and working properly?
```

Claude should respond with a confirmation that the memory system is active.

## Common Issues and Solutions

### Connection Issues

If Claude reports that it cannot connect to the memory system:

1. **Verify PostgreSQL is running**:
   ```bash
   docker ps | grep memory-postgres
   ```

2. **Check MCP server logs**:
   ```bash
   docker logs mcp-server
   # Or if running directly:
   cd $(npm root -g)/postgres-mcp-tools
   npm run start-server
   ```

3. **Ensure password matches**:
   - The password in the Claude configuration must match what's in your `.env` file
   - Check for special characters that might need escaping in the JSON

### JSON Parsing Errors

If you notice errors like "Unexpected token" or "Not valid JSON" in the logs:

1. **Ensure you're using version 1.0.11 or later**:
   ```bash
   npm list -g postgres-mcp-tools
   ```

2. **Update to the latest version**:
   ```bash
   npm uninstall -g postgres-mcp-tools
   npm install -g postgres-mcp-tools
   ```

3. **If installation fails with dependency errors**:
   ```bash
   # Option 1: Use force flag
   npm install -g postgres-mcp-tools --force --no-save
   
   # Option 2: Install from GitHub repo
   git clone https://github.com/ssmanji89/postgres-mcp-tools.git
   cd postgres-mcp-tools
   npm install
   npm run setup-mcp-sdk
   npm link
   ```

4. **Verify robust transport configuration**:
   - The `FORCE_STDERR_LOGGING` environment variable should be set to `true`
   - Check logs for any remaining parsing errors

5. **Test the transport layer**:
   ```bash
   cd $(npm root -g)/postgres-mcp-tools
   npm run test:basic
   ```

### Dependency-Related Errors

If you encounter errors related to `@modelcontextprotocol/sdk` or `@modelcontextprotocol/typescript-sdk`:

1. **Run the MCP SDK setup script**:
   ```bash
   cd $(npm root -g)/postgres-mcp-tools
   npm run setup-mcp-sdk
   ```

2. **Manually clone the SDK repository**:
   ```bash
   cd $(npm root -g)/postgres-mcp-tools/server
   rm -rf typescript-sdk
   git clone https://github.com/modelcontextprotocol/typescript-sdk.git typescript-sdk
   cd typescript-sdk
   npm install
   ```

3. **Rebuild the server**:
   ```bash
   cd $(npm root -g)/postgres-mcp-tools
   npm run build-server
   ```

### Database Errors

If there are database connection errors:

1. **Verify database initialization**:
   ```bash
   cd $(npm root -g)/postgres-mcp-tools
   npm run init-database
   ```

2. **Check PostgreSQL logs**:
   ```bash
   docker logs memory-postgres
   ```

3. **Try accessing PostgreSQL directly**:
   ```bash
   # Get password from .env
   PASSWORD=$(grep POSTGRES_PASSWORD .env | cut -d '=' -f2)
   
   # Connect to PostgreSQL
   docker exec -it memory-postgres psql -U memory_user -d memory_db -W
   # Enter password when prompted
   ```

### Embedding Model Issues

If you encounter issues with the embedding model:

1. **Use mock model for testing**:
   - Set `"embeddingModel":"mock"` in your Claude configuration

2. **For OpenAI embeddings**:
   - Ensure you have an OpenAI API key
   - Update your Claude configuration with:
     ```
     "embeddingModel":"openai","openaiApiKey":"your-openai-api-key"
     ```

3. **For Anthropic embeddings**:
   - Ensure you have an Anthropic API key
   - Update your Claude configuration with:
     ```
     "embeddingModel":"anthropic","anthropicApiKey":"your-anthropic-api-key"
     ```

## Advanced Configuration

For advanced configuration options, see the full [README.md](README.md).

## Uninstalling

To completely remove PostgreSQL MCP Tools:

1. Remove configuration from Claude Desktop
2. Stop and remove Docker containers:
   ```bash
   cd $(npm root -g)/postgres-mcp-tools
   docker-compose down -v
   ```
3. Uninstall the package:
   ```bash
   npm uninstall -g postgres-mcp-tools
   ```

## Troubleshooting

If you continue to experience issues, please check the [troubleshooting section](README.md#troubleshooting) in the main README or submit an issue on our GitHub repository.
