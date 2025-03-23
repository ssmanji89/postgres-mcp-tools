// Convert to ES module format
export default {
  // Tell Jest to handle ES modules
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  // Add support for TypeScript
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Configure module paths
  moduleDirectories: ['node_modules', 'src'],
  // Handle file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Ignore certain paths
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  // Specifically tell Jest to treat these files as ESM
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs'],
  // Transform patterns
  transformIgnorePatterns: [
    // Allow transpilation of node_modules for ES modules
    'node_modules/(?!(module-that-needs-to-be-transformed)/)',
  ],
  // For handling import.meta
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};
