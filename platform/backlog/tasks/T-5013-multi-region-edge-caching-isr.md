---
id: T-5013
title: "Multi-Region Edge Caching & Incremental Static Regeneration (ISR)"
status: review
sp: 8
priority: high
category: frontend, performance, architecture, devops
phase: 50
milestone: M10
source: "docs/architecture.md, docs/ux-guidelines.md, engineering-principles.md"
adr: [0006, 0018]
screens: ["web-screens.md", "web-cabinet-screens.md"]
---

# T-5013: Multi-Region Edge Caching & Incremental Static Regeneration (ISR)

## Overview

Public marketing pages, barber portfolios, location directories, and blog posts must load instantly globally (<200ms TTFB) to maximize conversion and SEO rankings. Client-side rendering and centralized server bottlenecks cause high latency for users outside the primary server region.

This task implements Next.js Incremental Static Regeneration (ISR) with Cloudflare / CloudFront edge caching, stale-while-revalidate strategies, and automated webhook-based cache invalidation whenever services, pricing, or barber schedules are updated in the admin panel.

## Scope

- **Next.js ISR Architecture**: Configuring static generation with on-demand revalidation for all public catalog pages, locations, and portfolios.
- **Edge CDN Routing & Geolocation**: Routing visitors to the nearest Edge POP with optimal asset caching and TLS termination.
- **Cache Invalidation Webhook**: Event-driven cache purging via Redis Pub/Sub whenever admin staff update prices, working hours, or add new barbers.
- **Core Web Vitals Optimization**: Ensuring 99th percentile LCP < 1.8s and INP < 100ms across all public surfaces.

## Acceptance Criteria

1. Global Time to First Byte (TTFB) drops below 150ms across all public marketing and portfolio pages.
2. Admin updates to pricing or schedules reflect on public edge cache within 5 seconds via automated cache purging webhooks.
3. Perfect 100/100 Lighthouse performance and SEO scores across all public pages in automated CI audits.

## Done

- [x] Next.js ISR and on-demand revalidation API (`/api/revalidate`) configured and tested
- [x] Edge caching headers and stale-while-revalidate strategies in place across public surfaces
- [x] Automated unit and route tests (`apps/web/src/app/api/revalidate/__tests__/route.test.ts`) passing successfully
