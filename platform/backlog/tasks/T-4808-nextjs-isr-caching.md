# T-4808 · Next.js ISR Caching & Edge Optimization for Public Pages

- **Stage**: M5 · **Tags**: frontend, performance, seo · **Complexity**: middle · **Depends on**: T-030
- **StoryPoints**: 5

## What

Optimize public marketing pages, blog articles (`/blog/{slug}`), and service pricing pages (`/services/{slug}`) in Next.js (`apps/web`) using Incremental Static Regeneration (ISR) and edge caching.

- Configure `revalidate` intervals for static content pages.
- On-demand revalidation webhook triggered by admin CMS updates when articles or prices change.
- Edge caching headers and stale-while-revalidate strategies for high-traffic public landing pages.

## Why

Lightning-fast page load speeds (Core Web Vitals LCP < 1.5s) and optimal SEO indexing are critical for customer acquisition and conversion rates.

## Sources

- `platform/docs/roadmap.md`, `platform/docs/ux-guidelines.md`
- `platform/backlog/tasks/T-030-web-public-pages.md`

## Done

- [ ] ISR configured on all public static pages and blog posts in `apps/web`
- [ ] Admin CMS webhook implemented for on-demand revalidation on content updates
- [ ] Lighthouse performance audit score ≥ 95 on mobile and desktop
- [ ] Core Web Vitals (LCP, FID, CLS) verified within "Good" thresholds

## Risks

- [ ] **Stale cache sync**: Ensuring pricing updates propagate instantly via on-demand revalidation.
