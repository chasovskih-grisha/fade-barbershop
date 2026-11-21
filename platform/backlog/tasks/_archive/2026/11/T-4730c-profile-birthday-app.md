# T-4730c · Birthday on the app profile

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux, mobile · **Complexity**: junior · **Depends on**: T-4730a
- **StoryPoints**: 3

## What

Add the same day and month control to the app profile, including clear and the same display. A date saved on the site shows here.

## Why

The date is one profile field. The app has to read it.

## Sources

- T-4730a
- `apps/mobile/src/app/(client)/account/profile/index.tsx`

## Done

- [x] The app shows a date saved on the site
- [x] Clear on the app removes it for the site as well

## Risks

- [x] **A year wheel.** The control asks for day and month only
- [x] **31 February.** Shortening the month clamps the chosen day (`clampDay`), same rule as the website
