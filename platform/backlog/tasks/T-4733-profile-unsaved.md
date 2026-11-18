# T-4733 · Leaving the profile warns about unsaved edits

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4719a, T-4721a
- **StoryPoints**: 8

## What

The name field and the preference note can be half-typed. Navigating to visits or devices throws the draft away with no warning.

When the name or the note differs from the last saved value, leaving the profile asks «Save changes?» with «Save», «Don't save», and «Stay». Save runs that section's existing save and then leaves. «Don't save» leaves and drops the draft. «Stay» stays. A failed save stays on the profile and shows that section's error. It does not navigate.

Sign-out does not use this prompt. T-4723 owns sign-out. Notification switches are saved with their own button and are not part of this prompt.

## Why

The preference note is the text the barber will read. Losing a paragraph because the client opened visits is a bad surprise.

## Sources

- `apps/web/src/app/account/page.tsx`
- `apps/mobile/src/app/(client)/account/profile/index.tsx`
- `docs/web-cabinet-screens.md` §2

## Done

- [ ] Slices a, b, and c are `done`
- [ ] A dirty name or note asks before a move to visits or devices
- [ ] A clean profile does not ask
- [ ] A failed save does not navigate

## Risks

- [ ] **Warning on every route in the app.** Only when leaving the profile with a dirty name or note
- [ ] **Blocking sign-out.** Sign-out keeps the T-4723 confirm
