# T-4720c · Phone change from the app profile

- **Stage**: M1 (phase 3) · **Tags**: mobile, ux, identity · **Complexity**: middle · **Depends on**: T-4720a
- **StoryPoints**: 5

## What

The app profile shows the current phone, read-only, and «Change number». It calls the same two endpoints as the site. Success leaves the profile and opens the sign-in form. Collision copy matches the site and names nobody else.

## Why

The app profile does not show a phone, so the client cannot start a change the site offers.

## Sources

- T-4720a
- `apps/mobile/src/app/(client)/account/profile/index.tsx`

## Done

- [x] The profile shows the phone and starts the existing change
- [x] Success opens sign-in
- [x] A collision uses the same refusal as the site

## Risks

- [ ] **A stored second number.** The screen displays the identity phone. It does not keep another number on the device
