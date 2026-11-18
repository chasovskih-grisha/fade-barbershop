# T-4611b · Email Layout Primitives (5/11)

- **Stage**: M2 (phase 7) · **Tags**: backend, notifications · **Complexity**: middle · **Depends on**: T-4611a, T-4609a
- **StoryPoints**: 5
- **Priority**: highest in the email lane, after T-4609 and T-4611a. `emailLogo` is the brand mark in the email.

## What

Shared HTML building blocks for constructing emails. All values come from `email.*` (T-4611a), with no hardcoding.

| Function | Responsibility |
|---------|------------------|
| `emailLayout({ preheader, title, body, footer })` | Shell wrapper: `max-width`, horizontal `padding`, `bg` from `email.bg`, `role="presentation"` on tables, preheader row (hidden preview text at the top of the email) |
| `emailLogo(variant)` | `lockup-on-milk.svg` from `packages/brand-assets` (T-4609a) as an `<img>` with a **fallback** to a text wordmark; `alt` is mandatory; no external CDNs without local hosting. Emails represent paper, hence the milk background. Nightly `lockup-on-dark.svg` remains for the site chrome, admin, and app (T-4609b/c/d) |
| `emailTable(rows)` | Label ↔ value table with `border`/`spacing`; semantic markup (`role="presentation"` on decorative tables) |
| `emailButton({ label, href })` | CTA with `accent`/`accent.onSolid`, `border-radius` from tokens; no JS, no `<a>` without `href` |
| `emailText(text, opts)` | Text/signature with `text.primary`/`text.secondary`; context-aware escaping |

Constraints (to be documented in README to avoid redundant markup review): table grid layout, inline CSS, maximum ~8–10 nested tags, no `<script>`, no external stylesheets, no media queries. The `text` variant is generated from the same data — a separate render, not stripped HTML.

## Why

T-4608 is the sole template, so previously there was no shared layer: layout, colors, font, and branding were written directly inline (`booking-confirmation-template.ts:63-78`). Subsequent emails (receipt, reminder, win-back, birthday) would copy this inline string, and each copy would drift by a padding value.

## Sources

- `apps/api/src/notifications/application/booking-confirmation-template.ts` (current state, hardcoded `color:#666`/`#111`, font, `max-width:480px`)
- `apps/api/src/notifications/README.md` (context boundaries where templates reside)
- `packages/design-tokens` `email.*` (T-4611a); `brand/logo/system/lockup-on-milk.svg` + T-4609a (platform assets)
- T-4608 (consumer), T-4523/T-4555 (subsequent consumers, out of scope for this task)

## Done

- [ ] All five primitives are pure functions (without Nest/Prisma/IO), deterministic render
- [ ] Values exclusively from `email.*`; zero inline colors or sizes
- [ ] `emailLayout`: preheader, `max-width`, `bg`, `role="presentation"`, zero external resources or scripts
- [ ] `emailLogo`: light lockup + mandatory text fallback + `alt`; fallback test without asset
- [ ] `emailTable` / `emailButton` / `emailText`: semantic markup, alt-compatibility, context-aware attribute escaping
- [ ] `text`-render from the same data: emails function properly without images (test)
- [ ] Constraints table (tags, nesting, forbidden practices) in `notifications/README.md`
- [ ] HTML snapshots for each primitive; test ensuring no `<script>` or external `http(s)` references
- [ ] `pnpm docs:validate` passes successfully

## Implementation plan

Paths:
- apps/api/src/notifications/application/primitives/
- apps/api/src/notifications/application/primitives/email-layout.spec.ts

Checks:
- `pnpm --filter @fade/api exec jest src/notifications/application/primitives`

## Implementation notes

- apps/api/src/notifications/application/primitives/email-blocks.ts
- apps/api/src/notifications/application/primitives/email-escape.ts
- apps/api/src/notifications/application/primitives/email-layout.spec.ts
- apps/api/src/notifications/application/primitives/email-layout.ts
- apps/api/src/notifications/application/primitives/email-logo.ts
- apps/api/src/notifications/application/primitives/email-tokens.ts

## Risks

- [ ] **Primitive tailored to a single template**: instead of reuse, an `emailLayoutConfirmation` might emerge — verified via a second template (T-4611c)
- [ ] **Temptation to add VML/Outlook markup** ("let's make it look like Outlook") — weeks of work with low ROI: a reliable ~8-tag email structure is preferred
- [ ] **Logo `img` blocked** by email client — without fallback the header vanishes entirely; fallback is mandatory
- [ ] **Escaping text only** — attribute contexts (`href`, `alt`) must be escaped separately
- [ ] **Preheader not escaped** or leaking into visible text body — minor detail, but noticeable in Gmail
- [ ] **Logo missing `alt`** — breaks screen reader accessibility; empty `alt` devalues it
