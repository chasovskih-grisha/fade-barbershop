# T-6005 · Comprehensive End-to-End Visual Regression and Accessibility Test Suite

- **Stage**: M3 (phase 15) · **Tags**: testing, qa, frontend, accessibility · **Complexity**: senior · **Depends on**: T-2105, T-4810
- **StoryPoints**: 8

## What

Implement a robust Playwright-based visual regression testing pipeline paired with Axe-core automated accessibility audits across all web, admin, and mobile web surfaces. Cover all key user journeys across desktop, tablet, and mobile viewports with strict pixel-diff thresholds and WCAG 2.1 AA compliance gates in CI.

## Why

Prevents UI breakage, styling regressions, and accessibility barriers from reaching production, ensuring a polished, professional brand experience.

## Acceptance Criteria

1. Visual regression tests run automatically on every pull request against baseline snapshots.
2. Automated accessibility audit catches and blocks PRs with WCAG 2.1 AA contrast or ARIA violations.
3. Test reports provide side-by-side visual diff comparisons for flagged UI changes.
