# Week 9 – Moderator Security Enforcement

## Objective

Ensure moderator capabilities are exposed securely across the stack, limiting privileged actions to authorised users only.

## Backend Controls

- Added `requireModerator` middleware checks within both `auth-service` and `user-service` routes so privileged endpoints reject non-moderators early.

```125:137:auth-service/src/middleware/auth.ts
const userRole = req.user.role || 'USER';
if (userRole !== 'MODERATOR') {
  res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'Moderator access required',
    },
  });
  return;
}
```

- Segregated moderator actions (`/users/:id/role`, `/users/:id/ban`, `/users/:id/unban`) so they live behind authenticated routes with rate limiting and logging enabled.

## Frontend Safeguards

- Updated the Next.js store and moderation page to guard access by checking `currentUser.role`. Non-moderators are redirected and cannot interact with restricted UI controls.

```29:37:frontend/app/moderator/page.tsx
if (currentUser?.role !== 'MODERATOR') {
  router.push('/');
  return;
}
```

- Moderator UI labels and confirmation dialogs reinforce awareness of privileged actions before execution.

## Security Outcomes

- Prevents elevation-of-privilege via UI manipulation since backend enforcement remains authoritative.
- Rate-limited endpoints reduce brute-force attempts against moderation actions.
- Clear audit-friendly responses (`FORBIDDEN`) assist in monitoring and incident response.

## Reflection

Implementing layered role checks across services and the frontend reinforced the habit of designing for least privilege. Continued work on audit logging and role management tooling will strengthen this area further, consistent with a **Beginning** self grade.


