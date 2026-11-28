# T-2600d · SEO Performance (8/38)

- **Stage**: M5 (phase 30) · **Tags**: frontend, performance · **Complexity**: senior · **Depends on**: T-030, T-032
- **StoryPoints**: 8

## What

Slice 4/5 of parent T-2600: Core Web Vitals (LCP/INP/CLS) on public pages, SSR/streaming, bundle weight, images (WebP/AVIF — integration with T-4201), regression monitoring in CI.

## Why

Speed is a direct ranking factor and conversion driver; live slots (T-130) and SEO pages require fast rendering.

## Sources

- roadmap phase 26, engineering-principles.md (quality gates)
- Google Search Console (CWV reports)

## Done

- [ ] CWV green on all public pages (mobile LCP < 2.5s)
- [ ] Performance budgets in CI (regression alert)
- [ ] Images automatically converted to WebP/AVIF

## Risks

- [ ] **CWV vs live slot dynamics**: hydration must not break LCP — Tests on pages with T-130

## Dependencies

- T-2600 (parent: SEO strategy finalization after all slices)
