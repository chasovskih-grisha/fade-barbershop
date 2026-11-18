# T-4810 · Comprehensive Playwright E2E Test Suite for Booking & Party Flows

- **Stage**: M1 / M3 · **Tags**: testing, frontend, qa · **Complexity**: senior · **Depends on**: T-041, T-044
- **StoryPoints**: 8

## What

Build an end-to-end automated test suite using Playwright covering critical client booking journeys across web and mobile web interfaces, including anonymous booking, OTP login, and complex AppointmentParty (father-son) flows.

- Playwright test scenarios for 5-step booking flow (`T-053`).
- Visual regression testing for key UI screens (SlotPicker, PriceBreakdown, Admin Calendar).
- CI integration running E2E tests against local Docker stack on every pull request.

## Why

Ensure robust functional coverage and prevent regressions in the core revenue-generating booking funnel.

## Sources

- `platform/docs/booking-flow-tests.md`, `platform/docs/testing-guidelines.md`
- `platform/backlog/tasks/T-041-booking-flow.md`

## Done

- [ ] Playwright test harness configured with Docker service orchestration in CI
- [ ] Test coverage for anonymous booking, OTP authentication, and reschedule/cancellation
- [ ] Test coverage for Father-Son (AppointmentParty) simultaneous booking flow
- [ ] HTML test reports and failure screenshots captured as CI artifacts

## Risks

- [ ] **Flaky tests**: Managing asynchronous UI loading states and mock clock stability in E2E runs.
