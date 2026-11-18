# T-4742b · Bone selected state on service and barber

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4742a
- **StoryPoints**: 3

## What

In `ServiceStep` and `BarberStep`, the selected card gets the slot's selected classes: bone background, night text, medium weight. Drop `ring-2 ring-fg` from the selected branch so it cannot sit on top of the fill. `aria-pressed` stays. Hover and active follow the slot. Tokens only.

## Why

Both steps already know which id is selected. The class list is the bug.

## Sources

- T-4742a
- `apps/web/src/app/booking/steps/ServiceStep.tsx`
- `apps/web/src/app/booking/steps/BarberStep.tsx`
- `packages/ui/src/SlotPicker.tsx`

## Done

- [ ] The selected card has the bone fill and not the ring
- [ ] The other cards do not
- [ ] A test on each step covers the pressed card

## Risks

- [ ] **Sharing one class string by importing from SlotPicker.** Copy the token classes. Do not couple the steps to the slot component
