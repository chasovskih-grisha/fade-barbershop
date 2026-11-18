# T-4833b · Slice: one phone and a channel row in the app

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, mobile · **Complexity**: junior · **Depends on**: T-4833, T-4844, T-4850
- **StoryPoints**: 3

## What

The app studio screen shows the phone once and the other channels as a row, using the same “one number” rule as the website. Tapping the phone opens the system dialer. Tapping another channel opens that URL.

## Why

The app is the surface where a tap should dial, and it currently has no contacts.

## Sources

- T-4833
- T-4844

## Done

- [ ] One stored number produces one control
- [ ] A non-phone channel opens its URL and is not presented as a phone
- [ ] Empty channels omit the row

## Risks

- [ ] **A channel the OS cannot open.** The control stays, and a failed open does not look like a booked visit

## Out of scope

- The website row (T-4833a)
