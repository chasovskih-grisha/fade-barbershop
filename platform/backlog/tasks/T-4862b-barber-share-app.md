# T-4862b · Slice: share the barber from the app

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4862, T-4867
- **StoryPoints**: 3

## What

The app barber screen opens the system share sheet with the name and the website profile URL. Cancel stays on the screen.

## Why

The phone is where the sheet already exists.

## Sources

- T-4862
- T-4867

## Done

- [ ] The payload is the name plus the website profile URL
- [ ] Cancel does not navigate
- [ ] A test asserts the payload

## Risks

- [ ] **An app route the recipient cannot open.** The URL is the website path

## Out of scope

- The website control (T-4862a)
