# T-4413 · Canonical Slugs for Services and Staff (SEO)

- **Stage**: M1 (phase 3) · **Tags**: backend, seo · **Complexity**: middle · **Depends on**: T-250, T-2600a
- **StoryPoints**: 3

## What

Idempotent generation/validation of slugs: unique `Slug` constant (lowercase, `-`, ASCII) for `Service` and `Staff` barber, transliteration, change rule (old slug → 301, continuity of old links), lint gate "slug mandatory" in catalog. Forms the basis of SEO pages `/services/{slug}` and blog links.

## Why

Locations already have canonical codes (normalized uppercase); services and barbers without slugs produce ugly URLs and duplicate pages in Google (penalized by T-2600a).

## Sources

- web-screens.md (SEO pages); SRV-001…002; T-250 (slug consumer)

## Done

- [x] Slug in service/staff domain with validation and transliteration
- [x] Slug change = 301 redirect to new slug per tests
- [x] Existing seed services receive slugs via migration

## Risks

- [ ] **Slug duplicates**: uniqueness gate at DB level (partial index)
