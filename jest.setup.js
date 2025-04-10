// Mock environment variables
process.env.MONGO_COLLECTION = 'comments';
process.env.MONGO_DB = 'test';
process.env.FB_ACCESS_TOKEN = 'test_token';

// Global beforeAll hook
beforeAll(() => {
  // Add any global setup here
});

// Global afterAll hook
afterAll(() => {
  // Add any global cleanup here
});

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({})
  })
);

// Suppress console.error during tests
console.error = jest.fn();
