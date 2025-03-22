-- Create a schema for our memory system
CREATE SCHEMA IF NOT EXISTS memory;

-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a table for storing conversation memories with optimized indexes
CREATE TABLE IF NOT EXISTS memory.conversations (
    id SERIAL PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    user_id TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB,
    is_archived BOOLEAN DEFAULT FALSE,
    last_accessed TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index for faster querying by conversation_id
CREATE INDEX IF NOT EXISTS idx_conversations_conversation_id ON memory.conversations(conversation_id);

-- Create an index for faster querying by user_id
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON memory.conversations(user_id);

-- Create a vector index for similarity search
CREATE INDEX IF NOT EXISTS idx_conversations_embedding ON memory.conversations USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create an index for timestamp to optimize time-based queries
CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON memory.conversations(timestamp);

-- Create an index for archived status
CREATE INDEX IF NOT EXISTS idx_conversations_archived ON memory.conversations(is_archived) WHERE is_archived = TRUE;

-- Create a JSONB index for faster metadata queries
CREATE INDEX IF NOT EXISTS idx_conversations_metadata ON memory.conversations USING GIN (metadata);

-- Create a function to update the timestamp automatically
CREATE OR REPLACE FUNCTION memory.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.timestamp = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the timestamp
CREATE TRIGGER update_conversation_timestamp
BEFORE UPDATE ON memory.conversations
FOR EACH ROW
EXECUTE FUNCTION memory.update_timestamp();

-- Create a function to update the last_accessed timestamp
CREATE OR REPLACE FUNCTION memory.update_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_accessed = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the last_accessed timestamp
CREATE TRIGGER update_last_accessed_timestamp
BEFORE UPDATE ON memory.conversations
FOR EACH ROW
EXECUTE FUNCTION memory.update_last_accessed();

-- Create a table for application stats and metrics
CREATE TABLE IF NOT EXISTS memory.app_metrics (
    id SERIAL PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grant appropriate permissions
GRANT ALL PRIVILEGES ON SCHEMA memory TO memory_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA memory TO memory_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA memory TO memory_user;

-- Basic memory retention policy function
CREATE OR REPLACE FUNCTION memory.archive_old_memories(days_to_keep INTEGER)
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    UPDATE memory.conversations
    SET is_archived = TRUE
    WHERE 
        timestamp < NOW() - (days_to_keep * INTERVAL '1 day')
        AND is_archived = FALSE;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to automatically optimize the vector index
CREATE OR REPLACE FUNCTION memory.optimize_vector_index()
RETURNS VOID AS $$
BEGIN
    -- Vacuum the table to reclaim space and update statistics
    VACUUM ANALYZE memory.conversations;
    
    -- Log that optimization occurred
    INSERT INTO memory.app_metrics (metric_name, metric_value)
    VALUES ('vector_index_optimized', 1);
END;
$$ LANGUAGE plpgsql;
