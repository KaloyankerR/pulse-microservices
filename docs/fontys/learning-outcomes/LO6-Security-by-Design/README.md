# Learning Outcome 6: Security by Design

## Executive Summary

This document demonstrates security by design principles implemented throughout the Pulse microservices platform, addressing common security risks and incorporating best practices into the entire software development process.

## 1. Security Requirements

### 1.1 Security Threat Analysis

**OWASP Top 10 Application Security Risks Addressed**:

1. **Broken Access Control** ✅
   - JWT-based authentication
   - Role-based access control (RBAC)
   - Resource-level permissions
   - Session management

2. **Cryptographic Failures** ✅
   - Password hashing with bcrypt (10 rounds)
   - TLS/HTTPS for data in transit
   - JWT signing with HMAC-SHA256
   - Sensitive data encryption

3. **Injection** ✅
   - Parameterized queries (SQL injection prevention)
   - Input validation and sanitization
   - ORM usage (Prisma, GORM)
   - NoSQL injection prevention

4. **Insecure Design** ✅
   - Security-first architecture
   - Threat modeling
   - Secure coding standards
   - Security code reviews

5. **Security Misconfiguration** ✅
   - Default credentials changed
   - Environment-based configuration
   - Secrets management
   - Security headers

6. **Vulnerable and Outdated Components** ✅
   - Regular dependency updates
   - Security scanning (npm audit, Dependabot)
   - Container image scanning
   - Vulnerability monitoring

7. **Authentication and Session Management Failures** ✅
   - Secure JWT implementation
   - Token expiration and refresh
   - Password strength requirements
   - Session invalidation

8. **Software and Data Integrity Failures** ✅
   - Code signing
   - CI/CD pipeline security
   - Dependency verification
   - Backup integrity

9. **Security Logging and Monitoring Failures** ✅
   - Comprehensive logging
   - Security event monitoring
   - Audit trails
   - Incident response procedures

10. **Server-Side Request Forgery (SSRF)** ✅
    - URL validation
    - Whitelist approach
    - Request timeouts
    - Network segmentation

## 2. Authentication Implementation

### 2.1 JWT-Based Authentication

**Implementation**:

```javascript
// JWT Token Generation
const payload = {
  id: user.id,
  email: user.email,
  username: user.username,
  role: user.role,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
};

const token = jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
```

**Security Features**:
- HMAC-SHA256 signing algorithm
- 24-hour token expiration
- Refresh token mechanism
- Token verification in all services

### 2.2 Password Security

**Hashing**:
```javascript
const bcrypt = require('bcryptjs');
const saltRounds = 10;

// Hash password
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Verify password
const isValid = await bcrypt.compare(password, hashedPassword);
```

**Requirements**:
- Minimum 8 characters
- Complexity requirements
- Salt rounds: 10
- No password storage in plain text

## 3. Authorization

### 3.1 Role-Based Access Control (RBAC)

**Roles**:
- **USER**: Standard user permissions
- **ADMIN**: Administrative permissions
- **MODERATOR**: Content moderation permissions

**Implementation**:
```javascript
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

### 3.2 Resource-Level Permissions

**User Resources**:
- Users can only modify their own profile
- Users can only delete their own posts
- Users cannot access other users' messages

**Verification**:
- JWT claims for user identification
- Resource ownership checks
- Database-level authorization

## 4. Input Validation and Sanitization

### 4.1 Request Validation

**Node.js (Joi)**:
```javascript
const schema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
});
```

**Go (Validator)**:
```go
type User struct {
    Email    string `json:"email" validate:"required,email"`
    Username string `json:"username" validate:"required,min=3,max=30"`
    Password string `json:"password" validate:"required,min=8"`
}
```

### 4.2 SQL Injection Prevention

**Parameterized Queries**:
```javascript
// Safe parameterized query
const user = await prisma.user.findUnique({
  where: { email: userEmail }
});
```

**ORM Protection**:
- Prisma for Node.js services
- GORM for Go services
- No raw SQL without parameterization
- Input sanitization

### 4.3 XSS Prevention

**Output Encoding**:
- HTML entity encoding
- Content Security Policy (CSP)
- Sanitization of user-generated content
- Framework built-in protection

## 5. API Security

### 5.1 Rate Limiting

**Implementation**:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
```

**Configuration**:
- Different limits for different endpoints
- Auth endpoints: 10 requests/min
- General endpoints: 100 requests/min
- Redis-backed rate limiting

### 5.2 CORS Configuration

**Secure CORS**:
```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200
}));
```

**Allowed Origins**:
- Development: localhost
- Production: specific domains
- No wildcard for credentials

### 5.3 API Gateway Security

**Kong Configuration**:
- Request authentication
- Rate limiting
- Request/response transformation
- IP whitelisting

## 6. Data Protection

### 6.1 Encryption in Transit

**TLS/HTTPS**:
- SSL certificates in production
- HTTPS redirect
- Secure cookie flags
- HSTS headers

### 6.2 Encryption at Rest

**Database Encryption**:
- PostgreSQL: native encryption
- MongoDB: encryption at rest
- Database backups encrypted

**Sensitive Data**:
- Password hashes (never plain text)
- JWT secrets in environment variables
- API keys in secrets management
- No logging of sensitive data

### 6.3 Data Minimization

**GDPR Compliance**:
- Collect only necessary data
- User data export capability
- Right to deletion
- Data retention policies

## 7. Secure Configuration

### 7.1 Environment Variables

**Secrets Management**:
```bash
# .env.example (no actual secrets)
JWT_SECRET=
DATABASE_URL=
REDIS_URL=
```

**Best Practices**:
- No secrets in code
- Environment-specific configuration
- Secrets rotation capability
- Kubernetes Secrets for production

### 7.2 Security Headers

**Implemented**:
```javascript
app.use(helmet());
// Sets various HTTP headers for security
```

**Headers**:
- X-Frame-Options: prevent clickjacking
- X-Content-Type-Options: prevent MIME sniffing
- X-XSS-Protection: XSS protection
- Strict-Transport-Security: force HTTPS

### 7.3 Container Security

**Best Practices**:
- Non-root user execution
- Minimal base images (Alpine)
- Image scanning for vulnerabilities
- Read-only file systems where possible

## 8. Security Monitoring

### 8.1 Logging

**Security Events**:
- Failed login attempts
- Password reset requests
- Permission denied events
- Unusual activity patterns

**Log Format**:
```javascript
logger.warn('Failed login attempt', {
  email: userEmail,
  ip: req.ip,
  timestamp: new Date()
});
```

### 8.2 Monitoring and Alerting

**Security Metrics**:
- Failed authentication count
- Rate limit hits
- Error rates
- Unusual API patterns

**Alerts**:
- Multiple failed login attempts
- High error rate
- Unusual traffic patterns
- Security vulnerability detected

## 9. Security Testing

### 9.1 Automated Security Scanning

**Tools**:
- `npm audit` for dependency vulnerabilities
- `go mod` security checks
- Snyk for vulnerability scanning
- Trivy for container scanning

**Integration**:
- CI/CD pipeline integration
- Blocking deployments on high-severity vulnerabilities
- Regular automated scans
- Security reports

### 9.2 Penetration Testing

**Areas Tested**:
- Authentication and authorization
- Input validation
- API security
- Session management
- Encryption

## 10. Incident Response

### 10.1 Security Incident Procedures

**Response Steps**:
1. Identify and contain the incident
2. Assess the impact
3. Remediate the vulnerability
4. Document and report
5. Prevent recurrence

### 10.2 Data Breach Procedures

**GDPR Compliance**:
- 72-hour breach notification
- User notification
- Impact assessment
- Remediation actions

## 11. Security Best Practices Summary

### 11.1 Implementation Checklist

- ✅ Authentication (JWT, OAuth2)
- ✅ Authorization (RBAC, resource-level)
- ✅ Input validation and sanitization
- ✅ SQL injection prevention
- ✅ XSS prevention
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Secure configuration
- ✅ Encryption (transit and rest)
- ✅ Security logging
- ✅ Vulnerability scanning
- ✅ Security headers
- ✅ Secrets management
- ✅ Regular security updates

## 12. Conclusion

Security is integrated throughout the Pulse platform:

1. **Threat Analysis**: Addressed OWASP Top 10 risks
2. **Authentication**: JWT-based with OAuth2 support
3. **Authorization**: RBAC and resource-level permissions
4. **Input Validation**: Comprehensive validation and sanitization
5. **Data Protection**: Encryption in transit and at rest
6. **Monitoring**: Security event logging and alerting
7. **Testing**: Automated security scanning
8. **Compliance**: GDPR considerations

The platform follows security by design principles, ensuring security is built into every layer of the application.

---

**Evidence**: @JWT-Authentication.md
