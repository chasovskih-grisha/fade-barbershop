# T-4614 · Pre-opening MVP: site, admin and API in prod with zero catalog

- **Stage**: horizontal (prod gate before first location; after the FADE mark T-4609/T-4611, then above the rest of M1–M3) · **Tags**: frontend, high-risk · **Complexity**: senior · **Dependencies**: slices a–f
- **StoryPoints**: 28

## What

Parent task. No independent work: each real blocker — separate slice.

Bring `apps/web`, `apps/admin` and `apps/api` to production **before first location**. Catalog empty at start. Site must look like "getting ready to open".

| Slice | Blocker |
|-------|--------|
| [T-4614a](T-4614a-production-images.md) | Images in `infra/*.Dockerfile` — dev, without prod `CMD`. Compose launches `pnpm dev` |
| [T-4614b](T-4614b-empty-prod-database.md) | `db-seed` after migration seeds locations, clients and records |
| [T-4614c](T-4614c-stage-prod-autodeploy.md) | `deploy.yml` still calls Coolify and exits 0; ADR 0051 requires SSH Compose on the GMHost VPS; `main` without branch protection |
| [T-4614d](T-4614d-staging-cookie-isolation.md) | `session-cookie.ts` always sets `Domain=.fade.com.ua` |
| [T-4614e](T-4614e-preopening-site.md) | Home and header always call "Register" and name price 700 ₴ |
| [T-4614f](T-4614f-admin-empty-database.md) | Admin not tuned for base without seed; barbers list at zero — empty table |

Infra stand (VPS, DNS, SSL, backups) remains in **T-303** and **T-4531**. Payment, FPRPO, battle SMS, GA4 and mobile stores this gate doesn't block: they needed when first location opens records.

## Why

Before CLT-01 opening `fade.com.ua` already must stand. Prod with current start either shows fake network from seed, or invites guest to record that can't be completed.

## Requirement sources

- Founder decision 2026-10-02: zero locations and barbers until first point ready for opening
- ADR 0051, ADR 0052, ADR 0017 (revision 2026-10-01: host `book` removed)

## Done

- [ ] T-4614a…f closed
- [ ] On staging in browser: home, locations, barbers, services, booking, admin login and empty lists — on base without demo seed

## Status

- Created 2026-10-02. Split into slices a–f same day: each slice holds one blocker with file and current behavior.
