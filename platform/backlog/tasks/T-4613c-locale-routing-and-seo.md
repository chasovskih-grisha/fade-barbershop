# T-4613c · `app/[locale]/`, `next-intl` middleware and SEO: `hreflang`, canonical, sitemap

- **Stage**: M1 (phase 3) · **Tags**: frontend, i18n, infra · **Complexity**: middle · **Depends on**: T-4612a, T-4612b, T-4508, T-4532
- **StoryPoints**: 8

## What

Two-address mechanics established in ADR 0053 §2–§4. `apps/web` serves `fade.com.ua`, including `/booking`, so everything is done once.

**(1) `next-intl` config and middleware instead of custom code.** Config `i18n.ts`: `defaultLocale: 'uk'`, `localePrefix: 'as-needed'` — meaning `uk` without prefix, `en` with `/en/`, precisely the agreed-upon scheme without custom routing code. Library middleware: an unknown first segment resembling a locale (`/de/...` while `de` is not in the list) → 404, not silent fallback to `uk` (otherwise Google would index `/de/` as a `uk` duplicate). Source of truth is URL; cookie `fade_locale` (`.fade.com.ua`) is read only on the root `/` and issues a single 302 to `/en/` — **only** if not a crawler (check `User-Agent: SearchBot`/`Googlebot`, ADR 0053 §3).

**(2) Tree becomes `app/[locale]/` — and this is an accepted cost.** All 12 `page.tsx` and client components move under the locale segment; `layout.tsx` becomes `app/[locale]/layout.tsx`, locale is read via `getLocale()`/`params`. Rationale: a flat tree with custom rewrites would require its own `localePath`, its own SEO meta-template, its own locale rule, and manual `x-locale` in cache — essentially rewriting what `next-intl` already does while still leaving `t()` without routing. The move is mechanical (import updates), but cannot be deferred: two parallel trees mean double maintenance. Consequence to account for: **cache is disabled for localized paths** — otherwise Next will serve `uk` render under `/en/`.

**(3) Links are locale-aware from the library.** `next/link` with `locale="en"` and `usePathname` instead of home-grown `localePath(locale, path)`. `NAV_ITEMS`/`BOOKING_HREF` (`shell/nav-items.ts`) become functions of locale, but the prefix is added by the library. Raw path strings in JSX are prohibited by extending the T-4612a gate (without this rule, `/en` would drift within a week). Quick-booking location code does not conflict: `fade.com.ua/en/booking/{location-code}`.

**(4) SEO in one place.** `pageMetadata` (`apps/web/src/lib/metadata.ts`) sets `alternates.canonical` (for page language) + `alternates.languages` (`uk`, `en`) via `next-intl` SEO helpers, `og:locale` from locale instead of string `'uk_UA'` (`:33`), dynamic `<html lang>` instead of hardcoded `uk` (`layout.tsx:34`), sitemap with both languages, `x-default` pointing to `uk`. `hreflang` must be **mutual**: `uk` page links to `en` and vice versa — asymmetry destroys the signal.

## Why

This is a task that cannot be done "later": `hreflang` and canonical URLs must be served from the first indexing, and changing the address scheme afterwards = 301 migration with ranking loss. Therefore it sits in M1 along with the toggle, not in M6. Context that added 3 SP: the decision on `app/[locale]/` was initially avoided as "duplicating the tree", but it eliminates four custom subsystems that would otherwise have to be maintained.

## Sources

- **ADR 0053** §2 (URL and `localePrefix: as-needed`), §3 (URL vs cookie), §4 (`next-intl`, `app/[locale]/`), §1 (`book` coverage)
- `apps/web/src/lib/metadata.ts:33`, `apps/web/src/app/layout.tsx:34`, `apps/web/src/app/components/shell/nav-items.ts`, T-4508 (SEO template, done)
- T-4532 (`fade.com.ua/booking/{location-code}`), T-4541 (deep links), T-4612a (packages & gate), T-4612b (migration), T-4511 (Web tests)

## Done

- [ ] `i18n.ts`: `defaultLocale: 'uk'`, `localePrefix: 'as-needed'`, locale list in config
- [ ] `middleware.ts` from `next-intl`; unknown "locale-like" segment → 404
- [ ] Tree migration: 12 `page.tsx`, `layout.tsx` and client components under `app/[locale]/`; no duplicate pages
- [ ] `getLocale()` server-side; cache disabled for localized paths
- [ ] Links via locale-aware `Link`/`usePathname`; `NAV_ITEMS`/`BOOKING_HREF` localized
- [ ] T-4612a gate prohibits raw paths in JSX
- [ ] `alternates.canonical` + `alternates.languages` (`uk`/`en`, `x-default` = `uk`) in `pageMetadata`; `og:locale` from locale
- [ ] Dynamic `<html lang>`; sitemap with both languages
- [ ] Mutual `hreflang` on page pairs; `fade.com.ua/en/booking/{location-code}` works
- [ ] `fade_locale` on `.fade.com.ua`: 302 from root, for `SearchBot`/`Googlebot` — no redirect
- [ ] Tests: middleware (uk/en/unknown/404), locale-aware links, e2e "`/en/services` has `lang="en"` and canonical pointing to itself"
- [ ] Browser checked: switching uk↔en preserves path, canonical/hreflang in devtools
- [ ] `pnpm docs:validate` green

## Risks

- [ ] **Cache serves `uk` under `/en/`** — most common bug; fixed by `dynamic`/`revalidate: 0` for localized paths + e2e header check
- [ ] **Tree migration touches all pages** — 12 `page.tsx` plus client components; do in one pass, before T-4612b, otherwise imports will need fixing twice
- [ ] **Old tests & snapshots will break** on changed paths (`/services` → parameterized) — T-4511; expected, but must not leave half the tests outside `app/`
- [ ] **`/de/` → silent `uk`** duplicates pages; 404 on unknown prefix is mandatory
- [ ] **Cookie redirect for crawler** → Google sees hops; UA check is mandatory and tested
- [ ] **Asymmetric `hreflang`** loses signal; test for mutuality
- [ ] **Locale forgotten when caching `fetch`** to API — locale passed as parameter (`?locale=`), not header on internal calls (T-4613a)
- [ ] **`[locale]` treated as "segment can be guessed"`** — `uk` without prefix validated by config, not manual check everywhere
