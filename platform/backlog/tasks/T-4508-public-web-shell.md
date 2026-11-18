# T-4508 · Public web shell (header/footer/navigation)

- **Stage**: M1 (phase 3) · **Tags**: frontend, design, seo · **Complexity**: middle · **Dependencies**: T-004, T-4506
- **StoryPoints**: 5

## What

Common public site framework `apps/web`: header (logo, navigation: Home/Locations/Services/Barbers/Blog, phone, "Register" CTA), footer (contacts, socials, policy), mobile menu. One layout component, SSR, semantic markup, `<html lang="uk">`, SEO meta tags (common template for T-030 pages).

## Why

T-030 builds 4+ public pages; without common shell each starts duplicating header/footer/navigation. Meanwhile `apps/marketing` already contains copies of public pages with mocks and outside CI — web-shell fixes canonical surface (see T-4512-marketing consolidation).

## Requirement sources

- `docs/web-screens.md` §0 (common public site blocks), §Navigation
- `docs/design-system.md` §Components (Shells: web header/footer)
- `docs/ux-guidelines.md` (§Accessibility: lang=uk, semantics, §External)
- `apps/web` (current layout), `docs/roadmap.md` (f3 gate — site with blog)

## Done

- [x] Header/footer/mobile menu as common shell, used by T-030 pages
- [x] Server render, `lang="uk"`, navigation aria attributes
- [x] SEO meta template (title/description/OG) for pages
- [x] Verified in browser on desktop and mobile width

**Result (2026-09-28).** `apps/web/src/app/components/shell/`: `PublicShell` (connected in root layout), `SiteHeader`, `SiteFooter`, `MobileNav` (client, Escape closes), `nav-items.ts` — navigation as single source for header/mobile menu/footer. Header: wordmark, 5 items, phone (from `NEXT_PUBLIC_CONTACT_PHONE`), cabinet, CTA `/booking`; footer: contacts, socials, navigation — empty sections not rendered. "Policy/Terms/Cookie" block consciously deferred to T-4402 to not multiply 404. SEO: `lib/metadata.ts` (`pageMetadata`) + template `title: '%s · Fade'` in root layout, canonical/OG via `NEXT_PUBLIC_SITE_URL`, private segments (`/login`, `/booking`, `/account`) — `noindex` via server layouts; client pages split into server layout + client component. Also removed nested `<main>` in cabinet.

Inline buttons on home (`&larr; Back to home`, raw text classes) replaced with tokens.

**Browser check (Chromium, `next build` + `next start`):** 1440×900 — header, 5 nav items, CTA, phone, footer with contacts and Telegram, canonical `https://fade.com.ua`, `og:locale=uk_UA`, `theme-color` from token, `/services` — title `…· Fade` + canonical, `/account` — `noindex, nofollow`; 390×844 — desktop nav hidden, burger with `aria-expanded` opens menu, Escape closes, no horizontal scroll (`scrollWidth == clientWidth`). Screenshots — outside repo (temp directory), visual assessment by reviewer.

**Finding for next tasks:** "Blog" menu item (web-screens §0) leads to `/blog` which doesn't exist yet — route comes with **T-031**, link to it gives 404 on prefetch. This coordinated with spec, but shouldn't release site to prod before T-031.

**Env:** `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT_{PHONE,EMAIL,ADDRESS}`, `NEXT_PUBLIC_SOCIAL_{INSTAGRAM,TELEGRAM,VIBER}` — in `.env.example` and `infra/docker-compose.yml`. `NEXT_PUBLIC_*` embeds in build, so for static routes canonical and footer determined at `next build` (.prod image has these vars at build — until T-303).

## Risks

- [x] Duplication with `apps/marketing` — decision outsources to T-4512 (resolved: option A, app removed)
