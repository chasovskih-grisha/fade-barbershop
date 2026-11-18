# ADR

Platform architecture decisions. Number increases. Status: proposed | accepted | superseded.

| # | Decision |
|---|----------|
| [0001](0001-own-platform.md) | Own platform, not Altegio as system of truth |
| [0002](0002-modular-monolith.md) | Modular monolith |
| [0003](0003-typescript-stack.md) | TypeScript: Nest + Next + Expo |
| [0004](0004-one-mobile-app-two-roles.md) | One mobile app, roles client and barber |
| [0005](0005-client-phone-otp.md) | Client: login by phone (OTP) on site and in app |
| [0006](0006-appointment-price-snapshot.md) | Appointment price fixed at booking (`AgreedPrice`) |
| [0007](0007-discounts-applied-at-booking.md) | Discounts applied and fixed at booking (`AppliedDiscounts`, `FinalPrice`) |
| [0008](0008-haircut-ai-acl-storage-privacy.md) | `haircut-ai`: ACL AI-provider, photo storage, privacy |
| [0009](0009-loyalty-counter-and-events.md) | Loyalty: counter, reset, subscription to `AppointmentCompleted` |
| [0010](0010-no-client-prices-in-haircut-ai-loyalty.md) | `haircut-ai` and `loyalty` without own prices; future payments — via snapshot model |
| [0011](0011-father-son-appointment-party.md) | "Father + son": `AppointmentParty`, modes sequential / parallel |
| [0012](0012-waitlist-autofill.md) | Waitlist: FIFO offer, soft-hold 15 min, auto-fill freed slots |
| [0013](0013-gift-certificates-payment-instrument.md) | Gift certificates: payment instrument, not price; receipt on sale and on redemption |
| [0014](0014-referral-program-attribution-rewards.md) | Referral program: attribution in `crm`, reward after friend's visit completion |
| [0015](0015-feedback-photos-storage-privacy.md) | `feedback`: feedback photo storage, access and privacy (pattern 0008, separate bucket, public copy) |
| [0016](0016-feedback-window-event-subscription.md) | `feedback`: feedback window by `AppointmentCompleted` (idempotent subscription, pattern 0009) |
| [0017](0017-domains-and-shared-auth.md) | Fade domains and shared auth: one cookie session on `.fade.com.ua` (site ↔ shop), `my` not done, `media.fade.com.ua` for media; revision 2026-09-21 — fade.com.ua base; revision 2026-10-01 — booking on `fade.com.ua/booking`, host `book` not a product |
| [0018](0018-docker-dev-environment.md) | Development in Docker: dependencies (Postgres, Redis, MinIO) always in containers, apps — after T-001, mobile — on host |
| [0019](0019-file-size-limit-100-loc.md) | File size limit: target LOC < 100 (linter gate from T-001), exceptions only with justification |
| [0020](0020-assistants-multi-agent.md) | `assistants`: multi-agent layer in monolith — orchestrator, tools = ports on use cases, LLM via ACL, Human-in-the-loop |
| [0021](0021-uuid-primary-keys.md) | UUID v7 — primary keys of domain models (generation on app; infrastructure tables — exception) |
| [0022](0022-map-geocoding-stack.md) | Maps and geocoding: Leaflet + OpenStreetMap tiles, geocoder via port `Geocoder` (Nominatim by default, Google Maps — approved fallback) |
| [0026](0026-content-platform.md) | Content platform for blog/news — **accepted**: extend `content` in the monolith; no headless CMS (T-2300, 2026-11-10) |
| [0027](0027-admin-roles.md) | Admin role model — **proposed**: single `admin` (v1) vs levels super-admin/manager/barber; decision at start of T-2400 |
| [0048](0048-jobs-engine.md) | Background task and schedule engine — **proposed**: outbox+pg_cron vs BullMQ vs Temporal; decision at start of T-4200/T-4211 |
| [0049](0049-distributed-transactions.md) | Distributed transactions — **proposed**: event choreography vs saga orchestration; decision at start of T-4208 |
| [0050](0050-geocoder-redis-stores-metrics.md) | Distributed geocoder stores: Redis by env (`FADE_GEOCODER_STORE`), fail-open, counters and /health |
| [0051](0051-hosting-stage-prod.md) | Hosting — one GMHost VPS in Ukraine (UA-VPS-4, ~$10/month), Compose + Caddy, prod only; Cloudflare DNS; R2 for media and backups. Revision 2026-11-11 supersedes Hetzner + Coolify |
| [0052](0052-stage-main-autodeploy.md) | Deploy stage/prod: only branches `stage` and `main`; agents commit directly to `stage`; to prod only Release PR `stage` → `main` (revision 2026-10-17: no feature branches and feature PR; revision 2026-11-11: Release PR merge automated — green CI + 12-hour soak, human veto = close the PR) |
| [0053](0053-locale-routing-and-content-translations.md) | Localization: dictionaries via `next-intl` (`localePrefix: as-needed`, ICU, typed keys, gate on hardcode), all content translations in **one** table `Translation` (languages = rows, `values Json` + zod, fallback to `uk`), switcher in v1 |

> Numbers 0023–0025 and 0030–0047 not used. History: backlog expansion tasks 2026-09-22 quoted "ADR 0022–0047" before files existed ("reserved numbers"); actual decisions fixed under 0026/0027, 0022 later taken by maps/geocoding (T-4405), 0048/0049 — by task engine and sagas (T-4200/T-4208/T-4211), and rest of phantom quotes translated to real sources (audit 2026-09-23), 0051 — by stage/prod hosting, 0052 — by autodeploy branches, 0053 — by localization (language switcher and `/en/` in v1). Gaps left as history — don't reuse: new ADR numbered from **0054**.
