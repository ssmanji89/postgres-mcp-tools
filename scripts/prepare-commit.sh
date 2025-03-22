#!/bin/bash

# Script to prepare commit with all changes
# Created: March 22, 2025

echo "Preparing commit with all troubleshooting fixes..."

# Change to the project root directory
cd "$(dirname "$0")/.."

# Add all new and modified files to git staging
git add scripts/fix-mcp-server.sh
git add scripts/fix-postgres-auth.sh
git add scripts/run-with-config.sh
git add scripts/prepare-commit.sh
git add docs/TROUBLESHOOTING.md
git add package.json
git add README.md

# Commit with a descriptive message
git commit -m "Fix: Resolve PostgreSQL authentication issues and improve troubleshooting

- Add scripts to fix PostgreSQL authentication method configuration
- Create utilities for running MCP server with correct credentials
- Update documentation with comprehensive troubleshooting steps
- Add npm scripts for common troubleshooting tasks
- Organize troubleshooting tools in scripts directory"

echo "Commit prepared! You can now push with: git push origin main"
echo "Or create a pull request from your branch."
echo ""
echo "The version in package.json is $(grep version package.json | cut -d'"' -f4)"
echo "To publish to npm, run: npm version patch && npm publish"
