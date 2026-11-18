# ADR 0026: Content Platform for Blog and News

## Status
**Accepted** — 2026-11-10, together with the rewrite of T-2300. v1 source of truth stays roadmap phase 3 and T-031 (done).

## Context
The platform needs a blog/news channel (SEO, content marketing). The `content` bounded context already exists in the monolith with a minimal v1 model: `Article` (чернетка/публікація, теги), admin CMS screens (MNG-ADM-17), public `/blog` + `/blog/{slug}` (sitemap, OG, canonical URLs). ADR 0002 fixes the modular monolith — no external content service.

T-2300 (M5) extends that v1 into an editorial blog: structured body, search, tag archives, editor workflow, the same reader on mobile. The question at kickoff was how far `content` should grow versus delegating to external tooling:

- **Option A — extend `content` in-house**: blocks, tag search, editor workflow inside the monolith. No second taxonomy of categories.
- **Option B — headless CMS** (e.g. Strapi/Directus/Sanity): faster editorial tooling, but adds a service to deploy/host and a second source of truth for content.
- **Option C — static/Markdown-in-repo**: cheapest, weakest editorial experience for non-technical authors.

Constraints: single team, founder is the main author; content must stay renderable on web, mobile, and assistants (ADR 0020 tools read ports); shop/blog share one session domain (ADR 0017) but content is read-only public data.

## Decision
**Option A — extend `content` in the monolith.** No headless CMS, no Markdown files in `apps/web`.

The audit at T-2300 kickoff removed the reason to keep this open. T-031 already ships the aggregate, the admin screens, and the public API. The founder is the author. Scheduling, preview, and revisions (T-2300d) fit in the same module; they do not need a second service. Media upload stays a URL on an allowlisted host until T-4201, which is also in-house. Option B would add a deployable, a second source of truth, and a sync problem for web, mobile, and assistants. Option C cannot be edited by a non-developer.

## Consequences
- T-2300a–h extend `Article` (blocks, SEO fields, featured, slug redirect, editor, discovery, mobile, translations, analytics). They do not add Strapi, Contentful, or Directus.
- One `Article` remains the source for web canonical URLs, the mobile reader, and assistant tools (ADR 0020).
- A later switch to a headless CMS would be a new ADR, not a silent dependency inside a slice.

## References
- T-031 (v1 blog: CMS в адмінці + SSR на сайті), T-2300 family
- `apps/api/src/content/README.md`, MNG-ADM-17 (04-admin-management.md)
- roadmap фаза 3 (v1) і фаза 30 (розширення блогу)
- ADR 0002 (modular monolith), ADR 0017 (domains), ADR 0020 (assistants read via ports)
