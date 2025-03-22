# Troubleshooting Guide

This document provides solutions for common issues you might encounter when using postgres-mcp-tools.

## Authentication Issues

### Problem: Password Authentication Failed Error

**Error Message**:
```
Query error: password authentication failed for user "memory_user"
Database health check failed password authentication failed for user "memory_user"
Database health check failed. Exiting.
```

**Root Cause**:
The PostgreSQL container is configured to use SCRAM-SHA-256 authentication method for all external connections, but the MCP server is attempting to use MD5 or password authentication. This authentication method mismatch causes the connection to fail even with correct credentials.

**Solution**:

1. **Fix PostgreSQL Authentication Configuration**:
   Run the provided script to update the PostgreSQL authentication configuration:

   ```bash
   ./scripts/fix-postgres-auth.sh
   ```

   This script:
   - Updates the pg_hba.conf file in the PostgreSQL container to use MD5 authentication
   - Reloads the PostgreSQL configuration
   - Tests the connection to verify it's working

2. **Run the MCP Server**:
   After fixing the authentication configuration, run the MCP server with the correct environment variables:

   ```bash
   ./scripts/run-with-config.sh
   ```

### Understanding PostgreSQL Authentication

PostgreSQL uses a configuration file called `pg_hba.conf` to control client authentication. The format is:

```
TYPE  DATABASE  USER  ADDRESS  METHOD
```

Common authentication methods include:
- `trust`: Allow connection unconditionally
- `md5`: Require MD5-encrypted password authentication
- `scram-sha-256`: Require SCRAM-SHA-256 encrypted password authentication
- `password`: Require unencrypted password authentication (insecure)

Our fix changes the authentication method from `scram-sha-256` to `md5` which is more widely supported by client libraries.

## Module Format Errors

### Problem: Cannot use import statement outside a module

If you encounter errors like:

```
SyntaxError: Cannot use import statement outside a module
```

This means JavaScript is trying to use ES Module syntax (import/export) in a CommonJS environment.

### Solutions:

#### Option 1: Use .mjs Extension

Rename your script to use the `.mjs` extension, which tells Node.js to treat it as an ES Module:

```bash
mv your-script.js your-script.mjs
node your-script.mjs
```

#### Option 2: Add "type": "module" to package.json

If you're working in a project with a package.json file, add or modify the "type" field:

```json
{
  "name": "your-project",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    // ...
  }
}
```

#### Option 3: Convert to CommonJS Syntax

If you need to use CommonJS, convert ES Module syntax to CommonJS:

```javascript
// Change this ES Module syntax:
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// To this CommonJS syntax:
const path = require('path');
// __dirname and __filename are already available in CommonJS
```

#### Option 4: Run with --experimental-modules Flag

```bash
node --experimental-modules your-script.js
```

## Database Connection Issues

### Problem: Connection Timeout Issues

If you're experiencing connection timeout issues rather than authentication failures:

1. **Verify Docker Container Status**:
   ```bash
   docker ps
   ```
   Ensure the memory-postgres container is running and healthy.

2. **Check PostgreSQL Logs**:
   ```bash
   docker logs memory-postgres
   ```
   Look for any error messages or configuration issues.

3. **Restart PostgreSQL Container**:
   ```bash
   docker restart memory-postgres
   ```
   Wait for the container to become healthy before starting the MCP server.

### Verifying Correct Setup

To verify everything is set up correctly:

1. **Test PostgreSQL Connection**:
   ```bash
   docker exec memory-postgres psql -U memory_user -d memory_db -c "SELECT version();"
   ```
   This should display the PostgreSQL version without any password prompt.

2. **Check Host Connection**:
   ```bash
   psql -h localhost -p 5432 -U memory_user -d memory_db -W
   ```
   Enter the password `Memory123!` when prompted.

### Problem: Network-related database connection issues

If you see errors like:

```
error: connect ECONNREFUSED 127.0.0.1:5432
error: getaddrinfo ENOTFOUND postgres
error: Connection terminated unexpectedly
```

### Solutions:

#### 1. Check if PostgreSQL is running

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# If not running, start it
docker start memory-postgres

# Check the logs for any startup issues
docker logs memory-postgres
```

#### 2. Verify network settings

```bash
# Check if the port is accessible
nc -zv localhost 5432

# Check if the port is being used by another process
sudo lsof -i :5432

# For Docker Compose setups, check the network
docker network ls
docker network inspect postgres-mcp-tools_postgres-memory-network
```

#### 3. Correct host configuration for Docker Compose

If you're using Docker Compose but trying to connect from outside the Docker network:

```bash
# For connections from the host machine to the container
export POSTGRES_HOST=localhost

# For connections between containers in the same Docker Compose network
export POSTGRES_HOST=postgres  # Use the service name defined in docker-compose.yml
```

### Problem: SSL-related connection issues

If you see errors related to SSL:

```
error: The server does not support SSL connections
error: SSL connection is required
```

### Solutions:

#### 1. Configure SSL settings correctly

```bash
# Update your configuration to match your PostgreSQL SSL settings
cat > /tmp/postgres-mcp-config.json << 'EOF'
{
  "pgHost": "localhost",
  "pgPort": 5432,
  "pgUser": "memory_user", 
  "pgPassword": "your_password",
  "pgDatabase": "memory_db",
  "pgSsl": false,  // Set to true if PostgreSQL requires SSL
  "embeddingModel": "mock"
}
EOF
```

### Problem: Database initialization and schema issues

If you see errors like:

```
error: relation "memories" does not exist
error: function vector_cosine_ops() does not exist
error: extension "vector" does not exist
```

### Solutions:

#### 1. Install the pgvector extension

The PostgreSQL memory tools require the pgvector extension to be installed:

```bash
# Connect to your database
docker exec -it memory-postgres bash -c 'psql -U memory_user -d memory_db'

# Inside the PostgreSQL prompt, run:
CREATE EXTENSION IF NOT EXISTS vector;

# Verify installation
\dx
```

#### 2. Run the database initialization script

```bash
# Navigate to the postgres-mcp-tools directory
cd /Users/sulemanmanji/Documents/GitHub/postgres-mcp-tools

# Run the initialization script
node scripts/init-database.js

# Or use the npm script
npm run init-database
```

## Claude Desktop Integration Issues

### Problem: Claude cannot find the MCP server

If Claude reports it cannot connect to the MCP server:

### Solutions:

1. Verify the server is running:
   ```bash
   ps aux | grep postgres-memory-mcp
   ```

2. Check the configuration path:
   ```bash
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json  # macOS
   cat %APPDATA%\Claude\claude_desktop_config.json                      # Windows
   cat ~/.config/Claude/claude_desktop_config.json                      # Linux
   ```

3. Try updating the command path to use an absolute path:
   ```json
   {
     "mcpServers": {
       "postgres_memory": {
         "command": "/usr/local/bin/postgres-memory-mcp",
         "args": [...]
       }
     }
   }
   ```

## Performance Issues

### Problem: Slow vector searches

### Solutions:

1. Increase PostgreSQL memory settings:
   ```sql
   ALTER SYSTEM SET shared_buffers = '1GB';
   ALTER SYSTEM SET work_mem = '64MB';
   ```

2. Create an index specifically for vector searches:
   ```sql
   CREATE INDEX ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
   ```

3. Optimize the database:
   ```sql
   VACUUM ANALYZE memories;
   ```

## Additional Resources

- [PostgreSQL Authentication Methods](https://www.postgresql.org/docs/current/auth-methods.html)
- [Docker PostgreSQL Container Documentation](https://hub.docker.com/_/postgres)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/docs/tools/debugging)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PGVector Documentation](https://github.com/pgvector/pgvector)

## Still Need Help?

If you're still encountering issues:

1. Open an issue on the [project's GitHub page](https://github.com/ssmanji89/postgres-mcp-tools/issues)
2. Include detailed error logs and your system configuration
3. Describe the steps you've already taken to troubleshoot
