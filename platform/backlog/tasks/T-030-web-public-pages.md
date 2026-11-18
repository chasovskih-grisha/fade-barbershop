# T-030 · Public Website Pages

- **Stage**: M1 (phase 3) · **Tags**: frontend · **Complexity**: middle · **Depends on**: T-021, T-022, T-023, T-024
- **StoryPoints**: 5

## What

`apps/web` (SSR): homepage (§0: hero, concept, CTA, nearest location), `/locations` + `/locations/{code}` (map, hours, chairs), `/services` (categories, prices by location), `/barbers` + `/barbers/{slug}` (no personal data beyond necessary). Deactivation rule: disabled in admin does not exist for guest (404/redirect). SEO: sitemap, OG, canonicals.

## Why

Showcase and source of trust; phase 3 gate.

## Sources

- `web-screens.md` §0–4 (with MNG-ADM-* criteria for each block)
- roadmap checklist v1 (phase 3)

## Done

- [ ] All pages serve admin data via API
- [ ] Deactivated objects disappear (verified on location/service/barber)

## Progress

- **2026-11-12 — sitemap coverage for service pages**: `sitemap.ts` listed `/locations/{code}` and `/barbers/{slug}` detail pages but omitted the `/services/{slug}` detail pages that the route already serves. The API fetchers moved to `sitemap-entries.ts` (`getServiceEntries` reads `GET /public/services/active`), so `sitemap.ts` stays small and every dynamic page type is emitted. Fail-open behaviour kept: an API error yields an empty list, not a thrown error. Tests `sitemap-entries.test.ts` cover service URLs, the empty-id guard, the fail-open path and the static pages. Remaining for `done`: e2e acceptance that a deactivated location/service/barber disappears (needs the DB stack).

## Risks

- [ ] **Migrations**: schema changes break existing data — migration with backfill plan
- [ ] **Domain events**: subscriptions are idempotent (ADR 0009/0016 pattern)
