# 22. Service SEO pages by locations

> Feature: separate indexed page for each service — `/services/{slug}` with Schema.org markup (`Service` + `Offer` + `FAQPage`) and FAQ. Long-tail keywords ("faded haircut City Lake", "beard correction price") lead from search directly to service page with price, slots and booking CTA. Removes deferred "service pages — later" decision from `web-screens.md`.

> Contexts: **without new context**. `catalog` — service data (name, description, slug, SEO fields, FAQ); web — render and markup; `content` — cross-linking with blog. Phase 3 extension (site pages).

## Rule (common)

- [ ] **SRV-001.** `/services/{slug}` — **canonical** service page: description, duration, category, prices by locations (MNG-ADM-11), live slots (LST-WEB-01), "Register" CTA → flow with substituted service. Slug — transliterated or Ukrainian (decision at implementation), stable: slug change → 301 from old.
- [ ] **SRV-002.** **Location variant** `/locations/{code}/services/{slug}` — for long-tail keys by location (phase 9+, with second location). In v1 (one location) — **not generated**: would duplicate canonical page; instead canonical page shows single location data. On network appearance: each variant — own page with `rel=canonical` to self and cross-link from `/services/{slug}`.
- [ ] **SRV-003.** **Schema.org `Service`**: `name`, `description`, `serviceType`, `provider` → `HairSalon` (location with `address`, `geo`, `openingHoursSpecification` from MNG-ADM-01/03), `offers` → `Offer` by locations (`price`, `priceCurrency: UAH`, `url`). Validation — rich results test before release.
- [ ] **SRV-004.** **`FAQPage` markup**: service FAQ (3–6 questions, admin — SRV-ADM-01) marked as `FAQPage`/`Question`/`Answer` — rich results in search. FAQ rendered also as visible page content (not hidden text — Google rules violation).
- [ ] **SRV-005.** **SEO metadata on service** (admin, SRV-ADM-01): `<title>` and `meta description` (template with auto-substitution `{service} in {location} — {price} UAH | {brand}`, manually edited overrides template); OG tags; canonical URL. No manual fields → template.
- [ ] **SRV-006.** **Internal cross-linking**: service → category's adjacent services → location page → relevant blog articles (`content`, if exist); blog → services. Link grid — template part, not manual work.
- [ ] **SRV-007.** Disabled service (MNG-ADM-10) or disabled in location (MNG-ADM-12) → page/variant removed: 410 (not 404) for disabled service with indexing history; prices always current from `catalog` (ADR 0006 not violated — page shows current catalog prices, not snapshots).
- [ ] **SRV-008.** **Public reviews** (phase 25) — when enabled: on service page aggregate of this service ratings + `AggregateRating` in markup (PUB-006 threshold applies). Before phase 25 — block absent, markup without rating.
- [ ] **SRV-009.** Sitemap: all service pages — in `sitemap.xml` (phase 3 already generates); update on slug/status change. Page — SSR, canonical, without noindex.

## Admin

- [ ] **SRV-ADM-01.** Service form (§3.2) gets **SEO and FAQ** section: slug (unique, auto-generation from name, editable — 301), `<title>`/`meta description` (template or manual), FAQ (3–6 "question → answer" pairs, draggable order).
- [ ] **SRV-ADM-02.** Service page preview from form (how it looks and what markup has) — check before publication.
- [ ] **SRV-ADM-03.** Indexing status: services list with markers "has page / no SEO description / no FAQ" — fill checklist.

## Open questions

1. **Slug language**: Ukrainian ("faded-haircut") vs translit ("faded-haircut") — decision at implementation; important choose one approach and not change.
2. **FAQ author**: founder manually (recommended — real client questions) vs AI generation from `content` (later, with verification).
3. **Blog cross-linking**: automatic (by category/tags) or manual blocks in articles — after first 10–20 articles.
