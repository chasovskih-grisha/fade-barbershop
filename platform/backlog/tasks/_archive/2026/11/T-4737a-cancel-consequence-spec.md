# T-4737a · Specify the cancel consequence

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4737
- **StoryPoints**: 2

## What

In `docs/web-cabinet-screens.md` §3, next to the cancel action, state the three cases.

- No deposit on the visit: the dialog does not mention a deposit.
- Deposit and a stored window: «Депозит повернеться» when the cancellation is outside the window, «Депозит утримується» when it is inside. The window is the one stored on the visit.
- Deposit and no stored window: no money sentence.
- The dialog does not perform the refund.

## Why

§3 already tells the dialog to explain the policy. It does not say what to do before a deposit exists.

## Sources

- T-4737
- `docs/web-cabinet-screens.md` §3

## Done

- [x] The three cases are in §3
- [x] `pnpm docs:validate` reports no new error from this file

## Risks

- [ ] **A second policy.** The visit's stored window wins over the network default
