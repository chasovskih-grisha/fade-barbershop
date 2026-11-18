# T-031 · Blog: CMS in admin + SSR on site

- **Stage**: M1 (phase 3) · **Tags**: backend, frontend · **Complexity**: middle · **Depends on**: T-020, T-030
- **StoryPoints**: 5

## What

`content` context (Article: draft/published, tags), CMS screens in admin (MNG-ADM-17), feed and article on the site (`/blog`, `/blog/{slug}` — unique URLs, sitemap, OG). Reading without login; same articles in mobile (phase 6).

## Sources

- `MNG-ADM-17`; `products.md` §1 (blog rules); roadmap checklist v1 (phase 3)

## Done

- [x] Article published in admin and appears on the site
- [x] SEO requirements met

## Risks

- [x] **Migrations**: schema change breaks existing data — migration with backfill plan
- [x] **Domain events**: subscriptions are idempotent (ADR 0009/0016 pattern)

---

**Result (2026-09-28).** `content` context from scratch: `Article` aggregate (draft/published, unique slug, excerpt, tags, publish date, author), domain-language commands `DraftArticle` / `UpdateArticle` / `PublishArticle` / `UnpublishArticle` + public and admin queries; `PublishArticle` preserves the first publish date, so the feed does not "jump" on republishing. Public API returns **only** published articles — guaranteed by the query itself (`ListPublishedArticlesHandler`), not a filter in the controller; draft by slug for guest = 404, not 403 (does not leak existence).

**API.** `GET /content/articles?limit=` and `GET /content/articles/{slug}` (without login), `GET|POST|PATCH /admin/content/articles`, `POST /admin/content/articles/{id}/publish|unpublish` (global `AdminSessionGuard`). DTO contract exported in `packages/contracts/src/content.ts` — web and admin take types from there, not from the API domain. Domain errors → HTTP via `ContentExceptionFilter` (404 / 409 `ARTICLE_SLUG_TAKEN` / 400 `INVALID_ARTICLE_INPUT`).

**CMS in admin** `/blog` ("Blog" item in Sidebar): list of articles, new article form (URL generated from title and remains editable), editor with publish/unpublish. Unpublish is not deletion: article remains as draft in CMS, but disappears from the site.

**Site** `/blog` and `/blog/{slug}` (SSR) + teaser of 2–3 articles on the homepage. "Blog" menu item, which led to 404 from T-4508, now leads to the page. SEO: `title`/`description` from excerpt, OG with cover, canonical URL, `noindex` for error and 404; content cached via ISR 5 min. Article text rendered in paragraphs as **text** — HTML from CMS is not executed (XSS test in kit).

**Schema.** `Article` table + indexes on `(status, publishedAt)` for feed and `createdAt` for admin list; CHECK on status and on `publishedAt IS NOT NULL` for published (domain invariant prevents direct DB corruption). Backfill not needed — new table; "migration breaks data" risk mitigated by constraints, not copy.

**Events.** `content.article.drafted|published|unpublished` written to transactional outbox (`PrismaContentOutbox`, `aggregateType: 'article'`) in the same transaction as the aggregate. Subscriptions to these events will arrive with search/mailing (T-2300/T-2600) — they must already be idempotent per ADR 0009, so risk closed on producer side: event carries `id`+`slug`, re-processing does not create duplicates.

**Gates**: `pnpm --filter @fade/api test` — 599 tests (121 suites), including content 25 (domain 8, use cases 12, e2e GWT 5); admin 45 (including blog 4), web 44 (including blog 7); `pnpm typecheck`; `pnpm docs:validate`; `next build` for web and admin; lint web without errors (admin lint fails on pre-existing `settings/geocoder/page.tsx`: 161 lines and hex color — snapshot commit file, this task did not touch it).

**Out of scope (recorded):** editorial continuation — T-2300a–h (ADR 0026 accepted: own `content`, without headless CMS). Page `SeoBlock` — T-4416. Categories in blog none.
