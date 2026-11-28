# T-4482 · Internal Linking + Dynamic Sitemap

- **Stage**: M5 (phase 10) · **Tags**: backend, content · **Complexity**: junior · **Depends on**: T-250, T-2300b, T-2600
- **StoryPoints**: 5

## What

Systemic internal linking: related pages (services/locations/blog, tag-based 'adjacent' pages) with auto-blocks, dynamic sitemap.xml (all public URLs: services, locations, articles, landing pages T-4468) with event-driven updates and priorities, robots. Not just breadcrumbs — actual cross-linking between publications.

## Why

SEO structure without linking is a dead end; sitemap ensures indexing of generated pages (T-2600).

## Sources

- web-screens.md; T-250/2300b/2600 (SEO pages, blog, content)

## Done

- [ ] Auto-blocks of adjacent pages on public surfaces
- [ ] Dynamic sitemap.xml (all public URLs; priorities; lastmod)
- [ ] Validation (with T-2600a linter): links do not lead to 404

## Risks

- [ ] **Index bloat**: showcase sitemap without unique content — noindex for duplicate landing pages (SEO policy)
