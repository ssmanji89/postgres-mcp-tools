# Setting Up PostgreSQL MCP Tools for Claude Desktop

This guide will help you set up PostgreSQL MCP Tools to enhance Claude Desktop with long-term memory capabilities.

## What is PostgreSQL MCP Tools?

PostgreSQL MCP Tools provides Claude with a memory system that allows it to:

- Remember information from past conversations
- Retrieve relevant context based on your current discussion
- Maintain consistency across multiple conversations
- Store and retrieve rich contextual information with vector-based semantic search

## Prerequisites

Before you begin, make sure you have:

- [Claude Desktop](https://claude.ai/downloads) installed on your computer
- [Node.js](https://nodejs.org/) 18.0.0 or higher
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended for PostgreSQL)

## Installation Options

You have two main options for installation:

### Option 1: Quick Setup (Recommended)

1. **Install the NPM package globally**

```bash
npm install -g postgres-memory-mcp
```

2. **Start PostgreSQL with Docker**

```bash
docker run -d \
  --name postgres-memory \
  -e POSTGRES_USER=memory_user \
  -e POSTGRES_PASSWORD=memory_password \
  -e POSTGRES_DB=memory_db \
  -p 5432:5432 \
  ankane/pgvector
```

Alternatively, you can use our Docker Compose file:

```bash
# Download the docker-compose file
curl -O https://raw.githubusercontent.com/ssmanji89/postgres-mcp-tools/main/docker-compose.dev.yml

# Start with Docker Compose
docker-compose -f docker-compose.dev.yml up -d
```

3. **Configure Claude Desktop**

First, locate the configuration directory for your operating system:

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

Next, create or edit the configuration file:

**For macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**For Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**For Linux**: `~/.config/Claude/claude_desktop_config.json`

Add the following content to the configuration file:

```json
{
  "mcpServers": {
    "postgres_memory": {
      "command": "postgres-memory-mcp",
      "args": [
        "--config",
        "{\"embeddingModel\":\"mock\",\"pgHost\":\"localhost\",\"pgPort\":5432,\"pgUser\":\"memory_user\",\"pgPassword\":\"memory_password\",\"pgDatabase\":\"memory_db\"}"
      ]
    }
  }
}
```

4. **Restart Claude Desktop**

Fully exit Claude Desktop (quit from the system tray/menu bar) and restart it for the changes to take effect.

5. **Verify the Installation**

Open Claude Desktop and type:
```
Can you check if the memory system is working properly?
```

Claude should respond indicating it can access the memory system.

### Option 2: Manual Setup (Advanced)

If you prefer to clone the repository and run from source:

```bash
# Clone the repository
git clone https://github.com/ssmanji89/postgres-mcp-tools.git
cd postgres-mcp-tools

# Install dependencies
npm install

# Start PostgreSQL with Docker Compose
docker-compose -f docker-compose.dev.yml up -d

# Build the server
npm run build-server

# Create the configuration directory
mkdir -p ~/Library/Application\ Support/Claude/  # for macOS
# OR
mkdir -p %APPDATA%\Claude\  # for Windows
# OR
mkdir -p ~/.config/Claude/  # for Linux

# Copy the example configuration
cp config/claude_desktop_config.json.example ~/Library/Application\ Support/Claude/claude_desktop_config.json  # for macOS
# OR
cp config/claude_desktop_config.json.example %APPDATA%\Claude\claude_desktop_config.json  # for Windows
# OR
cp config/claude_desktop_config.json.example ~/.config/Claude/claude_desktop_config.json  # for Linux
```

Then edit the configuration file to match your setup and restart Claude Desktop.

## Configuration Options

You can customize the following settings in the `--config` parameter:

### Basic Configuration Options

- `embeddingModel`: Choose the embedding model to use:
  - `"mock"`: For testing (no API key needed)
  - `"openai"`: Higher quality (requires OpenAI API key)
  - `"anthropic"`: Optimized for Claude (requires Anthropic API key)
- `pgHost`: PostgreSQL host (default: "localhost")
- `pgPort`: PostgreSQL port (default: 5432)
- `pgUser`: PostgreSQL username (default: "memory_user")
- `pgPassword`: PostgreSQL password
- `pgDatabase`: PostgreSQL database name (default: "memory_db")

### Advanced Configuration Options

- `openaiApiKey`: OpenAI API key (required if using OpenAI embeddings)
- `anthropicApiKey`: Anthropic API key (required if using Anthropic embeddings)
- `port`: MCP server port (default: 3000)
- `logLevel`: Logging level (default: "info")
- `pgPoolMin`: Minimum database connections (default: 2)
- `pgPoolMax`: Maximum database connections (default: 10)
- `metadata`: Additional metadata to store with memories (optional)

### Example Configurations

#### Basic configuration with mock embeddings (no API key needed):

```json
{
  "mcpServers": {
    "postgres_memory": {
      "command": "postgres-memory-mcp",
      "args": [
        "--config",
        "{\"embeddingModel\":\"mock\",\"pgHost\":\"localhost\",\"pgPort\":5432,\"pgUser\":\"memory_user\",\"pgPassword\":\"memory_password\",\"pgDatabase\":\"memory_db\"}"
      ]
    }
  }
}
```

#### Configuration with OpenAI embeddings:

```json
{
  "mcpServers": {
    "postgres_memory": {
      "command": "postgres-memory-mcp",
      "args": [
        "--config",
        "{\"embeddingModel\":\"openai\",\"openaiApiKey\":\"sk-your-api-key\",\"pgHost\":\"localhost\",\"pgPort\":5432,\"pgUser\":\"memory_user\",\"pgPassword\":\"memory_password\",\"pgDatabase\":\"memory_db\"}"
      ]
    }
  }
}
```

#### Configuration with Anthropic embeddings and additional metadata:

```json
{
  "mcpServers": {
    "postgres_memory": {
      "command": "postgres-memory-mcp",
      "args": [
        "--config",
        "{\"embeddingModel\":\"anthropic\",\"anthropicApiKey\":\"sk-ant-your-api-key\",\"pgHost\":\"localhost\",\"pgPort\":5432,\"pgUser\":\"memory_user\",\"pgPassword\":\"memory_password\",\"pgDatabase\":\"memory_db\",\"metadata\":{\"userId\":\"user-123\",\"projectName\":\"research\"}}"
      ]
    }
  }
}
```

## Using Memory with Claude

Once configured, Claude Desktop will automatically use the memory system in the background. Here's how to make the most of it:

### Testing Memory

Try these prompts to test if memory is working:

1. Tell Claude something to remember:
   ```
   Please remember that my favorite color is purple and I have a dog named Max.
   ```

2. Later in the conversation (or in a new one), ask:
   ```
   What's my favorite color? Do I have any pets?
   ```

Claude should recall this information from memory.

3. Test semantic search by asking about related topics:
   ```
   What do you know about my pet?
   ```

Claude should retrieve the relevant memory about Max.

### Memory Management

You can ask Claude to manage memories directly:

- List memories:
  ```
  Use the memory_management tool to list the memories in our current conversation.
  ```

- Archive old memories:
  ```
  Use the memory_management tool to archive memories older than 30 days.
  ```

- Optimize for performance:
  ```
  Use the memory_management tool to optimize the vector index.
  ```

- Delete a specific memory (use the ID from the list command):
  ```
  Use the memory_management tool to delete memory 123.
  ```

## Troubleshooting

### Common Issues

**Claude doesn't seem to remember things:**
- Verify PostgreSQL is running:
  ```bash
  docker ps | grep postgres
  ```
- Check that you restarted Claude Desktop after configuration
- Try restarting both the Docker container and Claude Desktop:
  ```bash
  docker restart postgres-memory
  ```
- Check for errors in the Claude Desktop logs

**Error when starting Claude Desktop:**
- Check your Node.js version: `node --version` (should be 18+)
- Verify the package is installed globally:
  ```bash
  npm list -g postgres-memory-mcp
  ```
- Verify PostgreSQL credentials in configuration match your setup
- Look for error logs in the Claude Desktop application

**Database connection errors:**
- Make sure Docker is running
- Check if PostgreSQL port 5432 is already in use:
  ```bash
  netstat -an | grep 5432  # macOS/Linux
  netstat -an | findstr 5432  # Windows
  ```
- Try a different port in both Docker and configuration if 5432 is in use
- Verify network settings if using a remote database

### Advanced Troubleshooting

For more detailed troubleshooting:

1. Check PostgreSQL container logs:
   ```bash
   docker logs postgres-memory
   ```

2. Run the MCP server manually with debug logging:
   ```bash
   DEBUG=mcp:* postgres-memory-mcp
   ```

3. Test database connectivity directly:
   ```bash
   docker exec -it postgres-memory psql -U memory_user -d memory_db
   ```

4. Verify the pgvector extension:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```

5. Reset and reinitialize the database:
   ```bash
   docker rm -f postgres-memory
   docker run -d --name postgres-memory -e POSTGRES_USER=memory_user -e POSTGRES_PASSWORD=memory_password -e POSTGRES_DB=memory_db -p 5432:5432 ankane/pgvector
   ```

## Upgrading

To upgrade PostgreSQL MCP Tools to the latest version:

```bash
npm update -g postgres-memory-mcp
```

Then restart Claude Desktop to use the updated version.

## Uninstalling

To remove PostgreSQL MCP Tools:

1. Delete the MCP server configuration from Claude Desktop:
   - Edit the `claude_desktop_config.json` file and remove the `postgres_memory` entry from `mcpServers`

2. Stop and remove the Docker container:
   ```bash
   docker stop postgres-memory
   docker rm postgres-memory
   ```

3. Uninstall the NPM package:
   ```bash
   npm uninstall -g postgres-memory-mcp
   ```

## Additional Resources

- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [MCP Integration Guide](docs/MCP.md)
- [Production Deployment](docs/PRODUCTION.md)
- [Memory Concepts](docs/MEMORY_CONCEPTS.md)

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [GitHub repository](https://github.com/ssmanji89/postgres-mcp-tools) for updates and issues
2. Submit a detailed bug report with your configuration and error logs
3. Join the community discussions in the repository Issues section
