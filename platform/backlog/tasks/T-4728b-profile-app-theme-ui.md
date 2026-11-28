# T-4728b · Remove raw colors from the app profile

- **Stage**: M1 (phase 3) · **Tags**: mobile · **Complexity**: junior · **Depends on**: T-4728a
- **StoryPoints**: 3

## What

Replace the `COLOR` map and the hex styles in the app profile with the app theme. Keep the current layout. Do not add fields in this slice. A search of the file finds no hex colors and no `accent.blue` fill.

## Why

The styles are local to this file, so the fix is local.

## Sources

- T-4728a
- `apps/mobile/src/app/(client)/account/profile/index.tsx`

## Done

- [x] The profile file has no hex color literals
- [x] The screen still shows the title «Профіль» and the notification block

## Risks

- [ ] **Waiting for the other slices.** This slice themes the screen as it is. Later slices inherit the theme instead of bringing hex back
