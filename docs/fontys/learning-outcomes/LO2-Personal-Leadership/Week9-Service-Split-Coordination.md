# Week 9 – Service Split Coordination

## Objective

Lead the restructuring effort that separated authentication into its own service while keeping the broader team productive and informed.

## Key Actions

- **Scope Definition:** Broke down the split into backend, frontend, and data migration milestones and tracked them in the weekly plan.
- **Documentation:** Authored supporting guides (`user-service/scripts/migrate-user-to-auth-user.sql`, updated `docs/weekly/Progress.md`) so contributors could follow the plan without direct supervision.
- **Frontend Alignment:** Partnered with the frontend workstream to adapt the Next.js clients to the new auth endpoints and normalised responses in `frontend/lib/api/auth.ts`.

```12:28:frontend/lib/api/auth.ts
const response = await apiClient.post<AuthResponse>(
  API_ENDPOINTS.auth.login,
  credentials
);
apiClient.setAuthTokens(
  response.data.accessToken,
  response.data.refreshToken
);
```

## Collaboration Footprint

- Shared status updates through the weekly documentation and repository structure, enabling asynchronous reviews.
- Coordinated sequencing with moderators feature work so role checks and dashboard updates landed together.

## Outcomes

- Delivered the service split without blocking dependent teams.
- Provided self-service documentation that reduces onboarding friction for future contributors.

## Reflection

Guiding the service split required proactive communication and a willingness to document decisions as they happened. The experience reinforced how clear artefacts and consistent check-ins enable the team to execute confidently, meriting a **Beginning** self-grade that I plan to improve through deeper stakeholder engagement and mentoring efforts.


