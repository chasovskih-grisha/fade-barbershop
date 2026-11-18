# T-014 · Refresh Tokens: Issuance, Rotation, and Invalidation for Mobile

- **Stage**: M1 (phase 1) · **Tags**: backend, security · **Complexity**: middle · **Depends on**: T-010, T-011
- **StoryPoints**: 5

## What

- Refresh token issuance on login/sign-up alongside access token (JWT, short-lived e.g. 15m).
- Storage: secure storage on mobile / httpOnly secure cookies on web (T-011).
- Rotation endpoint (`/auth/refresh`): exchanges valid refresh token for a new pair. If an already-used/revoked refresh token is presented, trigger family invalidation (security alert / force re-login).
- Revocation on logout (`/auth/logout`) and token invalidation on password change or session termination from admin.

## Why

Access tokens expire quickly; refresh tokens allow maintaining session without re-entering credentials while allowing revocation and rotation security.

## Sources

- ADR 0005 (auth), T-010, T-011

## Done

- [ ] Refresh token migration & schema (family, revoked, expiresAt)
- [ ] Endpoint `/auth/refresh` with rotation and reuse detection
- [ ] Endpoint `/auth/logout` revoking token
- [ ] Unit & integration tests for token reuse and family revocation
