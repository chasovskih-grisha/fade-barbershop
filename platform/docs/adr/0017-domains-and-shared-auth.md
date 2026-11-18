# ADR 0017: Fade domains and shared auth between products

- Status: accepted (**revision 2026-09-21**: base zone — `fade.com.ua`; **revision 2026-10-01**: `book.fade.com.ua` not a product)
- Date: 2026-09-14 (revision: 2026-09-21)
- Contexts: `identity` (session owner), all web applications (`apps/web`, shop, `apps/admin`)

## Context

Barbershop has storefront with goods (cosmetics, care, styling products). Decision to make online store. Domains appear:

- `fade.com.ua` — storefront: marketing site, booking, client cabinet;
- `shop.fade.com.ua` — online store;
- `admin.fade.com.ua` — founder admin panel;
- `api.fade.com.ua` — API;
- `???.fade.com.ua` — ? (product photos, media).

Open questions: is separate cabinet `my.fade.com.ua` needed, and how to make **login in one place count in another** (logged in on `my`/site — store already knows who you are).

Base: one `User` for entire network (ADR 0005 — phone + OTP, no passwords); web sessions = cookie, mobile = bearer; admin — separate session.

## Decision

### 1. Domain map

| Domain | What | Data source |
|--------|------|-------------|
| `fade.com.ua` | Storefront: marketing, booking (`/booking`), client cabinet (`/account`, `/account/appointments`) — all already specified in `web-screens.md` and `web-cabinet-screens.md` | api |
| `shop.fade.com.ua` | Online store: product catalog, cart, checkout | api (new context, see `docs/online-shop.md`) |
| `admin.fade.com.ua` | Admin panel — one app, one login for booking + store | api |
| `api.fade.com.ua` | API — one monolith (ADR 0002), serves all products | — |
| `media.fade.com.ua` | **Answer to "???"**: object storage under own domain — product photos and AI galleries, CDN caching, without API secrets | bucket |

Product photos, AI result screenshots and galleries — in `media.fade.com.ua` (one point for object storage instead of scattered subdomains).

### 2. `my.fade.com.ua` — not doing

Separate cabinet — extra product:

- **Cabinet already specified**: `/account` on `fade.com.ua` (`web-cabinet-screens.md` §2) — profile, visits, AI, loyalty, referrals, certificates. Duplicating this screen on third domain — duplicate navigation and split brand: client has "my space" — one.
- **"Store customer" role = `client` role**: same person books and buys. Separate "buyer cabinet" without booking — model where same fade client exists twice.
- **Need to "view orders/address" covered** by sections in existing `/account` (orders, delivery address — `docs/online-shop.md`), not separate domain.
- Client path between products should be short both ways: from store — "Book after purchase/before purchase"; from booking — "Add styling product" → `shop.fade.com.ua`. Separate `my` in both paths — extra hop.

### 3. Shared auth: session on parent domain

**One client cookie session on `Domain=.fade.com.ua`.**

- `identity` sets cookie session with `Domain=.fade.com.ua`, `HttpOnly`, `Secure`, `SameSite=Lax`. `fade.com.ua` and `shop.fade.com.ua` **read same session** — logged in anywhere, logged in everywhere (answer to main question).
- Same `User` (ADR 0005), same `client` role; login — same `RequestOtp` / `VerifyOtp` flow (`identity`), store has no own user table.
- **Logout — across**: `RevokeSession` in `identity` invalidates session for both hosts immediately — source of truth one.
- **Admin isolated**: admin session — separate cookie with `Domain=admin.fade.com.ua` (not parent). Privileged session doesn't leak on public hosts; admin never "logged in" to store as client.
- **Mobile — unchanged**: bearer token, same session model `identity`.
- **Guest in store without login**: order requires login (phone + OTP, same flow). Phone = client identifier (`crm`): without it order outside CRM, conversation and repeat purchase break. Guest checkout — easier to add than migrate.
- Sessions with other products don't conflict: `apps/mobile` (bearer), `apps/admin` (own domain), web client applications — shared parent cookie.

### 4. Code consequences

- `identity`: cookie adapter of web session becomes `Domain=.fade.com.ua`; API authentication reads client cookie from any web host and admin — from admin's.
- `apps/web` and store — same `SessionStarted`/`SessionRevoked` flow; no new SSO mechanisms (company doesn't pull Keycloak/Auth0 for three applications).
- Store APIs live in same monolith (`api.fade.com.ua`) — CORS policy: `fade.com.ua`, `shop.fade.com.ua`, `admin.fade.com.ua`.

## Consequences

- **Pros**: one login for booking + store without new protocol; client LTV picture in CRM = visits + orders; brand one (`my` would give third "app"); cheapest solution of all considered.
- **Cons/cost**: parent cookie requires control over apex zone (have); SameSite=Lax sufficient, because all hosts — same-site (no third-party cookies).
- **Future**: if third-party products appear outside `.fade.com.ua` — then real SSO (OAuth/OIDC host); not now.

## Rejected alternatives

1. **`my.fade.com.ua` as separate cabinet** — duplicates `/account`, splits brand and navigation, gives third login without new function. "Orders/address" sections live in `/account`.
2. **Separate SSO server (Keycloak/Auth0/OIDC host)** — protocol for 3 applications of one owner; parent cookie solves same without new infrastructure.
3. **Separate sessions per host** (need repeat OTP in store) — exactly what refusing: login should be one.
4. **Token in localStorage + cross-domain transfer** — insecure (XSS) and unnecessary with same-site hosts.

## Revision 2026-09-21: base zone — `fade.com.ua`

Founder registered **fade.com.ua**. Entire domain map above works unchanged with base `.fade.com.ua`: `fade.com.ua` (storefront) · `book.fade.com.ua` (quick-booking, T-053) · `shop.fade.com.ua` · `admin.fade.com.ua` · `api.fade.com.ua` · `media.fade.com.ua`; client cookie — `Domain=.fade.com.ua`. Host `book.fade.com.ua` removed from this list by revision 2026-10-01.

Code impact zero until T-011 started: in code everywhere domain **config variables**, not literals. Risk note: `.com.ua` — public suffix of registry (REG-domain), so some cookie libraries handle it via PSL — verify `Domain=.fade.com.ua` in test T-011 before everything else.

`fade.ua` — consciously deferred until TM certificate (decision 2026-09-21): `.UA` zone registered only on certificate basis — sequence "TM → fade.ua" dictates registry (T-003).

## Revision 2026-10-01: `book.fade.com.ua` not a product

Booking remains on `fade.com.ua`, as in §1 (`/booking` and cabinet). Separate quick-booking host (decision 2026-09-21, T-053) removed.

- Same `apps/web`, same session, same `scheduling` / `billing` use cases. Second hostname doesn't give second application.
- Canonical URLs: `https://fade.com.ua/booking` (location list) and `https://fade.com.ua/booking/{location-code}` (Google Maps, QR, ads, bio). English locale — `/en/booking/...`.
- Minimal chrome and speed budget — requirements of `/booking` route, not separate domain. Booking intent read from `/booking` path and UTM on visit.
- `book.fade.com.ua` not in CORS, GTM cross-domain, separate sitemap and separate image. If short name ever needed — only redirect to these URLs, not application.
- `shop.fade.com.ua`, `admin.fade.com.ua`, `api.fade.com.ua`, `media.fade.com.ua` remain separate hosts (§1).
