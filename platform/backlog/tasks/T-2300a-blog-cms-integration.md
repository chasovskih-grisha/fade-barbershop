# T-2300a · Editorial Article Model

- **Stage**: M5 (phase 30) · **Tags**: backend, content · **Complexity**: middle · **Depends on**: T-031
- **StoryPoints**: 8

## What

Expand the `Article` aggregate so that the website and application can assemble the magazine without inventing UI markup. Separate CMS: none, this is the same `content`.

Currently (`article.types.ts`): `title`, `excerpt`, `body` (string), `coverUrl`, `authorName`, `tags[]`, `draft|published`, `publishedAt`. The public list does not return the body. This remains the base.

Add:

- **Body:** The editor still stores a string. The domain parses a **subset of markdown** into blocks: paragraph, heading (levels 2–3 only), list, blockquote, image with mandatory alt and optional caption. Links inside paragraphs and quotes — `https://` and site paths (`/…`) only. Raw HTML, `h1`, iframe, script — publishing error (`INVALID_ARTICLE_INPUT`), not "strip and stay silent". A draft with such a body is saved, but cannot be published.
- **Public contract** returns both `body` (source, needed by editor) and `blocks` (what web and mobile render). The client does not parse markdown itself.
- **Cover:** `coverAlt`. Publication with `coverUrl` and empty alt is forbidden. Host URL — allowed list (own media host). Foreign host is not published.
- **SEO fields:** `seoTitle`, `seoDescription`. Empty means "take title / excerpt". Separate from card announcement: announcement can be longer than tab.
- **Author:** `authorRole` alongside existing `authorName`. Separate Author aggregate: none.
- **Featured article:** `featured`. Exactly one or zero among published. A new featured article unsets the previous one in the same transaction.
- **Slug:** After first publication, slug can be changed. The old one is recorded in `SlugRedirect` in the same transaction; the chain collapses to the current slug. The old slug cannot be given to a new article. Prior to publication, redirect: none.
- **Editor preparation (Slice d, columns here, behavior there):** `publishAt` (nullable) and `previewToken` (nullable). Public queries ignore them.

Reading time is not a column: calculated from the block text in the query.

`Tag` table: none. tags remain a normalized array of strings.

## Why

Without blocks, each client either shows a wall of paragraphs or starts executing HTML. The latter is already forbidden by test T-031 and breaks trust in the public page. Without redirect, fixing a slug after indexing breaks the URL. Without a single featured article, the feed has no starting point.

## Sources

- ADR 0026 (accepted), ADR 0002, ADR 0019 (file < 100 lines)
- `apps/api/src/content/README.md`; `packages/contracts/src/content.ts`
- `docs/ubiquitous-language.md` (Slug is immutable — this rule is relaxed by this slice: immutable canonical path ensures redirect, not ban on editing)
- T-2300 (decision "without headless CMS"), T-031

## Done

- [ ] Subset parser covered by tests: paragraph, h2/h3, lists, blockquote, image with alt, rejected HTML, rejected image without alt, rejected `javascript:` link
- [ ] `PublishArticle` does not publish raw HTML, cover without alt, and cover from a foreign host
- [ ] Second `featured` among published unsets the first; draft with flag does not occupy feed slot
- [ ] Changing published article slug writes redirect and does not give old slug to new article
- [ ] Public `GET` returns `blocks` and does not return `previewToken`
- [ ] Contract in `packages/contracts` updated; web and admin build on it (nullable fields, old articles read)
- [ ] migration only adds nullable columns and redirect table; backfill not needed
- [ ] `pnpm --filter @fade/api test` for `content` is green

## Risks

- [ ] **Parser in domain grows.** Keep it clean: without Nest and without React. Render — in slices b and f
- [ ] **Redirect loop.** Collapse A→B→C into A→C and B→C in one transaction; test for loop
- [ ] **Two featured due to race.** Uniqueness is a transaction invariant, not a check in controller after write
- [ ] **Reading time in column becomes stale.** Do not store; calculate from blocks

## Demarcation

- Reading screens, sitemap, 301 on site — slices b and c. This Slice provides data and redirect rule
- Preview, scheduled publication, revisions — **T-2300d**
- Search and tag archive — **T-2300e**
- Related services ID — **T-4473**, not this model
