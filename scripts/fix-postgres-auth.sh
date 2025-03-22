#!/bin/bash

# Script to fix PostgreSQL authentication issues
# Created: March 22, 2025

echo "Fixing PostgreSQL authentication configuration..."

# Update pg_hba.conf to allow password authentication from localhost
docker exec memory-postgres bash -c "cat > /tmp/pg_hba.conf << EOF
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# Local connections
local   all             all                                     trust
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
host    all             all             localhost               md5

# Allow all users from all hosts to connect via password
host    all             all             all                     md5

# Allow replication connections
local   replication     all                                     trust
host    replication     all             127.0.0.1/32            md5
host    replication     all             ::1/128                 md5
EOF"

# Replace the pg_hba.conf file
docker exec memory-postgres bash -c "cp /tmp/pg_hba.conf /var/lib/postgresql/data/pg_hba.conf && chmod 600 /var/lib/postgresql/data/pg_hba.conf && chown postgres:postgres /var/lib/postgresql/data/pg_hba.conf"

# Reload PostgreSQL configuration
docker exec memory-postgres bash -c "pg_ctl reload -D /var/lib/postgresql/data"

echo "PostgreSQL authentication configuration updated!"
echo "Testing connection..."

# Test connection
docker exec memory-postgres bash -c "psql -U memory_user -d memory_db -c \"SELECT 'Connection successful!';\""

echo "Now try running your MCP server with:"
echo "./run-with-config.sh"
