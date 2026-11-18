# T-2103c · Regressions (7/25)

- **Stage**: M5 (phase 30) · **Tags**: frontend, quality, testing · **Complexity**: middle · **Depends on**: T-301
- **StoryPoints**: 7

## What
Run full regression suite: e2e scenarios (booking, auth, payment, admin), unit/integration tests, visual regression (Chromatic/Percy). Fix all found regressions. CI gate — green build.

## Why
Refactor and new features break existing behavior. Regression run is insurance. CI gate prevents broken code from reaching prod.

## Sources
- docs/testing-guidelines.md — real document from 2026-09-24 (conventions based on actual code)
- GitHub Actions / CI
- Chromatic / Percy

## Done
- [ ] E2E 100% passed
- [ ] Visual regression clean
- [ ] CI green
