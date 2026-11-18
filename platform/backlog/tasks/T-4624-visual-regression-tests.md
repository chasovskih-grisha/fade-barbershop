---
id: T-4624
title: "Automated End-to-End Visual Regression Test Suite across Viewports"
status: todo
sp: 8
priority: high
category: testing, qa, design-system
phase: 14
milestone: M3
source: "docs/testing-guidelines.md, design-system.md, ux-guidelines.md"
adr: [0001, 0004]
screens: ["web-screens.md", "admin-screens.md", "barber-screens.md"]
---

# T-4624: Automated End-to-End Visual Regression Test Suite across Viewports

## Overview

UI regressions across the public booking site (`book.fade.com.ua`), admin dashboard, and barber mobile cabinet can severely damage brand perception and cause booking flow friction. Manual QA cannot scale across all mobile device viewports, dark modes, and localization variants.

This task establishes a comprehensive Playwright-based visual regression testing suite with pixel-diff comparison pipelines integrated directly into the CI/CD pull request gate.

## Scope

- **Playwright Visual Snapshot Harness**: Configure pixel-diff testing across desktop (1440px), tablet (iPad Air), and mobile (iPhone 14) viewports for all core screens.
- **Dynamic Mock Data & Seed Isolation**: Implement deterministic database seeding per test run to guarantee identical UI states across CI runs.
- **CI/CD PR Gate Integration**: Block pull requests on visual diffs exceeding 0.1% tolerance unless explicitly approved by maintainers with snapshot updates.
- **Design Token Compliance Checks**: Verify that all rendered components strictly adhere to FADE brand typography, color tokens, and spacing scales.

## Why

Consistent visual excellence is core to the FADE brand. Automated visual regression catches unintended CSS breaks before they reach staging or production.

## Sources

- `docs/testing-guidelines.md`
- `docs/design-system.md`
- `docs/ux-guidelines.md`

## Done

- [ ] Playwright visual test configuration established in `apps/web` and `apps/admin`
- [ ] Baseline snapshots stored and managed in version control / artifact storage
- [ ] GitHub Actions workflow fails PRs on visual regression threshold breaches
- [ ] Documentation updated in `docs/testing-guidelines.md` for local snapshot updates

## Risks

- [ ] **Flaky pixel diffs due to font rendering differences between macOS (local) and Linux (CI).** Mitigation: Run tests inside standardized Docker containers matching CI environment.
- [ ] **Snapshot maintenance overhead.** Keep snapshots focused on core layout primitives and critical user journey screens.

## Out of scope

- Manual cross-browser exploratory testing (handled by human QA pass)
- Native mobile app screenshot testing (handled in mobile test suite)
