#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, execSync } from 'child_process';
import { Client } from 'pg';
import dotenv from 'dotenv';
import readline from 'readline';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables
dotenv.config({ path: path.join(rootDir, '.env') });

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Print a colored message to the console
 */
function print(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Print a section header
 */
function printHeader(message) {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.magenta}${message}${colors.reset}`);
  console.log('='.repeat(80));
}

/**
 * Ask a yes/no question and get the response
 */
async function askYesNo(question) {
  return new Promise((resolve) => {
    rl.question(`${question} (y/n): `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Ask an open question and get the response
 */
async function askQuestion(question, defaultValue = '') {
  return new Promise((resolve) => {
    const defaultPrompt = defaultValue ? ` (default: ${defaultValue})` : '';
    rl.question(`${question}${defaultPrompt}: `, (answer) => {
      resolve(answer || defaultValue);
    });
  });
}

/**
 * Check if a command is available
 */
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if Docker is running
 */
function isDockerRunning() {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get PostgreSQL connection details from the environment or user input
 */
async function getConnectionDetails() {
  printHeader('DATABASE CONNECTION DETAILS');
  
  // Get values from environment or ask the user
  const host = await askQuestion('PostgreSQL host', process.env.POSTGRES_HOST || 'localhost');
  const port = await askQuestion('PostgreSQL port', process.env.POSTGRES_PORT || '5432');
  const database = await askQuestion('PostgreSQL database', process.env.POSTGRES_DB || 'memory_db');
  const user = await askQuestion('PostgreSQL user', process.env.POSTGRES_USER || 'memory_user');
  
  // For password, don't show default value in prompt for security
  const password = await askQuestion('PostgreSQL password (leave empty to use from .env)');
  const actualPassword = password || process.env.POSTGRES_PASSWORD || '';
  
  return {
    host,
    port: parseInt(port, 10),
    database,
    user,
    password: actualPassword,
    ssl: process.env.POSTGRES_SSL === 'true'
  };
}

/**
 * Test the PostgreSQL connection
 */
async function testConnection(config) {
  printHeader('TESTING DATABASE CONNECTION');
  
  const client = new Client(config);
  
  try {
    print('Attempting to connect to PostgreSQL...', 'cyan');
    await client.connect();
    print('✅ Connection successful!', 'green');
    
    // Test query
    print('Testing query execution...', 'cyan');
    const result = await client.query('SELECT version()');
    print(`✅ Query executed successfully. PostgreSQL version: ${result.rows[0].version}`, 'green');
    
    // Check for pgvector extension
    print('Checking for pgvector extension...', 'cyan');
    try {
      const extResult = await client.query('SELECT * FROM pg_extension WHERE extname = \'vector\'');
      if (extResult.rowCount > 0) {
        print('✅ pgvector extension is installed!', 'green');
      } else {
        print('❌ pgvector extension is NOT installed!', 'yellow');
        print('You need to install the pgvector extension. Try running:', 'yellow');
        print('CREATE EXTENSION IF NOT EXISTS vector;', 'white');
      }
    } catch (error) {
      print(`❌ Error checking pgvector extension: ${error.message}`, 'red');
    }
    
    // Check for memories table
    print('Checking for memories table...', 'cyan');
    try {
      const tableResult = await client.query('SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = \'memories\')');
      if (tableResult.rows[0].exists) {
        print('✅ memories table exists!', 'green');
      } else {
        print('❌ memories table does NOT exist!', 'yellow');
        print('The database schema might not be initialized. Try running:', 'yellow');
        print('npm run init-database', 'white');
      }
    } catch (error) {
      print(`❌ Error checking memories table: ${error.message}`, 'red');
    }
    
    return true;
  } catch (error) {
    print(`❌ Connection failed: ${error.message}`, 'red');
    
    // Provide specific guidance based on the error message
    if (error.message.includes('password authentication failed')) {
      print('The provided password is incorrect or the user does not have access.', 'yellow');
      print('Check your credentials in the .env file or use the correct password when prompted.', 'yellow');
    } else if (error.message.includes('does not exist')) {
      print('The specified database or user does not exist.', 'yellow');
      print('Make sure you have created the database and user:', 'yellow');
      print('CREATE USER memory_user WITH PASSWORD \'password\';', 'white');
      print('CREATE DATABASE memory_db OWNER memory_user;', 'white');
    } else if (error.message.includes('Connection refused')) {
      print('Could not connect to the PostgreSQL server.', 'yellow');
      print('Make sure PostgreSQL is running and accessible at the specified host and port.', 'yellow');
    }
    
    return false;
  } finally {
    await client.end();
  }
}

/**
 * Check Docker container status
 */
async function checkDockerContainers() {
  printHeader('CHECKING DOCKER CONTAINERS');
  
  if (!commandExists('docker')) {
    print('❌ Docker is not installed or not in PATH.', 'red');
    return false;
  }
  
  if (!isDockerRunning()) {
    print('❌ Docker is installed but not running.', 'red');
    print('Please start Docker and try again.', 'yellow');
    return false;
  }
  
  print('✅ Docker is installed and running.', 'green');
  
  try {
    // Check for PostgreSQL container
    const containersOutput = execSync('docker ps -a --format "{{.Names}}\t{{.Status}}\t{{.Ports}}"', { encoding: 'utf8' });
    const containers = containersOutput.split('\n').filter(line => line.includes('postgres') || line.includes('memory'));
    
    if (containers.length === 0) {
      print('❌ No PostgreSQL containers found.', 'red');
      return false;
    }
    
    print('Found the following PostgreSQL-related containers:', 'cyan');
    containers.forEach(container => {
      const [name, status, ports] = container.split('\t');
      const isRunning = status.includes('Up');
      
      if (isRunning) {
        print(`✅ ${name}: ${status} (${ports})`, 'green');
      } else {
        print(`❌ ${name}: ${status} (${ports})`, 'red');
      }
    });
    
    // Check if any container is not running
    const allRunning = containers.every(container => container.split('\t')[1].includes('Up'));
    if (!allRunning) {
      print('\nSome containers are not running. Start them with:', 'yellow');
      print('docker start CONTAINER_NAME', 'white');
    }
    
    return allRunning;
  } catch (error) {
    print(`❌ Error checking Docker containers: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Generate a configuration file
 */
async function generateConfigFile(config) {
  printHeader('GENERATING CONFIGURATION FILE');
  
  try {
    const configJson = JSON.stringify({
      pgHost: config.host,
      pgPort: config.port,
      pgUser: config.user,
      pgPassword: config.password,
      pgDatabase: config.database,
      pgSsl: config.ssl,
      embeddingModel: 'mock'
    }, null, 2);
    
    const configPath = path.join(rootDir, 'postgres-mcp-config.json');
    fs.writeFileSync(configPath, configJson);
    
    print(`✅ Configuration file generated at: ${configPath}`, 'green');
    print('\nYou can use this configuration file when starting the server:', 'cyan');
    print(`postgres-memory-mcp --config="$(cat ${configPath})"`, 'white');
    
    return true;
  } catch (error) {
    print(`❌ Error generating configuration file: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Create a startup script
 */
async function createStartupScript(config) {
  printHeader('CREATING STARTUP SCRIPT');
  
  try {
    const configJson = JSON.stringify({
      pgHost: config.host,
      pgPort: config.port,
      pgUser: config.user, 
      pgPassword: config.password,
      pgDatabase: config.database,
      pgSsl: config.ssl,
      embeddingModel: 'mock'
    });
    
    const scriptContent = `#!/bin/bash
    
# Generated startup script for postgres-memory-mcp
# Created: ${new Date().toISOString()}

# Start postgres-memory-mcp with the correct configuration
postgres-memory-mcp --config='${configJson}'
`;
    
    const scriptPath = path.join(rootDir, 'start-postgres-memory.sh');
    fs.writeFileSync(scriptPath, scriptContent);
    fs.chmodSync(scriptPath, '755'); // Make executable
    
    print(`✅ Startup script generated at: ${scriptPath}`, 'green');
    print('\nYou can start the server by running:', 'cyan');
    print(scriptPath, 'white');
    
    return true;
  } catch (error) {
    print(`❌ Error creating startup script: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Initialize database schema if needed
 */
async function initializeDatabase(config) {
  printHeader('DATABASE INITIALIZATION');
  
  const client = new Client(config);
  
  try {
    await client.connect();
    
    // Check if the memories table exists
    const tableResult = await client.query('SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = \'memories\')');
    
    if (tableResult.rows[0].exists) {
      print('✅ memories table already exists.', 'green');
      return true;
    }
    
    // Check for pgvector extension
    print('Checking for pgvector extension...', 'cyan');
    const extResult = await client.query('SELECT EXISTS (SELECT FROM pg_extension WHERE extname = \'vector\')');
    
    if (!extResult.rows[0].exists) {
      print('Installing pgvector extension...', 'cyan');
      await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
      print('✅ pgvector extension installed!', 'green');
    } else {
      print('✅ pgvector extension already installed.', 'green');
    }
    
    // Create the memories table
    print('Creating memories table...', 'cyan');
    await client.query(`
      CREATE TABLE IF NOT EXISTS memories (
        id SERIAL PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        content TEXT NOT NULL,
        embedding VECTOR(1536),
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    print('✅ memories table created!', 'green');
    
    // Create indexes
    print('Creating indexes...', 'cyan');
    await client.query('CREATE INDEX IF NOT EXISTS idx_memories_conversation_id ON memories(conversation_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at);');
    
    // Add vector index
    try {
      await client.query('CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);');
      print('✅ Vector similarity index created!', 'green');
    } catch (error) {
      print(`❌ Error creating vector index: ${error.message}`, 'red');
      print('Your pgvector version might not support ivfflat indexes.', 'yellow');
      print('Try a simpler index:', 'yellow');
      print('CREATE INDEX ON memories USING hnsw (embedding vector_cosine_ops);', 'white');
    }
    
    print('\n✅ Database initialized successfully!', 'green');
    return true;
  } catch (error) {
    print(`❌ Error initializing database: ${error.message}`, 'red');
    return false;
  } finally {
    await client.end();
  }
}

/**
 * Generate Claude Desktop configuration
 */
async function generateClaudeConfig(config) {
  printHeader('CLAUDE DESKTOP CONFIGURATION');
  
  // Determine OS-specific paths
  let configDir;
  let osType = '';
  
  try {
    const platform = process.platform;
    
    if (platform === 'darwin') {
      osType = 'macOS';
      configDir = path.join(process.env.HOME, 'Library', 'Application Support', 'Claude');
    } else if (platform === 'win32') {
      osType = 'Windows';
      configDir = path.join(process.env.APPDATA, 'Claude');
    } else if (platform === 'linux') {
      osType = 'Linux';
      configDir = path.join(process.env.HOME, '.config', 'Claude');
    } else {
      print(`❌ Unsupported platform: ${platform}`, 'red');
      return false;
    }
    
    print(`Detected platform: ${osType}`, 'cyan');
    print(`Claude Desktop configuration directory: ${configDir}`, 'cyan');
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      print(`Creating Claude configuration directory: ${configDir}`, 'cyan');
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Create the Claude configuration
    const configJson = JSON.stringify({
      mcpServers: {
        postgres_memory: {
          command: "postgres-memory-mcp",
          args: [
            "--config",
            JSON.stringify({
              pgHost: config.host,
              pgPort: config.port,
              pgUser: config.user,
              pgPassword: config.password,
              pgDatabase: config.database,
              pgSsl: config.ssl,
              embeddingModel: "mock"
            })
          ]
        }
      }
    }, null, 2);
    
    const configPath = path.join(configDir, 'claude_desktop_config.json');
    fs.writeFileSync(configPath, configJson);
    
    print(`✅ Claude Desktop configuration generated at: ${configPath}`, 'green');
    print('\nPlease restart Claude Desktop for the changes to take effect.', 'cyan');
    
    return true;
  } catch (error) {
    print(`❌ Error generating Claude configuration: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Restart the PostgreSQL container (if needed)
 */
async function restartPostgres() {
  printHeader('RESTARTING POSTGRESQL');
  
  try {
    // Check for PostgreSQL container
    const containersOutput = execSync('docker ps -a --format "{{.Names}}\t{{.Status}}"', { encoding: 'utf8' });
    const postgresContainers = containersOutput.split('\n')
      .filter(line => line.includes('postgres') || line.includes('memory'))
      .map(line => ({ name: line.split('\t')[0], status: line.split('\t')[1] }));
    
    if (postgresContainers.length === 0) {
      print('❌ No PostgreSQL containers found.', 'red');
      return false;
    }
    
    for (const container of postgresContainers) {
      const isRunning = container.status.includes('Up');
      
      if (isRunning) {
        print(`Restarting container: ${container.name}...`, 'cyan');
        execSync(`docker restart ${container.name}`);
        print(`✅ Container ${container.name} restarted!`, 'green');
      } else {
        print(`Starting container: ${container.name}...`, 'cyan');
        execSync(`docker start ${container.name}`);
        print(`✅ Container ${container.name} started!`, 'green');
      }
    }
    
    print('\n✅ PostgreSQL containers restarted!', 'green');
    print('Waiting 5 seconds for PostgreSQL to initialize...', 'cyan');
    await new Promise((resolve) => setTimeout(resolve, 5000));
    
    return true;
  } catch (error) {
    print(`❌ Error restarting PostgreSQL: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  printHeader('POSTGRES MCP TOOLS DATABASE TROUBLESHOOTER');
  print('This tool will help you diagnose and fix database connection issues.', 'cyan');
  
  try {
    // Check if Docker is available and running
    const dockerAvailable = await checkDockerContainers();
    
    if (dockerAvailable) {
      const restartNeeded = await askYesNo('Would you like to restart the PostgreSQL container(s)?');
      
      if (restartNeeded) {
        await restartPostgres();
      }
    } else {
      print('Docker containers not available or not running.', 'yellow');
      print('Make sure your PostgreSQL server is running manually.', 'yellow');
    }
    
    // Get connection details
    const config = await getConnectionDetails();
    
    // Test the connection
    const connectionSuccessful = await testConnection(config);
    
    if (connectionSuccessful) {
      // Check if database initialization is needed
      const initializeNeeded = await askYesNo('Would you like to initialize or verify the database schema?');
      
      if (initializeNeeded) {
        await initializeDatabase(config);
      }
      
      // Generate configuration file
      const generateConfig = await askYesNo('Would you like to generate a configuration file?');
      
      if (generateConfig) {
        await generateConfigFile(config);
      }
      
      // Create startup script
      const createScript = await askYesNo('Would you like to create a startup script?');
      
      if (createScript) {
        await createStartupScript(config);
      }
      
      // Generate Claude Desktop configuration
      const generateClaude = await askYesNo('Would you like to generate Claude Desktop configuration?');
      
      if (generateClaude) {
        await generateClaudeConfig(config);
      }
      
      print('\n✅ Database troubleshooting completed successfully!', 'green');
      print('You can now start the PostgreSQL MCP server with your configuration.', 'cyan');
    } else {
      print('\n❌ Database connection failed. Please fix the issues and try again.', 'red');
      
      // Suggest creating a Docker container if no containers are running
      if (!dockerAvailable) {
        const createContainer = await askYesNo('Would you like to create a new PostgreSQL Docker container?');
        
        if (createContainer) {
          const password = config.password || Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
          
          print('\nCreating a new PostgreSQL container with pgvector...', 'cyan');
          print(`Using password: ${password}`, 'yellow');
          
          try {
            execSync(`docker run -d --name memory-postgres \
              -e POSTGRES_USER=${config.user} \
              -e POSTGRES_PASSWORD="${password}" \
              -e POSTGRES_DB=${config.database} \
              -p ${config.port}:5432 \
              ankane/pgvector`, { stdio: 'inherit' });
            
            print('\n✅ PostgreSQL container created!', 'green');
            print('Waiting 5 seconds for PostgreSQL to initialize...', 'cyan');
            await new Promise((resolve) => setTimeout(resolve, 5000));
            
            // Update config with the new password
            config.password = password;
            
            // Test the connection again
            print('\nTesting connection with the new container...', 'cyan');
            const newConnectionSuccessful = await testConnection(config);
            
            if (newConnectionSuccessful) {
              // Initialize the database
              await initializeDatabase(config);
              
              // Generate configuration file
              await generateConfigFile(config);
              
              // Create startup script
              await createStartupScript(config);
              
              // Generate Claude Desktop configuration
              const generateClaude = await askYesNo('Would you like to generate Claude Desktop configuration?');
              
              if (generateClaude) {
                await generateClaudeConfig(config);
              }
              
              print('\n✅ Database setup completed successfully!', 'green');
              print('You can now start the PostgreSQL MCP server with your configuration.', 'cyan');
            }
          } catch (error) {
            print(`❌ Error creating PostgreSQL container: ${error.message}`, 'red');
          }
        }
      }
    }
  } catch (error) {
    print(`❌ Error during troubleshooting: ${error.message}`, 'red');
  } finally {
    rl.close();
  }
}

// Run the main function
main().catch((error) => {
  print(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
