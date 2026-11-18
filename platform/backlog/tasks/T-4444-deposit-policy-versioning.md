# T-4444 · Deposit Policy Versioning and Acceptance

- **Stage**: M2 (phase 5) · **Tags**: backend, legal · **Complexity**: junior · **Depends on**: T-4402, T-091
- **StoryPoints**: 3

## What

Deposit policy (T-4402) — `DepositPolicy` with version number, effective date, and terms text; client consent is recorded with the version (audit report: "who accepted which version"), and rule updates for new bookings do not break previously signed agreements.

## Why

Rules (deposit amount, cancellation refund) change manually; without versioning, consent is legally unproven.

## Sources

- T-4402 (deposit); open decision "deposit"; billing README; security/legal section

## Progress

- 2026-12-07 — versioned storage slice landed: `DepositPolicyVersion` rows are written in the same transaction as the `AppSetting` upsert; unchanged terms do not bump the version; `GET /admin/settings/deposit-policy` returns `version`, `GET .../history` returns approved sets; admin screen shows the current version and the history list. Acceptance records and the consent screen are still open.

## Done

- [x] Policy versions are stored (row per change: terms, version, author, timestamp)
- [ ] Acceptance records (user, version, timestamp) are stored — open until the consent screen
- [ ] Consent screen displays exact text version at the moment of acceptance
- [x] Unit test "rule change does not affect previously signed agreements" — visits keep their Booking snapshot (book-appointment-deposit-policy.spec, prisma-appointment-time-mover.persist.spec)

## Risks

- [ ] **Text drift**: accepted text must be stored as a snapshot in version history rather than referencing a live file.
