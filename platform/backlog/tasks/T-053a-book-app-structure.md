# T-053a · Creation of `book` app structure

- **Stage**: M1 (phase 4) · **Tags**: frontend, infra · **Complexity**: junior · **Depends on**: T-053
- **StoryPoints**: 3

## What

Creation of basic Next.js application structure for quick-booking:
- Initialize Next.js app (app router)
- Configure shared design-system packages
- Setup routing structure (5-step flow)
- Configure TypeScript and ESLint
- Setup Tailwind CSS integration
- Basic layout and shared components

## Sources

- T-053 (quick-booking context)
- ADR 0017 (domains)
- packages/design-system

## Done

- [x] Next.js app initialized
- [x] Design-system packages configured
- [x] Routing structure setup
- [x] TypeScript configured
- [x] Tailwind configured
- [x] Basic layout works

## Verification (2026-11-25, status `review`)

The slice is structure only, and the structure is in the tree. `apps/book` was dropped
before the slice started: quick-booking is a route of `apps/web` (ADR 0017 revision
2026-10-01, journal 2026-10), so nothing is created for a second application.

- **Next.js app**: `apps/web` — App Router, `next` 15, `src/app/layout.tsx` as the root
  layout.
- **Design system**: `@fade/design-tokens`, `@fade/ui`, `@fade/brand-assets` are
  workspace dependencies in `apps/web/package.json`; screens import `Button`,
  `Card`, `StepIndicator` from `@fade/ui`.
- **Routing structure**: `/booking` is `src/app/booking/page.tsx` with its own
  `layout.tsx`, `error.tsx` and the step components in `src/app/booking/steps/`; the
  flow order lives in `useBookingFlow.ts` (`STEPS`).
- **TypeScript**: `apps/web/tsconfig.json`, `typecheck` script = `tsc --noEmit`.
- **Tailwind**: `apps/web/tailwind.config.js` + `postcss.config.js`, tokens come from
  `@fade/design-tokens`, not literal values.
- **Basic layout**: `src/app/booking/layout.tsx` sets the segment metadata (`noIndex`)
  and `src/app/booking/BookingHeader.tsx` is the flow's own header. Note: the public
  shell (`PublicShell` in `src/app/layout.tsx`) still wraps `/booking`, so the public
  header and footer are visible there. Dropping them is a criterion of T-053, not of
  this structure slice, and it needs the shell moved into a route group.

The app map, route table and the "no `apps/book`" rule are written down in
`apps/web/README.md` so the next slice does not look for a second app.

## Risks

- [ ] **Shared packages**: shared package versions may conflict
