# T-4721c · Preference note on the app profile

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux, mobile · **Complexity**: middle · **Depends on**: T-4721a
- **StoryPoints**: 5

## What

Add the same note to the app profile. Load and save `PATCH /identity/profile/preferences`. The hint and the limit message match slice a. A note saved on the site appears here on the next open.

## Why

The barber reads one note. The app never writes it.

## Sources

- T-4721a
- `apps/mobile/src/app/(client)/account/profile/index.tsx`

## Done

- [ ] The app shows the stored note and the hint
- [ ] Over the limit, it does not send
- [ ] A site save is visible in the app

## Risks

- [ ] **Tags.** The control is a multiline note, matching the site textarea
