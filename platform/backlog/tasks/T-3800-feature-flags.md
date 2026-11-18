# T-3800 · Feature Flags

- **Stage**: M5 (phase 30) · **Tags**: backend, frontend, devops · **Complexity**: middle · **Depends on**: T-3802
- **StoryPoints**: 15

## What
Feature flags system: boolean/multivariate, targeting (user/segment/role/geo/% rollout), kill switches, scheduled rollout, change audit log, admin UI, client SDK (React/React Native), server-side evaluation, default values, emergency shutdown.

## Why
Safe deployment. Progressive rollout. A/B tests. Instant rollback. Deployment decoupled from release.

## Sources
- docs/feature-flags.md — phantom 2026-09-22: file never existed; source accepted at task start
- LaunchDarkly / Unleash / GrowthBook pattern

## Dependencies
> Slices are allocated at task start; individual subtask files are created then as needed.
