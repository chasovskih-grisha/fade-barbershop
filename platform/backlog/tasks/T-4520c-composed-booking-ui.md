# T-4520c · Multi-selection Flow and Admin Card (2/8)

- **Stage**: M1 (phase 4) · **Tags**: frontend · **Complexity**: junior · **Depends on**: T-041, T-4520a, T-4520b
- **StoryPoints**: 2

## What

Booking flow step 1 → multi-service selection: `checkbox` pattern instead of radio; total duration and price shown in a live line (from theme, without hex); "Next" active when ≥1 selected. Conditional constraints: "father+son" mode unavailable with composition (T-044 does not mix). Admin: visit card shows items in a list; compose-slice in catalog remains (fixed combos do not disappear).

## Why

Most frequent booking scenario — multiple services; without UI, domain change (T-4520a/b) is invisible to client. Extracted separately because after stable item model this is purely frontend work using same tokens and tests.

## Sources

- `docs/booking-flow.md` §Screen 1 (UI selection pattern)
- `docs/design-system.md` §Components (checkbox pattern, T-4507b)
- `docs/admin-screens.md` §5 (visit card), §15 (combos)

## Done

- [ ] Step 1: multi-selection + live duration/price sum line
- [ ] Composition disables father-son mode (validation)
- [ ] Admin card shows items; e2e case in booking-flow-tests; `pnpm docs:validate` green
