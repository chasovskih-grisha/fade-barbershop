# T-032 · Cabinet: /login, /account, /account/appointments

- **Stage**: M1 (phase 3) · **Tags**: frontend · **Complexity**: middle · **Depends on**: T-010, T-011
- **StoryPoints**: 5

## What

`web-cabinet-screens.md` §1–3: `/login` (two-step OTP with countdown), `/account` (profile, preferences, empty sections hidden), `/account/appointments` (upcoming/past, appointment card with reference and price breakdown; actions: pay deposit/remaining, edit reference before confirmation, reschedule, cancel, review — visible per phases; payment hidden before phase 8).

## Why

Client's personal space; accepts bookings from phase 4 and pays from phase 8.

## Sources

- `web-cabinet-screens.md` §1–3 (Layout/Components/States/Criteria); ADR 0005

## Done

- [ ] Login and profile work; appointments are shown after phase 4
- [ ] Actions based on appointment states (phase gates respected)

## Progress

- **2026-10-07 — "Devices" section (UI-Slice T-4422)**: `/account/devices` added to the cabinet — list of active client sessions with current device indicator and "Sign out of all other devices" button (confirmation + list refresh). Components: `page.tsx`, `useDevicesPage.ts`, `DeviceList.tsx`, API client `@/lib/api/client-sessions` (cookie `fadoidx` via next-rewrite `/identity/*`); navigation expanded in `AccountShell`. Loading/error/empty states on design system tokens (`Skeleton`, `EmptyState`, `AlertBanner`, `Modal`); new files clean per `no-phantom-classes`. Tests: 4 cases, web 94/94.

## Risks

- [ ] **Migrations**: schema changes break existing data — migration with backfill plan
- [ ] **Domain Events**: subscriptions are idempotent (pattern ADR 0009/0016)

## Implementation plan

Paths:
- apps/web/src/app/account

Checks:
- npm test --workspace=apps/web

## Implementation notes

- apps/web/src/app/account/appointments/cabinet.test.tsx

## QA

- `npm test --workspace=apps/web` exit 0
