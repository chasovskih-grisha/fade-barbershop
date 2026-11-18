# T-4833 · The phone appears once, and the other channels are a row

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4406, T-4831, T-4850
- **StoryPoints**: 8

## What

The listing prints `phone` as a text link. The studio page hides the phone inside `LocationChannels`, a stack of underlined «Label: value» lines. A phone that is both `location.phone` and a phone channel appears twice once both are shown.

The studio page shows the phone once, in the action row, as a button-sized `tel:` control. The other channels (telegram, instagram, and the rest) are a horizontal row of named controls, not a second copy of the phone. A channel list that is only the phone renders no second block. Slices: website (T-4833a), app (T-4833b).

## Why

The guest who wants to call is hunting an underlined line under a heading, and may find two numbers that are the same number.

## Sources

- `apps/web/src/app/locations/[code]/LocationChannels.tsx`
- `apps/web/src/app/locations/[code]/channel-format.ts`
- T-4406 (channels already stored)
- T-4596 (the `phone_click` event already names these nodes — do not add a second event)

## Done

- [ ] T-4833a and T-4833b are done
- [ ] A studio with one phone number shows that number once

## Risks

- [ ] **Two different numbers.** If `location.phone` and the phone channel differ, show the channel value once and do not also show `location.phone`

## Out of scope

- Analytics for the click (T-4596)
- Admin editing of channels (T-4406, done)
