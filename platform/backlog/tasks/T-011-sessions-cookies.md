# T-011 · Sessions: Shared Client Cookie and Isolated Admin Cookie

- **Stage**: M1 (phase 1) · **Tags**: backend · **Complexity**: junior · **Depends on**: T-010
- **StoryPoints**: 3

## What

- Client web session — cookie with **`Domain=.fade.com.ua`**, `HttpOnly`, `Secure`, `SameSite=Lax`: storefront and `shop.fade.com.ua` read **the exact same session** (login anywhere = login everywhere).
- Admin session — separate cookie only on `admin.fade.com.ua` (not parent — privileged domain does not flicker on public hosts).
- Mobile — bearer tokens; `RevokeSession` invalidates session for all hosts at once (single source of truth — `identity`).

## Why

Key decision of ADR 0017: shared authorization site ↔ shop without SSO server; established in phase 1 so that the shop (phase 27) does not carry separate authorization.

## Sources

- **ADR 0017** §3 (session on parent domain; rejected alternatives); ADR 0005 (sessions by surfaces)
- `identity` README (section "Shared Web Product Session")

## Done

- [x] Cookie semantics per ADR 0017; logout applies to all hosts
- [x] Admin session not visible on public domains

## Risks

- [ ] **Cookie domain**: `.fade.com.ua` shared session — "login everywhere" test (storefront risk in registry)
- [ ] **Secure/HttpOnly/SameSite**: CSRF profile fixed
