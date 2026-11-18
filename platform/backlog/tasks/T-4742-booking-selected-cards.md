# T-4742 · A chosen service and a chosen barber look like a chosen slot

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-041
- **StoryPoints**: 5

## What

A chosen slot is a bone tile: bone fill, night text, `aria-pressed`. A chosen service and a chosen barber are the same cards with `ring-2 ring-fg`. On a dark page the ring is easy to miss, and the three steps of one flow mark a choice three ways.

The selected service card and the selected barber card use the same bone fill, night text, and pressed state as the selected slot. Unselected cards stay as they are. The ring does not remain on the selected card. This does not change what the click stores.

## Why

The client can leave the service step unsure which card will be booked. The slot step already answered that question for time.

## Sources

- `apps/web/src/app/booking/steps/ServiceStep.tsx`
- `apps/web/src/app/booking/steps/BarberStep.tsx`
- `packages/ui/src/SlotPicker.tsx`
- `docs/design-system.md`

## Done

- [ ] Slices a and b are `done`
- [ ] The selected service and the selected barber use the bone fill and night text
- [ ] A card that is not selected does not

## Risks

- [ ] **A new selected color.** Bone on night is the slot rule. `accent.blue` is not the fill
- [ ] **Restyling the slot.** The slot stays as it is

## Out of scope

- The pin (T-4711)
- Prices on the card. The price line stays
