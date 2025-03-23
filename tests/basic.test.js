// @jest-environment node

// Basic test suite for verifying Jest configuration
test('Basic functionality test', () => {
  expect(1 + 1).toBe(2);
});

test('JSON parsing test', () => {
  const data = JSON.parse('{"name":"test"}');
  expect(data.name).toBe('test');
});

test('Buffer functionality test', () => {
  const buf = Buffer.from('hello');
  expect(buf.toString()).toBe('hello');
});
