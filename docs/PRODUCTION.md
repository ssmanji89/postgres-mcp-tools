# Production Deployment Guide

This guide provides instructions for deploying the PostgreSQL MCP Tools in a production environment.

## Production Architecture

A production deployment typically consists of:

1. **PostgreSQL Database**: A managed PostgreSQL instance with pgvector support
2. **MCP Server**: One or more instances behind a load balancer
3. **Monitoring**: Logging and alerting for system health
4. **Security**: Authentication, HTTPS, and other security measures

## Database Deployment

### Option 1: Managed PostgreSQL Service

The recommended approach is to use a managed PostgreSQL service that supports pgvector:

- **AWS RDS**: Use the PostgreSQL-compatible Aurora with pgvector extension
- **Azure Database for PostgreSQL**: Supports pgvector extension
- **Google Cloud SQL**: Supports pgvector extension
- **Supabase**: Comes with pgvector pre-installed

Steps:
1. Create a PostgreSQL instance (version 14 or higher)
2. Enable the pgvector extension
3. Run the initialization script from `init/01-init.sql`
4. Configure backups and monitoring

### Option 2: Self-Hosted PostgreSQL

If you prefer self-hosting:

1. Use the provided Docker Compose file as a starting point:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

2. Configure PostgreSQL for production:
```sql
-- Example production settings
ALTER SYSTEM SET max_connections = '100';
ALTER SYSTEM SET shared_buffers = '1GB';
ALTER SYSTEM SET effective_cache_size = '3GB';
ALTER SYSTEM SET maintenance_work_mem = '256MB';
ALTER SYSTEM SET random_page_cost = '1.1';
ALTER SYSTEM SET work_mem = '20MB';
```

3. Set up proper backup procedures:
```bash
# Example backup script
pg_dump -h localhost -U memory_user -d memory_db -F c -f backup.dump
```

## MCP Server Deployment

### Option 1: Docker Deployment

1. Use the provided Dockerfile to build a production image:

```bash
docker build -t postgres-mcp-server:latest ./server
```

2. Run the container with production settings:

```bash
docker run -d \
  --name mcp-server \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e POSTGRES_HOST=your-db-host \
  -e POSTGRES_PORT=5432 \
  -e POSTGRES_DB=memory_db \
  -e POSTGRES_USER=memory_user \
  -e POSTGRES_PASSWORD=your-secure-password \
  -e POSTGRES_SSL=true \
  -e LOG_LEVEL=info \
  -e EMBEDDING_MODEL=openai \
  -e OPENAI_API_KEY=your-openai-key \
  postgres-mcp-server:latest
```

### Option 2: Cloud Deployment

Deploy to a cloud platform:

#### AWS Elastic Beanstalk

1. Initialize an EB application:
```bash
eb init
```

2. Configure environment variables in the EB console
3. Deploy the application:
```bash
eb deploy
```

#### Google Cloud Run

1. Build and push the container:
```bash
gcloud builds submit --tag gcr.io/your-project/mcp-server
```

2. Deploy to Cloud Run:
```bash
gcloud run deploy mcp-server \
  --image gcr.io/your-project/mcp-server \
  --platform managed \
  --set-env-vars POSTGRES_HOST=your-db-host,...
```

### Option 3: Kubernetes Deployment

For larger deployments, use Kubernetes:

1. Create a Kubernetes deployment file:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mcp-server
  template:
    metadata:
      labels:
        app: mcp-server
    spec:
      containers:
      - name: mcp-server
        image: postgres-mcp-server:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        # Add other environment variables
        resources:
          limits:
            cpu: "1"
            memory: "1Gi"
          requests:
            cpu: "500m"
            memory: "512Mi"
```

2. Apply the deployment:
```bash
kubectl apply -f mcp-server-deployment.yaml
```

## Security Considerations

### Database Security

1. **Use strong passwords**: Generate secure passwords for database users
2. **Enable SSL**: Set `POSTGRES_SSL=true` to encrypt database connections
3. **Use IAM roles**: When possible, use IAM roles instead of password authentication
4. **Restrict network access**: Use VPCs or network policies to limit database access

### MCP Server Security

1. **HTTPS**: Deploy behind a reverse proxy (Nginx, Traefik) with HTTPS enabled
2. **Authentication**: Implement API authentication for the MCP endpoints
3. **Rate limiting**: Add rate limiting to prevent abuse
4. **Environment variables**: Store sensitive information in environment variables or secrets management systems

Example Nginx configuration with HTTPS:

```nginx
server {
    listen 443 ssl;
    server_name mcp.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Monitoring and Maintenance

### Monitoring

1. **Database monitoring**:
   - Set up alerts for high CPU/memory usage
   - Monitor disk space and connection count
   - Set up slow query logging

2. **MCP Server monitoring**:
   - Use a monitoring service like New Relic, Datadog, or Prometheus
   - Monitor API response times and error rates
   - Set up alerting for critical issues

### Maintenance

1. **Regular backups**: Set up automated database backups
2. **Database optimization**: Regularly run:
   ```sql
   SELECT memory.optimize_vector_index();
   ```

3. **Archive old memories**: Schedule regular archiving:
   ```sql
   SELECT memory.archive_old_memories(90);
   ```

4. **Log rotation**: Configure log rotation to prevent disk space issues

## Scaling Considerations

### Database Scaling

1. **Vertical scaling**: Increase database instance size for better performance
2. **Read replicas**: Set up read replicas for scaling read operations
3. **Sharding**: For very large deployments, consider sharding by conversation_id

### MCP Server Scaling

1. **Horizontal scaling**: Deploy multiple instances behind a load balancer
2. **Caching**: Implement response caching for frequently accessed memories
3. **Connection pooling**: Tune database connection pool settings

## High Availability Setup

For mission-critical deployments:

1. **Database HA**: Use a managed PostgreSQL service with HA capability
2. **Multi-region deployment**: Deploy the MCP server across multiple regions
3. **Failover procedures**: Implement automated failover mechanisms
4. **Disaster recovery**: Maintain cross-region backups and recovery procedures

## Cost Optimization

1. **Right-size resources**: Adjust instance sizes based on actual usage
2. **Archive old data**: Implement lifecycle policies for old memories
3. **Serverless options**: Consider serverless deployment for variable workloads
