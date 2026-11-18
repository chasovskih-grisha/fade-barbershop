# T-053w · Phantom Tailwind Classes Audit in Booking Screens — ESLint Gate no-phantom-classes/no-phantom-classes

- **Stage**: M1 (phase 4) · **Tags**: frontend, quality, design · **Complexity**: junior · **Depends on**: T-004, T-053
- **StoryPoints**: 3

## What

ESLint gate no-phantom-classes/no-phantom-classes (T-004, design-system.md §Gates) must be green across all booking screens apps/web/src/app/booking/**/*.tsx and apps/web/src/app/barbers/**/*.tsx. The gate fails the build if a className contains a Tailwind utility absent from packages/design-tokens/dist/tailwind-preset.cjs — meaning it is not any of the design system tokens.

## Why

Without this slice, booking screens use "phantom" classes (text-h5, text-h6, text-body-s, font-semibold, tracking-wider, border-border, etc.) that have no equivalents in the preset: Tailwind does not generate them, the design system does not endorse them, theme updates do not touch them — they live their own life and gradually erode the monochrome-first brand. The gate shifts class selection from "developer guesswork" to "only those that passed audit", and every new screen is automatically checked in CI.

## Sources

- T-004 (backlog/tasks/T-004-design-system.md, §Gates "tokens only") — design system issuing the preset
- docs/design-system.md §Tokens and §Gates — specification defining what is allowed
- platform/packages/eslint-plugin-no-phantom-classes/index.js — gate implementation (prefixes text/font/bg/border/tracking/leading/shadow + numeric values)
- platform/apps/web/src/app/booking/steps/*Step.tsx, apps/web/src/app/barbers/page.tsx, apps/web/src/app/account/**/*.tsx — active screens where phantom classes were detected

## Acceptance criteria

- [ ] All booking screens (booking/steps/*, booking/AiGenerator.tsx, barbers/page.tsx) pass pnpm --filter web lint without no-phantom-classes/no-phantom-classes errors
- [ ] No text-h5, text-h6, text-body-s, font-semibold, tracking-wider, border-border, font-medium, rounded-lg, text-sm, max-w-*, etc. — only tokens from tailwind-preset.cjs
- [ ] Gate runs in CI as part of pnpm lint (next lint → eslint-plugin-no-phantom-classes resolved from workspace)
- [ ] If a class is truly needed and missing from the preset — first create a task to expand tokens.json + build.mjs (T-004), rather than bypassing the gate
- [ ] Plugin eslint-plugin-no-phantom-classes correctly evaluates tracking-* against the lineHeight group

## Risks

- [ ] **Scale**: currently 355 phantom classes exposed across 94 files in apps/web + apps/admin — Slice w covers booking screens only, remainder is fixed by separate domain slices
- [ ] **False positives**: gate works against the preset, not full Tailwind — standard classes like text-center, text-right, border-t, rounded-md will also be flagged if absent from the preset; this is expected behavior, not a gate bug
