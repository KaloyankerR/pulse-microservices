const { generalLimiter, authLimiter, userLimiter } = require('../../src/middleware/rateLimiter');

describe('Rate Limiter Middleware', () => {
  it('should export generalLimiter', () => {
    expect(generalLimiter).toBeDefined();
    expect(typeof generalLimiter).toBe('function');
  });

  it('should export authLimiter', () => {
    expect(authLimiter).toBeDefined();
    expect(typeof authLimiter).toBe('function');
  });

  it('should export userLimiter', () => {
    expect(userLimiter).toBeDefined();
    expect(typeof userLimiter).toBe('function');
  });
});

