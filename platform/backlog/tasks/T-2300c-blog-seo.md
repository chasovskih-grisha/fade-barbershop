# T-2300c · Blog SEO, feed and freshness

- **Stage**: M5 (phase 30) · **Tags**: frontend · **Complexity**: middle · **Depends on**: T-2300a, T-2300b
- **StoryPoints**: 8

## What

Make a published article discoverable and remove it from the index the exact minute it is unpublished. Markup and cache, not text.

Currently, article `generateMetadata` takes title from headline and description from excerpt, OG from `coverUrl`, unknown slug returns `noIndex`. A separate `sitemap.ts` and revalidate route in `apps/web` do not exist. `web-screens.md` describes them as already done — this is the goal of this slice, not a fact. Public fetch freshness is 300s.

Tasks:

- **Metadata from slice a fields.** `seoTitle` and `seoDescription`, otherwise title and excerpt. Canonical is `/blog/{slug}` of the current slug, never an old one.
- **JSON-LD** in the article page: `BlogPosting` (headline, datePublished = first publication, dateModified, author name, image) and `BreadcrumbList` (Home → Blog → headline). Data from API, not from article body. Invalid JSON is not returned.
- **sitemap.xml** contains `/blog` and every published `/blog/{slug}` with `lastmod` = `updatedAt`. No drafts or redirects.
- **RSS** `/blog/rss.xml`: published only, full text as our block-based HTML (escaped, server-rendered), links to canonical URL.
- **301.** If the public API states that the slug has moved (`SlugRedirect` from slice a), the site page responds with 301 to the current canonical. Single-hop chain.
- **Cache invalidation.** Upon successful `PublishArticle`, `UnpublishArticle`, and editing of an already published article, the API calls `POST /api/revalidate` on web with the `NEXT_REVALIDATE_SECRET` secret. Paths: `/blog`, `/blog/{slug}`, old slug, sitemap, RSS, tag archives of this article. The secret is not in the repository. Revalidation failure does not roll back publication: the article is already in the database, 300s ISR remains a fallback, and the error is logged.
- Drafts and unknown slugs remain 404 and `noindex`. The preview token of slice d also gets `noindex`.

## Why

An article without structure in search is just a long page. An article that was unpublished while still lingering in cache for five minutes and longer in index without a sitemap contradicts the promise "draft is invisible to guests". A redirect without 301 on the site leaves the old URL returning 404, even though the model already remembers the new one.

## Sources

- `products.md` §1 (sitemap, Open Graph, canonical `/blog/{slug}`)
- `docs/web-screens.md` (revalidate goal; prior to this slice it does not exist in code)
- `docs/roadmap.md` phase 3 (blog SEO)
- ADR 0009 (repeating publication event does not create a second article; revalidate is idempotent)
- T-2300a, T-2300b, T-4482 (general internal linking — not here)

## Done

- [ ] Published article outputs valid `BlogPosting` and `BreadcrumbList`; draft does not output them
- [ ] `seoTitle` / `seoDescription` override title / excerpt when filled, and are not populated when empty
- [ ] sitemap contains only published URLs and updates `lastmod`
- [x] RSS contains no drafts
- [ ] Old slug on site — single 301 to current
- [ ] Publishing and unpublishing trigger revalidate; incorrect secret receives 401 and clears nothing
- [ ] Revalidation failure does not change article status
- [ ] Tests: markup, 301, secret, absence of drafts in sitemap and RSS

## Progress

- 2026-11-25 — `/blog/rss.xml` (`blog/rss.ts` + `blog/rss.xml/route.ts`, 8 tests) shipped: published only, block HTML escaped server-side. JSON-LD already in `blog/[slug]/articleJsonLd.ts` (no `dateModified` yet). Remaining: `seoTitle`/`seoDescription` (needs contract + API), sitemap `lastmod` = `updatedAt` (summary lacks the field), 301 for `SlugRedirect`, `POST /api/revalidate` on publish/unpublish.

## Risks

- [ ] **Secret in client.** Revalidate call comes from API to web, not from editor browser
- [ ] **HTML in RSS.** Built from server-side blocks. Article body is not inserted into RSS as-is
- [ ] **Duplicate sitemap.** If T-4482 introduces a shared generator earlier, articles enter it as a single list, no second file appears

## Boundaries

- Text, cards, related articles — **T-2300b**
- Search and tag page — **T-2300e** (their URLs are only invalidated by this slice)
- `hreflang` — **T-4613c**
- Event `article_view` — **T-2300h**
