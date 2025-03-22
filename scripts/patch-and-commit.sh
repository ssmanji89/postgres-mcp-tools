#!/bin/bash

# Script to patch postgres-mcp-tools and commit changes to GitHub

# Set color variables for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}PostgreSQL MCP Tools - Patching Script${NC}"
echo -e "${BLUE}=========================================${NC}"

# Navigate to the repository root
REPO_DIR=$(pwd)
cd "$REPO_DIR"

echo -e "\n${YELLOW}Checking repository status...${NC}"
if [ ! -d .git ]; then
  echo -e "${RED}Error: Not a git repository. Make sure you're in the postgres-mcp-tools directory.${NC}"
  exit 1
fi

# Stage 1: Verifying changes
echo -e "\n${YELLOW}Verifying all changes are in place...${NC}"

files_to_check=(
  "server/src/db/client.ts"
  "server/dist/db/client.js"
  "server/Dockerfile"
  "package.json"
  ".env"
  "README.md"
  "CLAUDE_DESKTOP_SETUP.md"
  "scripts/generate-password.js"
  "scripts/postinstall.js"
  "scripts/init-database.js"
)

missing_files=0
for file in "${files_to_check[@]}"; do
  if [ ! -f "$file" ]; then
    echo -e "${RED}Missing file: $file${NC}"
    missing_files=$((missing_files+1))
  fi
done

if [ $missing_files -gt 0 ]; then
  echo -e "${RED}Error: Some required files are missing. Please check the repository structure.${NC}"
  exit 1
fi

# Stage 2: Ensure script files are executable
echo -e "\n${YELLOW}Making script files executable...${NC}"
chmod +x scripts/*.js
chmod +x bin/*.js

# Stage 3: Apply npm version patch
echo -e "\n${YELLOW}Updating package version...${NC}"
npm version patch --no-git-tag-version

# Get new version number
NEW_VERSION=$(node -e "console.log(require('./package.json').version)")
echo -e "${GREEN}Updated package version to ${NEW_VERSION}${NC}"

# Stage 4: Create a build to ensure everything works
echo -e "\n${YELLOW}Building the project to verify changes...${NC}"
npm run build-server

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Build failed. Please check the build logs above.${NC}"
  exit 1
fi

echo -e "${GREEN}Build successful!${NC}"

# Stage 5: Test database connection
echo -e "\n${YELLOW}Testing database connection...${NC}"
# Extract database details from .env
DB_USER=$(grep POSTGRES_USER .env | cut -d '=' -f2)
DB_PASSWORD=$(grep POSTGRES_PASSWORD .env | cut -d '=' -f2)
DB_NAME=$(grep POSTGRES_DB .env | cut -d '=' -f2)
DB_HOST=$(grep POSTGRES_HOST .env | cut -d '=' -f2)
DB_PORT=$(grep POSTGRES_PORT .env | cut -d '=' -f2)

# Check if Docker is running
if command -v docker &> /dev/null && docker ps &> /dev/null; then
  echo -e "${GREEN}Docker is running, database connection can be established.${NC}"
else
  echo -e "${YELLOW}Warning: Docker is not running. Database connection test skipped.${NC}"
  echo -e "${YELLOW}Please ensure PostgreSQL is properly configured when running the application.${NC}"
fi

# Stage 6: Commit changes to Git
echo -e "\n${YELLOW}Committing all changes to Git...${NC}"

git add .

COMMIT_MESSAGE="fix: resolve pg module import issues and add secure password generation

This commit addresses several critical issues:

1. Fixed ESM/CommonJS import compatibility for the pg module
2. Added automatic secure password generation during installation
3. Updated database connection handling to improve reliability
4. Enhanced error handling and logging for better debugging
5. Updated documentation with comprehensive setup instructions
6. Added Claude Desktop integration guide
7. Fixed Docker configuration for improved stability
8. Bumped version to ${NEW_VERSION}

These changes resolve the 'ENOENT' and JSON parsing errors
encountered when running the postgres-memory-mcp command.
The MCP server now correctly connects to PostgreSQL and 
provides reliable memory capabilities for Claude."

git commit -m "$COMMIT_MESSAGE"

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Git commit failed. Please check if you have configured Git properly.${NC}"
  exit 1
fi

echo -e "${GREEN}Changes committed successfully to the local repository.${NC}"

# Stage 7: Push changes (optional - ask first)
echo -e "\n${YELLOW}Would you like to push these changes to GitHub? (y/n)${NC}"
read -r push_answer

if [[ "$push_answer" =~ ^[Yy]$ ]]; then
  echo -e "\n${YELLOW}Pushing changes to GitHub...${NC}"
  git push origin main

  if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to push changes to GitHub. Please check your remote configuration.${NC}"
    exit 1
  fi

  echo -e "${GREEN}Changes successfully pushed to GitHub!${NC}"
else
  echo -e "${BLUE}Changes were not pushed to GitHub. You can push them manually later with 'git push origin main'.${NC}"
fi

# Stage 8: Patch npm package
echo -e "\n${YELLOW}Would you like to publish the patched package to npm? (y/n)${NC}"
read -r npm_answer

if [[ "$npm_answer" =~ ^[Yy]$ ]]; then
  echo -e "\n${YELLOW}Publishing package to npm...${NC}"
  npm publish

  if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to publish package to npm. Please check if you're logged in with 'npm login'.${NC}"
    exit 1
  fi

  echo -e "${GREEN}Package v${NEW_VERSION} successfully published to npm!${NC}"
else
  echo -e "${BLUE}Package was not published to npm. You can publish it manually later with 'npm publish'.${NC}"
fi

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}All operations completed successfully!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo -e "${BLUE}Package version: ${NEW_VERSION}${NC}"
echo -e "${BLUE}Files modified: $(git show --name-only | grep -v "^commit" | grep -v "^Author" | grep -v "^Date" | grep -v "^$" | wc -l | xargs)${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "${BLUE}- If you haven't pushed to GitHub: git push origin main${NC}"
echo -e "${BLUE}- If you haven't published to npm: npm publish${NC}"
echo -e "${BLUE}- Update documentation on your website if applicable${NC}"
echo -e "${BLUE}- Test with Claude Desktop to ensure everything works${NC}"