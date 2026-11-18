# T-4300e · Tests and Fixtures for UUID (4 SP)

- **Stage**: M0 (phase 0) · **Tags**: backend, testing · **Complexity**: junior · **Depends on**: T-4300b, T-4300d
- **StoryPoints**: 4

## What

Update test fixtures (T-2104 future seed and current identity tests): ID generation via `uuidv7()`, without hardcoded `1, 2, 3`. Verify that tests do not depend on autoincrement order. Smoke test OTP flow on new IDs.

## Why

Tests on Int fixtures mask unperformed migration; the first e2e (T-301) will catch this expensively.

## Sources

- ADR 0021; engineering-principles.md (test pyramid)

## Status

**Done** (2026-11-12): identity tests and shared fixtures generate ids via `uuidv7()` (`src/identity/application/test-ids.ts`, `ports.fakes.ts`), and the remaining readable ids in the client-profile controller/e2e harnesses, admin-login harness and routing module fake were replaced with generated UUIDs. Assertions compare ids by value or UUID format (no `id-1`, `u-owner`, `p-u-client-1`, no `/^id-/`). Verification: identity 60 suites / 259 tests, api unit 321 / 1322, functional e2e 34 / 103 (includes the OTP smoke flows), `tsc --noEmit` clean, `pnpm uuid:check` clean.

## Done

- [x] Fixtures and identity tests generate UUID v7
- [x] No `Int` IDs and insert order expectations in test code
- [x] Entire test pyramid is green (unit + functional + smoke)
