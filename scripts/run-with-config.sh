#!/bin/bash

# Script to run PostgreSQL MCP Server with a configuration file
# Created: March 22, 2025

# Kill existing processes
echo "Stopping existing MCP server processes..."
pkill -f postgres-mcp-server.js
pkill -f postgres-memory-mcp

# Create a temporary configuration file
CONFIG_FILE=$(mktemp)
cat > "$CONFIG_FILE" << EOF
{
  "pgHost": "localhost",
  "pgPort": 5432,
  "pgUser": "memory_user",
  "pgPassword": "Memory123!",
  "pgDatabase": "memory_db",
  "embeddingModel": "mock"
}
EOF

# Change to the project directory
cd "$(dirname "$0")"

# Start the MCP server with configuration
echo "Starting PostgreSQL MCP Server with configuration..."
node bin/postgres-mcp-server.js --config="$(cat "$CONFIG_FILE")"

# Clean up
rm "$CONFIG_FILE"
