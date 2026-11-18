# T-4443 · Minimal Mobile Crash Monitoring

- **Stage**: M2 (phase 5) · **Tags**: devops, mobile · **Complexity**: middle · **Depends on**: T-070, T-303
- **StoryPoints**: 5

## What

iOS/Android crash collection on startup: Sentry (or lightweight equivalent) for client and barber apps with symbolication (on build), aggregation by OS/app version, alert on "new crash class". Without full routing — only non-fatal trouble classes for diagnostics.

## Why

First users (CLT-01) already leave the app once — loss if issue is typical; UI pragmatic without crash corridor won't see issue until complaint.

## Sources

- observability.md; products.md (app quality); T-303 (DevOps cycle)

## Done

- [ ] Crashes sync to API (without PII), minimal payload
- [ ] Alert on new crash class (T-4204 consumes signal)
- [ ] Symbolication works in CI (ad-hoc release)

## Risks

- [ ] **PII collection**: payload has technical context only — PII filter check (T-4490)
