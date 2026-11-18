# T-4441 · Walk-in "recurring client"

- **Stage**: M2 (phase 5) · **Tags**: backend, crm · **Complexity**: junior · **Depends on**: T-120, T-046, T-061
- **StoryPoints**: 5

## What

After the first walk-in, `isWalkInRecurring` is encoded: a client without an account (phone number only) receives an identifier; on subsequent visits, CRM learns "recurring" (visit counter, T-061). A separate "transfer to account" flow (link number to account, T-4423 patterns), priority in reminder.

## Why

Walk-in CLT-01 is a segment that comes without a system and gets lost; identification via phone number allows collecting history (T-061) and re-booking through the regular flow.

## Sources

- crm README; WALK-* (AC walk-in); T-120 (walk-in creates residual records), T-061

## Done

- [ ] Walk-in without account has an identifier; visit counter is maintained
- [ ] "Link number" flow ends with consolidation (T-4423)
- [ ] Reminder priority accounts for `isWalkInRecurring`

## Risks

- [ ] **Number duplicates**: linking via T-4423, not naive number matching
