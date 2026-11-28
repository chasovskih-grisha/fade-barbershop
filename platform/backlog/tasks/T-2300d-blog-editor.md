# T-2300d · Article Editor

- **Stage**: M5 (phase 30) · **Tags**: frontend, content · **Complexity**: middle · **Depends on**: T-2300a
- **StoryPoints**: 8

## What

Enable the founder to write articles in the admin panel end-to-end: preview before publishing, schedule release time, and restore previous revisions. Cover image, alt text, author roles, SEO metadata, featured article flag.

To build:
- **All model fields** in creation and editor: cover image (allowed host URL) and alt text, author role, `seoTitle`, `seoDescription`, featured flag, tags.
- **Body** remains a markdown text field. Adjacent block preview. Preview queries server (`POST /admin/content/articles/preview` without saving), using the exact same parser as publication. Publish button disabled while parser sees HTML or images without alt, explaining why.
- **Guest preview.** Dedicated URL with `previewToken`, `noindex`, no navigation link. Token rotated from editor; old token stops opening article. Public slug of draft still 404s.
- **Scheduled publishing.** Editor sets `publishAt` in the future. Article remains a draft until then. API process calls `PublishArticle` once a minute for matured rows. Subsequent tick does not publish twice (first publish date already set). No separate queue engine (ADR 0048) introduced. Process failure: article published on next tick, not lost.
- **Revisions.** Each successful save appends a snapshot (title, lead, body, cover, alt, SEO, tags). List of last 20. Restoration writes a new snapshot from old content without erasing history. No branching or co-authorship.

## Why

Currently, the only way to "view an article" is to publish it. For the editorial team, this is a defect: guests see drafts, and unpublishing does not restore the previous paragraph. Deferred Friday morning publication does not require a separate task engine.

## Sources

- ADR 0026, ADR 0048 (task engine remains proposed — this Slice does not select it)
- `apps/admin/src/app/blog/ArticleForm.tsx`, `ArticleEditor.tsx`
- T-2300a (`publishAt`, `previewToken` columns, parser)
- MNG-ADM-17 (Blog CMS in admin)

## Done
- [ ] Forms create and save all slice a fields; published article on site displays them accurately
- [ ] Block preview matches what publication saves (single parser)
- [ ] Token URL shows draft and returns `noindex`; after token rotation, old URL is 404; normal draft slug is 404
- [ ] Article with future `publishAt` absent from public feed until then and appears after tick without second publish date
- [ ] Revision restoration returns text and keeps both snapshots in list
- [ ] Tests: rejected publication with HTML, token, idempotent tick, revision restoration

## Risks

- [ ] **Tick in multiple instances.** `PublishArticle` is already idempotent regarding date; two ticks do not create two events with different content if use case checks `publishAt` and status in one transaction.
- [ ] **Token in referrer.** Preview does not place public link to itself and is not included in sitemap (Slice c).
- [ ] **Body revisions.** Body is long; store snapshot in its own table, do not bloat `Article` row with array.

## Boundaries

- Parser and columns — **T-2300a**
- Published page appearance — **T-2300b**
- Translation to another language — **T-4613b** and **T-2300g**
- Cover file upload — **T-4201**; URL here
