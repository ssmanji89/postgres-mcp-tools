/** @type {import('jest').Config} */
const config = {
  // Minimal configuration
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/basic.test.js'],
};

module.exports = config;
