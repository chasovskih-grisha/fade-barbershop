# T-4862a · Slice: share the barber on the website

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4862
- **StoryPoints**: 3

## What

A control on the profile copies the page URL, and uses the share sheet when the browser has one. After a copy, the control says the link was copied.

## Why

Desktop often has no share sheet. Copy is the reliable path.

## Sources

- T-4862
- `apps/web/src/app/barbers/[slug]/BarberDetailContent.tsx`

## Done

- [ ] The copied text is the absolute profile URL
- [ ] The confirmation is text
- [ ] A denied clipboard does not show success

## Risks

- [ ] **Two book controls.** Share sits with the actions and is not styled as the primary book button

## Out of scope

- The app sheet (T-4862b)
