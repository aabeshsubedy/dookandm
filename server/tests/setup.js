// Test environment defaults — set BEFORE any app module imports env.js.
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-that-is-long-enough-12345';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-long-enough-12345';
process.env.TOKEN_ENCRYPTION_KEY =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.META_TEST_MODE = 'true';
process.env.LOG_LEVEL = 'silent';
