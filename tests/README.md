# PostgreSQL MCP Tools Tests

This directory contains tests for the PostgreSQL MCP Tools, with a focus on the robust transport layer.

## Running Tests

To run all tests:

```bash
npm test
```

To run only the transport tests:

```bash
npm run test:transport
```

To run a simple test that verifies the Jest configuration:

```bash
npm run test:simple
```

To run a minimal test with basic assertions:

```bash
npm run test:basic
```

To use an alternate Jest configuration:

```bash
npm run test:alt
```

## Test Files

### robust-transport.test.js

Tests the robust transport implementation, specifically:

- `RobustReadBuffer` - Tests the buffer's ability to handle JSON and non-JSON messages
- Error handling - Tests the graceful handling of JSON parse errors

## Setting Up Test Environment

If you encounter any issues with the test environment, run:

```bash
npm run update-deps
```

This will install all necessary test dependencies, including:

- Jest
- Babel
- TypeScript support for Jest
- Type definitions

## Writing New Tests

When adding new tests:

1. Add the test file to this directory
2. If testing TypeScript code, use mocks rather than direct imports to avoid transpilation issues
3. Update the package.json scripts if needed

## Troubleshooting

If you encounter test failures:

1. Ensure all dependencies are installed: `npm install && npm run update-deps`
2. Clear the Jest cache: `npx jest --clearCache`
3. Run tests with the verbose flag: `npx jest --verbose --config=jest.config.cjs`

### Common Issues

#### ES Module Issues

This project uses ES modules (`"type": "module"` in package.json), which can cause issues with Jest. The current configuration uses:

- CommonJS configuration files: `jest.config.cjs` and `babel.config.cjs`
- `NODE_OPTIONS=--experimental-vm-modules` to allow Jest to handle ES modules

If you see errors like:

```
ReferenceError: module is not defined in ES module scope
```

Make sure you're using the CJS configuration files with the `--config=jest.config.cjs` flag.

#### Test Files with Direct Imports

The tests use mock implementations rather than direct imports to avoid transpilation issues with TypeScript and ES modules. If you need to test actual implementations:

1. Create mocks that mirror the real implementation
2. Use Jest's mocking system: `jest.mock()`
3. Keep test files focused on behavior rather than implementation details

For module resolution issues, check the Jest and Babel configuration files:

- jest.config.cjs
- babel.config.cjs
