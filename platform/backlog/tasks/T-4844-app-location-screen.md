# T-4844 · The app has a studio screen

- **Stage**: M5 (phase 30) · **Tags**: mobile, ux · **Complexity**: middle · **Depends on**: T-070, T-4850, T-071
- **StoryPoints**: 5

## What

The app has no location route. Home, login, profile, visits, and devices are the screens.

Add `apps/mobile/src/app/(client)/locations/[code]/page.tsx`. It loads that code through T-4850. The shell shows a back control to the home list, the studio name, the city when present, and the address. Regions for hours, contacts, gallery, map, barbers, and prices are owned by their slices and render into this screen. One «Записатися» control hands the location code to the booking flow T-071 already owns. This task does not build booking steps.

## Why

Every other location task on the app needs a screen to land on. Today the only surface is a text row.

## Sources

- `apps/mobile/src/app/index-home.tsx`
- T-071 (mobile booking, done)
- T-4850

## Done

- [ ] The route renders the name and address for a known code
- [ ] Back returns to the home list
- [ ] An unknown code says the studio was not found and offers the list
- [ ] «Записатися» passes the code into the existing booking flow and does not render steps 0–5 on this screen
- [ ] A test covers a known code, an unknown code, and the back control

## Risks

- [ ] **A second booking flow.** If the existing flow cannot accept a code yet, the control is present and the handoff is a single documented call. The steps stay in T-071

## Out of scope

- Booking steps (T-071)
- The section designs (T-4832b, T-4833b, T-4834b, T-4835b, T-4836b, T-4837b)
- The inactive copy (T-4839b)
