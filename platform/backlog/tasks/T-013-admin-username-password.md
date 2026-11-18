# T-013 · Admin Login via Username and Password

- **Stage**: M1 (phase 1) · **Tags**: backend, frontend, security · **Complexity**: middle · **Depends on**: T-010, T-011, T-012
- **StoryPoints**: 5

## What

Founder login to the admin dashboard — **username + password** (not public phone OTP). Admin credentials (`username`, `passwordHash`) are stored in DB on `User`. New `POST /admin/auth/login` accepts `{ username, password }`, verifies `admin` role, issues admin session (cookie `admin.fade.com.ua`), and returns token. Client OTP login (ADR 0005) remains unchanged and cannot create admin.

## Why

Admin panel is the founder's privileged context. Phone OTP remains for `client`; for `admin`, a password is a more reliable gate, and username does not expose phone numbers in logs and URLs. Implements gate `MNG-ADM-18` and phase 1 checklist ("founder by seed, not first one who logged in").

## Sources

- `admin-screens.md` §0 (login `admin.fade.com.ua`), `identity` README, ADR 0005/0017
- backlog `T-020` (admin shell and login), `T-012` (roles and founder seed)

## Done

- [x] Admin logs in via username + password; public OTP does not create `admin` role
- [x] Passwords are stored only as a scrypt hash with salt, never in plaintext
- [x] Invalid credentials → 401; non-admin account → 403; success → admin cookie + `/admin/auth/me`
- [x] e2e test for login flow (success, incorrect password, non-admin)

## Risks

- [x] **Migrations**: schema changes break existing data — migration with backfill plan (username/passwordHash — nullable)
- [ ] **Security**: brute-force protection — rate-limit at deployment level / T-300; role check at API level, not just UI
