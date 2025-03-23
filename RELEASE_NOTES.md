# Release Notes

## Version 1.0.11 (2025-03-23)

### Installation Improvements

- Fixed circular dependency issues in package.json
- Added setup-mcp-sdk script to handle MCP SDK installation
- Updated installation instructions with alternatives for dependency errors
- Improved README with comprehensive installation guidance
- Added upgrade instructions for different scenarios

### Robust Transport Layer Improvements

- Added comprehensive error handling for JSON parsing errors
- Implemented `RobustReadBuffer` for graceful handling of non-JSON messages
- Created `RobustHttpTransport` with reliable bidirectional communication
- Added standardized error handling utilities
- Improved logging for transport-related issues

### Configuration Updates

- Updated Claude Desktop configuration format to include proper PostgreSQL port (5432)
- Added explicit MCP server port configuration (3000)
- Added environment variables for production mode and logging
- Updated example configuration files with latest best practices

### Testing Framework

- Implemented Jest testing for ES modules
- Added basic tests for robust transport functionality
- Created multiple test script options for different environments
- Fixed compatibility issues between ESM and CommonJS modules

### Documentation

- Added detailed [ROBUST_TRANSPORT.md](docs/ROBUST_TRANSPORT.md) guide
- Updated [INSTALLATION.md](docs/INSTALLATION.md) with clear instructions
- Enhanced [CLAUDE_DESKTOP_SETUP.md](CLAUDE_DESKTOP_SETUP.md) with troubleshooting information
- Updated README with latest features and improvements

### Bug Fixes

- Fixed JSON parsing errors that were causing server crashes
- Improved error handling to prevent unhandled exceptions
- Fixed port configuration mismatch between PostgreSQL and MCP server
- Addressed ESM compatibility issues in the test framework

## Version 1.0.10 (2025-03-20)

### Initial Robust Transport Implementation

- Added basic error handling for JSON parsing
- Created initial implementation of robust transports
- Updated README with information about the new features

## Version 1.0.9 (2025-03-15)

### Claude Desktop Integration

- Added proper stderr logging for all debug messages
- Fixed issues with JSON-RPC protocol communication
- Updated documentation for Claude Desktop setup
