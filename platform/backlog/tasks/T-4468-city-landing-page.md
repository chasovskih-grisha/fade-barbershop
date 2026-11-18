# T-4468 · City haircut landing page (submit city)

- **Stage**: M5 (phase 10) · **Tags**: backend, frontend, seo · **Complexity**: middle · **Depends on**: T-250, T-2600
- **StoryPoints**: 8

## What

SEO landing page for city/district (this is "haircut near the metro"): page with services (T-024), locations (T-021), rating (T-4467), contacts, and "virtual booking" (link to flow), variable template catalog. Static generation on request, dynamic via T-2600 (SEO content).

## Why

Local query "barbershop near metro X" is the most profitable CLT-01 traffic; without a landing page, it falls back to the general homepage without a region.

## Sources

- web-screens.md; SRV-* (services); T-250 (SEO service pages), T-2600 (SEO content/campaigns)

## Done

- [ ] City landing page (variables: services/locations/rating) is generated from a template
- [ ] Canonical URLs and hreflang are correct (from T-2600)
- [ ] Booking conversion metric is visible

## Risks

- [ ] **Page duplicates**: landing page without unique content — canonical to homepage (SEO guide)
