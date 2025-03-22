#!/bin/bash

# Script to fix PostgreSQL MCP Server connection issues
# Created: March 22, 2025

# Kill existing processes
echo "Stopping existing MCP server processes..."
pkill -f postgres-mcp-server.js
pkill -f postgres-memory-mcp

# Set environment variables for PostgreSQL connection
echo "Setting up environment variables for database connection..."
export POSTGRES_USER=memory_user
export POSTGRES_PASSWORD=Memory123!
export POSTGRES_DB=memory_db
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export EMBEDDING_MODEL=mock

# Change to the project directory
cd "$(dirname "$0")"

# Start the MCP server
echo "Starting PostgreSQL MCP Server..."
node bin/postgres-mcp-server.js
