const swaggerSpecs = require('../../src/config/swagger');

describe('Swagger Configuration', () => {
  it('should export swagger specs', () => {
    expect(swaggerSpecs).toBeDefined();
  });

  it('should have openapi version', () => {
    expect(swaggerSpecs.openapi).toBe('3.0.0');
  });

  it('should have api info', () => {
    expect(swaggerSpecs.info).toBeDefined();
    expect(swaggerSpecs.info.title).toBe('Pulse User Service API');
    expect(swaggerSpecs.info.version).toBe('1.0.0');
  });

  it('should have servers configured', () => {
    expect(swaggerSpecs.servers).toBeDefined();
    expect(Array.isArray(swaggerSpecs.servers)).toBe(true);
    expect(swaggerSpecs.servers.length).toBeGreaterThan(0);
  });

  it('should have security schemes defined', () => {
    expect(swaggerSpecs.components).toBeDefined();
    expect(swaggerSpecs.components.securitySchemes).toBeDefined();
    expect(swaggerSpecs.components.securitySchemes.bearerAuth).toBeDefined();
    expect(swaggerSpecs.components.securitySchemes.bearerAuth.type).toBe('http');
    expect(swaggerSpecs.components.securitySchemes.bearerAuth.scheme).toBe('bearer');
  });

  it('should have schemas defined', () => {
    expect(swaggerSpecs.components.schemas).toBeDefined();
    expect(swaggerSpecs.components.schemas.User).toBeDefined();
    expect(swaggerSpecs.components.schemas.RegisterRequest).toBeDefined();
    expect(swaggerSpecs.components.schemas.LoginRequest).toBeDefined();
  });
});

