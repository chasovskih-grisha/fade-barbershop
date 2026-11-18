# T-4728 · The app profile uses the theme

- **Stage**: M1 (phase 3) · **Tags**: frontend, design, mobile · **Complexity**: middle · **Depends on**: T-072
- **StoryPoints**: 5

## What

`apps/mobile/src/app/(client)/account/profile/index.tsx` paints itself with raw colors: a near-black page, a blue token line, a red button. The rest of the product uses the theme tokens. `accent.blue` is not a fill.

Move this screen onto the app theme. Background, text, the card, and the button use theme colors. The push switch, once T-4722c replaces the token line, uses the same theme. This task does not add sections. Those are the other profile tasks. It also does not restyle the website profile, which already uses tokens.

## Why

The profile is the account. A one-off blue and red screen reads as a different product.

## Sources

- `apps/mobile/src/app/(client)/account/profile/index.tsx`
- `docs/design-system.md`

## Done

- [x] Slices a and b are `done`
- [x] The profile file has no raw color literals
- [x] No control uses `accent.blue` as a fill

## Risks

- [ ] **A new theme.** Use the theme the app already has. Do not add tokens for this screen
- [ ] **Restyling devices and visits in the same pass.** Only the profile screen

## Out of scope

- New profile sections (T-4719 through T-4727). They land on the theme this task establishes
- The website profile
