# Troubleshooting Guide

This document provides solutions for common issues you might encounter when using postgres-mcp-tools.

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

### Problem: Authentication failed for user

If you see errors like:

```
error: Query error: password authentication failed for user "memory_user"
error: Database health check failed password authentication failed for user "memory_user"
error: Database health check failed. Exiting.
PostgreSQL MCP Server exited with code 1
```

### Solutions:

#### 1. Create a proper configuration file with credentials

One of the most reliable solutions is to explicitly pass your database credentials through a configuration file:

```bash
# 1. Create a configuration file
cat > /tmp/postgres-mcp-config.json << 'EOF'
{
  "pgHost": "localhost",
  "pgPort": 5432,
  "pgUser": "memory_user",
  "pgPassword": "your_actual_password_here",
  "pgDatabase": "memory_db",
  "embeddingModel": "mock"
}
EOF

# 2. Run the server with this configuration
postgres-memory-mcp --config="$(cat /tmp/postgres-mcp-config.json)"
```

Replace `"your_actual_password_here"` with your actual database password from your `.env` file.

#### 2. Check your environment variables

Make sure your environment variables match your PostgreSQL configuration:

```bash
# Check .env file for credentials
grep POSTGRES_PASSWORD .env

# Export them as environment variables (consider adding to your .bashrc or .zshrc)
export POSTGRES_USER="memory_user"
export POSTGRES_PASSWORD="your_actual_password"
export POSTGRES_DB="memory_db"
export POSTGRES_HOST="localhost"
export POSTGRES_PORT="5432"
```

#### 3. Verify Docker container credentials

Ensure the Docker container is running with the expected credentials:

```bash
# Check if container is running
docker ps | grep postgres

# Check logs for any password or authentication issues
docker logs memory-postgres

# Verify you can connect to the database
docker exec -it memory-postgres psql -U memory_user -d memory_db
```

#### 4. Recreate the database container with explicit credentials

If you're still having issues, recreate the container with explicit credentials:

```bash
# Stop and remove the existing container
docker rm -f memory-postgres

# Create a new container with the same credentials as in your .env file
docker run -d --name memory-postgres \
  -e POSTGRES_USER=memory_user \
  -e POSTGRES_PASSWORD="your_password_from_env_file" \
  -e POSTGRES_DB=memory_db \
  -p 5432:5432 \
  postgres:16
  
# Initialize the database (if needed)
docker exec -it memory-postgres bash -c 'psql -U memory_user -d memory_db -c "CREATE EXTENSION IF NOT EXISTS vector;"'
```

#### 5. Special characters in passwords

If your password contains special characters (like `#`, `$`, `&`, etc.), make sure they're properly escaped in your configuration:

```bash
# For command line use, escape special characters
export POSTGRES_PASSWORD='your\#complex\$password'

# For JSON config files, no need to escape but use proper JSON formatting
# {
#   "pgPassword": "your#complex$password"
# }
```

#### 6. Check Claude Desktop configuration

If using with Claude Desktop, update the configuration file:

```json
{
  "mcpServers": {
    "postgres_memory": {
      "command": "postgres-memory-mcp",
      "args": [
        "--config",
        "{\"pgHost\":\"localhost\",\"pgPort\":5432,\"pgUser\":\"memory_user\",\"pgPassword\":\"your_actual_password\",\"pgDatabase\":\"memory_db\",\"embeddingModel\":\"mock\"}"
      ]
    }
  }
}
```

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

#### 4. Set explicit host binding

```bash
# Recreate container with explicit host binding if needed
docker run -d --name memory-postgres \
  -e POSTGRES_USER=memory_user \
  -e POSTGRES_PASSWORD="your_password" \
  -e POSTGRES_DB=memory_db \
  -p 0.0.0.0:5432:5432 \  # Explicitly bind to all interfaces
  postgres:16
```

#### 5. Check PostgreSQL configuration

```bash
# Verify PostgreSQL is listening on the expected addresses
docker exec -it memory-postgres bash -c "cat /var/lib/postgresql/data/postgresql.conf | grep listen_addresses"

# Should show: listen_addresses = '*'
# If not, you may need to update the configuration
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

#### 2. For SSL-required connections

If your PostgreSQL server requires SSL:

```bash
# Generate self-signed certificates (for development)
mkdir -p /tmp/postgresql-ssl
cd /tmp/postgresql-ssl
openssl req -new -text -passout pass:abcd -subj /CN=localhost -out server.req -keyout privkey.pem
openssl rsa -in privkey.pem -passin pass:abcd -out server.key
openssl req -x509 -in server.req -text -key server.key -out server.crt

# Update Docker container to use SSL
docker run -d --name memory-postgres \
  -e POSTGRES_USER=memory_user \
  -e POSTGRES_PASSWORD="your_password" \
  -e POSTGRES_DB=memory_db \
  -v /tmp/postgresql-ssl:/etc/postgresql/ssl \
  -p 5432:5432 \
  postgres:16

# Update your pgSsl setting to true in your configuration
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

#### 3. Recreate the database using the pgvector image

Instead of using the standard PostgreSQL image, use the pgvector image which comes with the extension pre-installed:

```bash
# Remove existing container
docker rm -f memory-postgres

# Use the pgvector image
docker run -d --name memory-postgres \
  -e POSTGRES_USER=memory_user \
  -e POSTGRES_PASSWORD="your_password" \
  -e POSTGRES_DB=memory_db \
  -p 5432:5432 \
  ankane/pgvector
```

#### 4. Check table structure

If you're having issues with specific tables or columns:

```bash
# Connect to the database
docker exec -it memory-postgres bash -c 'psql -U memory_user -d memory_db'

# Inside the PostgreSQL prompt:
\dt                       -- List all tables
\d+ memories              -- Show detailed information about the memories table
SELECT version();         -- Check PostgreSQL version
SELECT * FROM pg_extension; -- Check installed extensions
```

#### 5. Manual schema creation

If initialization scripts are failing, you can manually create the required schema:

```sql
-- Connect to your database and run:
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS memories (
    id SERIAL PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memories_conversation_id ON memories(conversation_id);
CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at);

-- If using recent pgvector (>= 0.4.0)
CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### Common PostgreSQL Error Codes and Solutions

Here's a reference guide for common PostgreSQL error codes you might encounter:

| Error Code | Description | Common Solutions |
|------------|-------------|-----------------|
| 28P01 | Password authentication failed | Check credentials in .env file and configuration |
| 3D000 | Database does not exist | Create the database or check the database name in your configuration |
| 42P01 | Relation does not exist | Run the initialization script or create the tables manually |
| 53300 | Too many connections | Increase max_connections in PostgreSQL configuration or reduce connection pool size |
| 57P03 | Database system is starting up | Wait for PostgreSQL to fully start, check logs |
| 08006 | Connection failure | Check if PostgreSQL is running and network settings |
| 42501 | Insufficient privilege | Grant appropriate permissions to the database user |
| 08001 | Unable to connect | Verify hostname, port, and firewall settings |
| 42710 | Duplicate object | Drop existing object or use IF NOT EXISTS in your creation scripts |
| 42P07 | Duplicate table | Table already exists, use IF NOT EXISTS or drop the table first |

### Diagnosing Connection Issues with psql

The `psql` command-line tool is invaluable for troubleshooting database issues:

```bash
# Connect with default settings
docker exec -it memory-postgres psql -U memory_user -d memory_db

# Connect with verbose output
docker exec -it memory-postgres psql -U memory_user -d memory_db -v

# Connect with specific host/port
psql -h localhost -p 5432 -U memory_user -d memory_db

# Test connection without entering psql shell
psql -h localhost -p 5432 -U memory_user -d memory_db -c "SELECT 1;"
```

### Advanced Database Diagnostics

For more advanced database diagnostics:

```bash
# Check PostgreSQL logs
docker exec -it memory-postgres bash -c "cat /var/lib/postgresql/data/log/*.log"

# Check connection settings
docker exec -it memory-postgres bash -c "cat /var/lib/postgresql/data/postgresql.conf | grep -E 'listen_addresses|port|max_connections'"

# Check authentication settings
docker exec -it memory-postgres bash -c "cat /var/lib/postgresql/data/pg_hba.conf"

# Check if port is open
nc -zv localhost 5432

# Check running processes
docker exec -it memory-postgres bash -c "ps aux | grep postgres"

# Check database size and usage
docker exec -it memory-postgres psql -U memory_user -d memory_db -c "SELECT pg_size_pretty(pg_database_size('memory_db'));"
```

### Troubleshooting in Production Environments

For production environments, consider these additional steps:

1. **Connection Pooling**: Use pgBouncer or similar to manage connections effectively
2. **Monitoring**: Set up monitoring with tools like Prometheus and Grafana
3. **Logging**: Configure detailed PostgreSQL logging for critical operations
4. **Backup**: Ensure regular backups to prevent data loss
5. **High Availability**: Consider replication for critical deployments

```bash
# Example of setting up more detailed logging
docker exec -it memory-postgres bash -c "echo 'log_statement = 'all'' >> /var/lib/postgresql/data/postgresql.conf"
docker exec -it memory-postgres bash -c "echo 'log_min_duration_statement = 0' >> /var/lib/postgresql/data/postgresql.conf"
docker restart memory-postgres
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

## Docker Issues

### Problem: Docker container won't start

### Solutions:

1. Check if the port is already in use:
   ```bash
   netstat -an | grep 5432
   ```

2. Check Docker logs:
   ```bash
   docker logs postgres-memory
   ```

3. Try a different port mapping:
   ```bash
   docker run -d --name postgres-memory -e POSTGRES_USER=memory_user -e POSTGRES_PASSWORD=memory_password -e POSTGRES_DB=memory_db -p 5433:5432 ankane/pgvector
   ```
   Then update your configuration to use port 5433.

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

## Still Need Help?

If you're still encountering issues:

1. Open an issue on the [project's GitHub page](https://github.com/ssmanji89/postgres-mcp-tools/issues)
2. Include detailed error logs and your system configuration
3. Describe the steps you've already taken to troubleshoot
