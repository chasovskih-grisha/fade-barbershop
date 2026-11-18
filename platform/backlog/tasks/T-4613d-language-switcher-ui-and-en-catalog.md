# T-4613d · Language switcher, `en` catalog and consistent locale across sibling domains

- **Stage**: M1 (phase 3) · **Tags**: frontend, i18n, design · **Complexity**: middle · **Depends on**: T-4613a, T-4613c, T-4612a, T-270a
- **StoryPoints**: 5

## What

**(1) `en` catalog.** Same keys and structure as `uk` (typed via `IntlMessages` from T-4612a), populated with `en` strings: shell, locations, services, barbers, blog, cabinet, booking steps, states, errors, `shop`. Missing key = compilation error, so a "half-populated" catalog will not pass CI. Separately: **do not keep `en` variants of proper names in keys** — brand names, domains, `Fade` remain.

**(2) `LocaleSwitcher`.** Component in `packages/ui` or in shell — depending on whether `admin`/`shop` reuse it (currently `shop` is still none, T-270a, so shell with `@fade/ui` primitive). Places: `SiteHeader` (`apps/web/src/app/components/shell/SiteHeader.tsx`), `SiteFooter`, `MobileNav`. Behavior rules:

- displays only languages with an available catalog (`SUPPORTED_LOCALES` ∩ populated);
- preserves **current path**: `/services` ↔ `/en/services`, `/booking/3` ↔ `/en/booking/3`, rather than dumping to home; prefix added by locale-aware `Link`/`usePathname` from `next-intl` (ADR 0053 §1–§4);
- writes `fade_locale` (`.fade.com.ua`, ADR 0017) — selection applies to `book` and `shop` without re-switching;
- keyboard accessible, `aria-label`, current language marked with `aria-current` (design-system.md §Accessibility, T-4510b);
- two presentation options: at least one — compact `UK`/`EN` selector in header, as a separate switcher page for two languages is an extra click.

**(3) `shop` from commit one.** `apps/shop` (T-270a) receives `/en/...` and its own `shop` catalog domain; T-4612c rule "content ≠ keys" here means product names and descriptions are strings in **the same** `Translation` table with a new `entityType: 'product'` (ADR 0053 §5: new entity = zod schema in `packages/contracts`, no migration), not keys or a separate table.

**(4) Tests and verification.** Unit: `LocaleSwitcher` (long language list, current language, missing language). E2e: switch to `/services` → `/en/services` → back; switch to `/booking` → step is preserved; e2e booking **in `en`** (all validation, API errors via `errors.<code>`); `fade.com.ua/en/booking/{location-code}` reaches the service step. Browser verification mandatory (AGENTS.md): switcher in mobile menu, long `en` strings do not break buttons/cards.

## Why

This is the part the client sees. Without it, T-4613a/c is infrastructure without a user, while with it `uk`/`en` becomes a visible feature rather than internal hygiene.

## Sources

- T-4613a (content fallback, `Translation` table), T-4613c (`app/[locale]/`, `next-intl` middleware, `hreflang`), ADR 0053 §1–§3
- T-4612a (packages, typed keys via `IntlMessages`, gate), T-4612b (migration to keys), T-4508 (`lang="uk"`, SEO), T-4507/T-4506 (primitives), T-4510b (focus/a11y)
- `SiteHeader.tsx`/`SiteFooter`/`MobileNav` (`shell/`), `nav-items.ts`; T-270a (`apps/shop`), T-053/T-4532 (book), T-4511 (Tests web)
- `docs/design-system.md` §Shells (one surface per role — switcher in three places from a single source), §Accessibility

## Done

- [ ] `en` catalog populated for all `uk` keys (no omissions — CI green)
- [ ] `LocaleSwitcher` from `packages/ui`/shell, one component in three places (`SiteHeader`, `SiteFooter`, `MobileNav`)
- [ ] Switching preserves current path; `fade_locale` on `.fade.com.ua` applies to `book` and `shop`
- [ ] Displays only languages with available catalog; `aria-current`, keyboard, focus
- [ ] UI does not switch to `en` for `admin` (`admin.fade.com.ua` remains `uk`)
- [ ] `shop` has `/en/...` and its own catalog from commit one (T-270a); product content — strings in `Translation` with `entityType: 'product'`, not keys
- [ ] E2e: uk↔en switching on `/services` and `/booking`, full booking in `en`, errors via `errors.<code>`
- [ ] Browser check: desktop + mobile menu, long `en` strings do not break layout
- [ ] `pnpm docs:validate` green

## Risks

- [ ] **Switcher resets to home** — most frequent bug; solved by having library's `usePathname` handle prefix and path rather than custom logic
- [ ] **Half-populated `en`** would cause mixed screens; TypeScript gate won't catch this for content — indicator T-4613b + e2e in `en`
- [ ] **Two independent switchers** (header/footer) with different language lists; single source `SUPPORTED_LOCALES`
- [ ] **Brand names/domains in keys** — not translated; review
- [ ] **`en` longer than `uk`** — Verify buttons/cards/tabs in browser, not just screenshot
- [ ] **Cookie on `.fade.com.ua`**: `Secure`/`SameSite`/`Max-Age` per T-4402 cookie policy, not a separate decision
- [ ] **`book` and `shop` with own rules** — shared `LocaleSwitcher` and locale-aware `Link`, prohibition of copying in application
