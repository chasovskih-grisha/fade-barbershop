# T-3801 · Search engine

- **Stage**: M6 (phase 40) · **Tags**: backend, frontend, integration · **Complexity**: senior · **Dependencies**: T-002, T-3802
- **StoryPoints**: 25

## What
Search by catalog/blog/gallery: Meilisearch or Typesense, typo-tolerance, facets (category, location, price), geo-search locations, autocomplete in UI, multi-lang indexes (UK/EN).

## Why
Client must find service/article in 2 clicks. Search with typos — standard expectation (Google-generation).

## Requirement sources
- docs/search.md — phantom 2026-09-22: file never existed; source accepted at task start
- SEO service pages (AC 22)

## Dependencies

> Slices allocated at task start; separate subtask files created then if needed.
## Checklist
- [ ] Choose provider (Meilisearch/Typesense) and deploy
- [ ] Indexes: services, locations, blog, gallery; UK/EN
- [ ] Typo-tolerance and field weighting
- [ ] Facets: category, location, price
- [ ] Geo-search locations (radius from client)
- [ ] Autocomplete UI with debounce
