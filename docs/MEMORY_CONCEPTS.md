# Memory Concepts

This document explains key concepts of the vector-based memory system used in PostgreSQL MCP Tools.

## Vector Embeddings

Vector embeddings are numerical representations of text that capture semantic meaning. In this system:

- **Dimension**: Typically 1536-dimensional vectors
- **Similarity**: Measured using cosine similarity
- **Semantic Understanding**: Similar meanings have similar vectors

### How Embeddings Work

When text is processed:

1. The text is sent to an embedding model (OpenAI, Anthropic, or mock)
2. The model returns a vector representation
3. This vector is stored alongside the text
4. Searches compare vector similarity rather than text matching

This approach enables:

- **Semantic Search**: Finding conceptually similar content
- **Fuzzy Matching**: Handling variations in wording
- **Concept Association**: Connecting related ideas

## Memory Organization

Memories are organized around:

### Conversation Context

- **Conversation ID**: Groups memories by conversation
- **User ID**: Associates memories with specific users
- **Timestamp**: Records when memories were created
- **Content**: The actual text of the memory
- **Metadata**: Additional information about the memory

### Vector Search

- **Similarity Search**: Finds memories with similar meaning
- **Relevance Ranking**: Returns the most relevant memories first
- **Threshold Filtering**: Only returns sufficiently similar results

## Memory Lifecycle

Memories follow a lifecycle:

1. **Creation**: New information is saved with embeddings
2. **Retrieval**: Relevant memories are fetched based on query
3. **Archiving**: Older memories are marked as archived
4. **Optimization**: Vector indexes are optimized periodically

## Memory Types

The system supports different types of memories:

### Factual Memories

- Specific information shared by the user
- Example: "My favorite color is blue"
- High precision retrieval is critical

### Conversational Context

- General discussion topics and themes
- Example: "We were discussing database technologies"
- Broader semantic matching is useful

### Long-term Preferences

- Persistent user preferences
- Example: "I prefer technical explanations"
- Should persist across multiple conversations

## Semantic Search

The heart of the memory system is semantic search:

### Search Process

1. Convert the current query to a vector embedding
2. Compare this vector to all stored memory vectors
3. Calculate similarity scores using cosine similarity
4. Return memories above a similarity threshold
5. Rank results by relevance

### Search Parameters

- **Max Results**: Limits the number of memories returned
- **Similarity Threshold**: Sets minimum relevance
- **Scope**: Filters by conversation or user ID
- **Archived Status**: Includes or excludes archived memories

## Vector Database Implementation

The system uses PostgreSQL with pgvector:

### pgvector Extension

- Enables vector operations in PostgreSQL
- Provides indexing for efficient similarity search
- Supports both L2 distance and cosine similarity

### Indexing

- **IVFFlat**: Inverted file with flat quantization
- **Index Lists**: Optimized for vector search operations
- **Index Maintenance**: Regular optimization needed

## Memory Management

The system provides tools for memory management:

### Listing

- View memories for a conversation
- See similarity scores for current context
- Inspect metadata and timestamps

### Archiving

- Mark old memories as archived
- Remove irrelevant or outdated information
- Manage storage growth

### Optimization

- Rebuild vector indexes
- Vacuum the database
- Optimize query performance

## Privacy and Data Retention

Important considerations for memory systems:

- **Data Ownership**: User data remains under user control
- **Retention Policies**: Configure how long memories are kept
- **Privacy Controls**: Ability to delete specific memories
- **Data Isolation**: Separate memories by user and conversation

## Memory Limitations

Current limitations of the system:

- **Context Window**: Limited by Claude's context window size
- **Retrieval Accuracy**: Depends on embedding quality
- **Cold Start**: New systems have limited historical context
- **Embedding Drift**: Models may change over time

## Best Practices

Recommendations for optimal memory usage:

- **Regular Maintenance**: Schedule routine database optimization
- **Clear Identification**: Use consistent conversation and user IDs
- **Targeted Retrieval**: Use specific queries for better results
- **Balanced Context**: Return enough context without overwhelming

## Advanced Concepts

### Multi-context Retrieval

- Combine memories from different conversations
- Weight relevance based on recency and similarity
- Balance broad context with specific details

### Memory Hierarchies

- Organize memories in hierarchical structures
- Differentiate between facts, preferences, and history
- Create memory "categories" for better organization

### Active Learning

- Improve memory retrieval based on user feedback
- Adjust similarity thresholds dynamically
- Learn from retrieval successes and failures

## Future Directions

Potential enhancements for future versions:

- **Hybrid Search**: Combine vector and keyword search
- **Memory Summarization**: Condense repeated information
- **Multi-vector Representations**: Multiple embeddings per memory
- **Structured Memory**: More complex memory relationships
- **Cross-modality**: Support for images and other content types
