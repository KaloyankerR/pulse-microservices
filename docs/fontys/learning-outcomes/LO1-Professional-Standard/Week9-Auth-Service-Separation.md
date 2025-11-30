# Week 9 – Auth Service Separation

## Overview

This week I formalised the split between account authentication and user profile management by introducing a dedicated `auth-service`. The change improves service boundaries, enforces single responsibility, and documents the migration path so the team can maintain professional-grade standards when evolving the platform.

## Implementation Summary

- Created an Express-based `auth-service` that owns registration, login, refresh, logout, moderator role updates, and user auth data retrieval.
- Shared middleware ensures consistent rate limiting, logging, metrics, and error handling across endpoints.
- Added moderator-only routes that expose administrative controls without leaking business logic into other services.

```12:27:auth-service/src/routes/auth.ts
router.post('/register', validateRequest(schemas.register), authController.register);
router.post('/login', validateRequest(schemas.login), authController.login);
router.post('/refresh', validateRequest(schemas.refreshToken), authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', authController.getCurrentUser);
router.post('/users/:id/role', requireModerator, authController.updateUserRole);
```

## Professional Practices

- **Documentation:** Auth responsibilities and migration steps are captured in `user-service/scripts/migrate-user-to-auth-user.sql`, keeping the operational handover clear.
- **Consistency:** Reused shared utilities (`logger`, `metrics`, `rateLimiter`) to align with existing service standards.
- **Testing Readiness:** Service endpoints consume validated DTOs, easing future test coverage and reducing runtime risk.

## Impact

- Reduced coupling between authentication and profile management, making future changes safer.
- Established the baseline for additional security reviews or audits focused on credential handling.
- Enabled other services to evolve independently by consuming leaner auth contracts.

## Reflection

The service split demanded disciplined scoping, documentation, and reuse of shared patterns. Delivering a complete, production-ready service while maintaining coding standards demonstrates growth in professional practice. I will continue hardening tests and documentation to elevate this work toward an Outstanding assessment.


