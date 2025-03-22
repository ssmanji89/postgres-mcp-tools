# Model Context Protocol (MCP) Integration Guide

This guide explains how PostgreSQL MCP Tools integrates with Claude Desktop using the Model Context Protocol (MCP).

## What is MCP?

Model Context Protocol (MCP) is a lightweight communication standard developed by Anthropic to enable AI assistants like Claude to interact with external tools and data sources. It allows Claude to:

1. Access external resources and tools
2. Store and retrieve context across conversations
3. Extend its capabilities beyond the built-in knowledge

## How PostgreSQL MCP Tools Implements MCP

PostgreSQL MCP Tools implements the MCP protocol to provide:

1. **Memory Resource**: Stores and retrieves relevant conversation context
2. **Memory Management Tool**: Allows Claude to manage stored memories

### Memory Resource

The Memory Resource provides Claude with:

- **Context Storage**: Saves important information from conversations
- **Vector-Based Retrieval**: Finds relevant past memories using semantic search
- **Cross-Conversation Memory**: Maintains knowledge across multiple sessions

### Memory Management Tool

The Memory Management Tool enables Claude to:

- **List Memories**: View memories stored for the current conversation
- **Archive Memories**: Remove old memories based on age
- **Optimize Performance**: Run database optimization routines

## Configuring Claude Desktop

To integrate PostgreSQL MCP Tools with Claude Desktop:

1. Install the `postgres-memory-mcp` package globally:
   ```bash
   npm install -g postgres-memory-mcp
   ```

2. Configure Claude Desktop with the MCP server information:
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

3. Restart Claude Desktop to load the configuration

## Using MCP with Claude

Once configured, Claude can:

1. **Access Previous Conversations**: Claude automatically searches for relevant past discussions
2. **Store New Information**: Important details are saved for future reference
3. **Manage Memory**: You can ask Claude to perform memory management operations

Example memory management prompts:

```
Use the memory_management tool to list the memories in our current conversation.
```

```
Use the memory_management tool to archive memories older than 30 days.
```

```
Use the memory_management tool to optimize the vector index.
```

## How Memory is Used

When you ask Claude a question, the following process happens:

1. Your question is processed and converted to a vector embedding
2. The database is searched for semantically similar memories
3. Relevant memories are included in Claude's context
4. Claude responds with knowledge of past interactions

This creates a continuous conversation experience across multiple sessions.

## Advanced MCP Features

### Conversation Metadata

You can provide additional metadata in the Claude Desktop configuration:

```json
{
  "mcpServers": {
    "postgres_memory": {
      "command": "postgres-memory-mcp",
      "args": [
        "--config",
        "{\"embeddingModel\":\"openai\",\"openaiApiKey\":\"your-api-key\",\"metadata\":{\"userId\":\"user-123\"}}"
      ]
    }
  }
}
```

This metadata can help segment and organize memories by user, project, or other dimensions.

### Environment Variables

If you're running the server directly (not via the Claude Desktop configuration), you can configure it using environment variables:

```bash
EMBEDDING_MODEL=openai \
OPENAI_API_KEY=your-api-key \
PG_HOST=localhost \
PG_PORT=5432 \
PG_USER=memory_user \
PG_PASSWORD=memory_password \
PG_DATABASE=memory_db \
postgres-memory-mcp
```

### Custom MCP Server Implementations

For advanced users, you can implement a custom MCP server that extends the base functionality:

```javascript
import { Server } from 'postgres-memory-mcp';

const customServer = new Server({
  resources: [...customResources],
  tools: [...customTools],
  capabilities: {
    resources: { subscribe: true },
    tools: { listChanged: true }
  }
});

customServer.listen(3000, 'localhost');
```

## Troubleshooting MCP Integration

### Common MCP Issues

1. **Claude doesn't recognize the MCP server**
   - Check the configuration path is correct for your OS
   - Verify the configuration JSON syntax is valid
   - Make sure the `command` points to a valid executable

2. **Claude can't connect to the server**
   - Ensure the server is properly installed: `npm list -g postgres-memory-mcp`
   - Check if the port is accessible and not blocked by a firewall
   - Look for error messages in the terminal when Claude starts

3. **Memory functionality not working**
   - Verify the PostgreSQL connection settings
   - Check if the pgvector extension is installed
   - Make sure the embedding model configuration is correct

For more detailed troubleshooting, you can run the server manually with debug logging:

```bash
DEBUG=mcp:* postgres-memory-mcp
```

## References

- [Anthropic MCP Documentation](https://docs.anthropic.com/claude/docs/model-context-protocol)
- [Claude Desktop Documentation](https://support.anthropic.com/en/articles/8093465-claude-desktop-faqs-and-troubleshooting)
- [PostgreSQL pgvector Documentation](https://github.com/pgvector/pgvector)
