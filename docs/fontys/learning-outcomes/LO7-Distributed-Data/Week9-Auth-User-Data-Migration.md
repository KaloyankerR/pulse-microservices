# Week 9 – Auth/User Data Migration

## Goal

Design a repeatable procedure for splitting user authentication data from profile data while preserving consistency across distributed databases.

## Migration Plan

- Authored `user-service/scripts/migrate-user-to-auth-user.sql`, providing step-by-step SQL commands to copy credential records into the new auth schema and profile records into the dedicated user schema.

```15:33:user-service/scripts/migrate-user-to-auth-user.sql
INSERT INTO auth_service.users (id, email, password_hash, created_at, updated_at)
SELECT id, email, password_hash, created_at, updated_at
FROM user_service.users;

INSERT INTO auth_service.user_sessions (id, user_id, token_hash, expires_at, created_at)
SELECT id, user_id, token_hash, expires_at, created_at
FROM user_service.user_sessions;
```

- Documented verification queries to confirm record counts match across databases post-migration.
- Clarified operational notes (ID consistency, maintenance window, rollback strategy) to minimise risk.

## Distributed Data Considerations

- **Consistency:** Maintained shared UUIDs between auth and profile tables so services can reference the same user identity.
- **Separation:** Established distinct schemas (`auth_service`, `user_service`) allowing tailored access controls and backup policies.
- **Scalability:** Prepared the data layer for independent scaling of authentication storage versus social graph data.

## Impact

- Enables `auth-service` and `user-service` to operate against specialised databases without cross-contamination.
- Provides a codified migration playbook that can be replayed in staging, production, or recovery scenarios.

## Reflection

Designing the migration underscored the importance of explicit data flows when refactoring distributed systems. Future iterations will automate validation and rollback scripts, moving this learning outcome closer to Proficient while remaining at a **Beginning** self-assessment today.


