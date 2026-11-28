# T-4840b · Slice: share the studio from the app

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4840, T-4844
- **StoryPoints**: 3

## What

The app studio screen offers the system share sheet with the studio name and the website URL `/locations/{code}`. Cancelling the sheet stays on the screen.

## Why

The phone is where the share sheet already exists.

## Sources

- T-4840
- T-4844

## Done

- [ ] The payload is the studio name plus the canonical website URL
- [ ] Cancel does not navigate away
- [ ] A test asserts the payload

## Risks

- [ ] **Sharing an app route the recipient cannot open.** The URL is the website path

## Out of scope

- The website copy control (T-4840a)
