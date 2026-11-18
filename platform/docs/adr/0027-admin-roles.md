# ADR 0027: Admin Role Model

## Status
**Proposed** — draft registered to give backlog tasks (T-2400 family) a citable ID. Decision expected at task kickoff (M5). Until accepted, source of truth: identity README (single `admin` role) + AC 04.

## Context
v1 ships a **single privileged role**: `Role = client | barber | admin` (identity README); `AdminLogin` (username + password) issues an `admin`-channel session on a separate cookie (ADR 0017). AC 04 states explicitly: «засновник (роль `admin`, єдина у v1)».

T-2400 (M5) introduces tiered admin access: супер-адмін, менеджер, барбер — with per-section UI filtering, API endpoint protection, and role-based test coverage. The open questions:

- **Option A — single `admin` role forever**: simplest; viable only while the founder is the sole admin user.
- **Option B — role tiers** (супер-адмін / менеджер / барбер): fixed enum roles with a static permission matrix; matches T-2400's current scope.
- **Option C — permission-based RBAC**: named permissions checked at API/UI layer; more flexible, more machinery (grant UI, audit of grants via `RoleGranted`/`RoleRevoked`).

Related decisions to settle together: whether barber mobile access piggybacks on the admin model or stays on the existing `barber` role; where the permission matrix lives (code constant vs DB-backed settings, cf. MNG-ADM-18 integration settings); audit requirements for privilege changes.

## Decision
None yet — **proposed**. Recommendation to evaluate at kickoff: **Option B** as the minimum that satisfies T-2400's stated scope, with the permission matrix as a code constant (no runtime editing) to avoid premature RBAC machinery.

## Consequences
- T-2400a (model), T-2400b (UI filtering), T-2400c (API protection) depend on the chosen option.
- Additional admin roles must reuse the existing `AdminLogin`/`Session` machinery on the `admin` channel — no parallel auth path (ADR 0005 covers clients only).
- Permission changes need audit events (`RoleGranted`/`RoleRevoked` already exist in the identity event list).
- UI navigation and API guards must derive from one shared permission map, not duplicate role checks.

## References
- `apps/api/src/identity/README.md` (Role, Session, AdminLogin, RoleGranted/RoleRevoked)
- AC 04 (`04-admin-management.md` — «роль admin, єдина у v1»), MNG-ADM-18 (settings)
- T-2400 family; seed: T-2104a (admin seed)
- ADR 0005 (client OTP — out of scope here), ADR 0017 (separate admin session/cookie)
