# T-4612a · `next-intl`: dictionaries, ICU plurals, typed keys, hardcode gate (5/13)

- **Stage**: M1 (phase 3) · **Tags**: frontend, i18n, quality · **Complexity**: middle · **Depends on**: T-4508
- **StoryPoints**: 5

## What

Foundation without which the rest of the task is a hurried translation. Tools from `package.json`, per ADR 0053 §4; a custom `t()` layer is **not written** (see "Rejected" below).

**Packages.** `next-intl` (App Router: middleware with language detection, `t()`, ICU, locale-aware `Link`/`usePathname`, SEO helpers), `eslint-plugin-i18next` (gate on literal strings), `@formatjs/cli` (message extraction and ICU validation in CI), `zod` (schemas for content translation payloads in `packages/contracts` — used later in T-4613a). Dependencies are added to `apps/web` (and root, because the gate must bypass `packages/`); `apps/shop` receives them in T-270a.

**Configuration.** `next-intl` in `localePrefix: 'as-needed'` mode (ADR 0053 §2): `uk` without prefix, rest with `/<locale>/` — exactly what was agreed upon, without custom `localePath`. Initially only `uk`, but the list of locales is a config, not code with a `locale === 'en'` condition.

**Message Format.** Domain JSON files in `apps/web/messages/`: `common`, `shell`, `locations`, `services`, `barbers`, `blog`, `booking`, `account`, `login`, `states`, `errors`, `shop`. Typed keys via `IntlMessages` type augmentation (global type that `next-intl` extends), so `t('nonexistent')` does not compile. Pluralization rule is **ICU**, not manual calculation: for `uk` three forms (`1, 2–4, 5+ visits`), fundamentally different from `count === 1`; ICU messages are validated by `@formatjs/cli` in CI.

**Formats.** `next-intl` provides `useFormatter()` on top of `Intl` with the current language locale: dates, times, numbers, currency, relative time intervals. Manual `toLocaleString` calls disappear from screens (ADR 0001, `design-system.md:99`).

**Gate.** `eslint-plugin-i18next` with a rule on literal strings in JSX and error texts, level `error`, with an explicit `allowlist` file (proper names, dynamic values from DB, technical strings in tests). Without the gate, the very next task will reintroduce the style this task just removed.

**Two languages immediately, not one.** Infrastructure arrives alongside T-4613 (which brings `en`), so dependency, config, and gate are verified not on "one language now, add later", but on two.

## Why

`apps/web` has 46 files with Ukrainian strings (122+ literals) and **zero** i18n dependencies. Founder decision (2026-09-29): users switch language, so translations must be a first-class subsystem rather than a custom layer that would have to be migrated to a library already populated with content and the first translation in the database.

## Implementation plan

- `apps/web/i18n.ts`
- `apps/web/src/routing.ts`
- `apps/web/messages/uk.json`
- `apps/web/messages/en.json`
- `apps/web/src/types/intl.d.ts`

Checks:
- `pnpm --filter web typecheck`

## Done

- [x] Dependencies in `package.json`: `next-intl`, `eslint-plugin-i18next`, `@formatjs/cli`, `zod` (in `apps/web` + root for gate)
- [x] `i18n.ts` with `localePrefix: 'as-needed'`, `defaultLocale: 'uk'`, list of locales in config
- [x] Domain JSON catalogs for `uk`: `common`, `shell`, `locations`, `services`, `barbers`, `blog`, `booking`, `account`, `login`, `states`, `errors`, `shop`
- [x] Typed keys via `IntlMessages` (augmentation); non-existent key does not compile
- [x] ICU plurals for `uk` with test on 1 / 2 / 5
- [x] Dates/numbers/currency/time — via `useFormatter()`; 0 manual `toLocaleString` left in screens
- [x] `next-intl` provider connected in `PublicShell`; server components (`getTranslations`) work without global state
- [x] `eslint-plugin-i18next` gate at `error` level for `apps/web` with `allowlist` file
- [x] `@formatjs/cli` in CI: parity of key sets between locales + ICU validation
- [x] README: key format, ICU plural rule, how to add a language (note in catalog + line in locale list)
- [x] `pnpm docs:validate` green

## Risks

- [ ] **`next-intl` requires `app/[locale]/`** — page tree moves (T-4613c); if gate is added before the move, imports will need fixing twice. Order: a (packages+catalogs) → c (routing) → b (migration)
- [ ] **Gate with `allowlist` of 200 lines** — will become garbage itself; allowlist only for names and DB values, review on addition
- [ ] **ICU is hard to read** — `{count, plural, one {...} few {...} many {...}}` is longer than `count === 1`; accepted as the way, test on 1/2/5 is mandatory
- [ ] **JSON, not TS**: keys not visible in IDE without plugin — compensated by `IntlMessages` typing, without it typical `t('typo')` passes
- [ ] **Bundle size** `intl-messageformat` + ICU parser on client — verify that first page did not grow by tens of KB
- [ ] **Modifying `uk` catalog breaks `shop` build** (T-270a) — key parity check in CI must be before T-270a, not after
- [ ] **Rejection of custom layer** (§ "Rejected") means dependency on someone else's configuration — therefore README fixes what we do ourselves (`localePrefix`, ICU, gate) and what we don't

## Implementation notes

- apps/web/i18n.config.json
- apps/web/i18n.ts
- apps/web/messages/en.json
- apps/web/messages/uk.json
- apps/web/src/routing.ts
- apps/web/src/types/intl.d.ts

## QA

- `pnpm --filter web typecheck` exit 0
