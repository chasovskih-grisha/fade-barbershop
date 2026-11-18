# T-4867 · The app has a barber screen

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, mobile, design · **Complexity**: middle · **Depends on**: T-070, T-4869, T-071
- **StoryPoints**: 5

## What

The app has no barber route.

Add `apps/mobile/src/app/(client)/barbers/[slug]/page.tsx`. It loads that person through T-4869. The shell shows a back control to the directory, the name, and the portrait or initials. Studios, share, and the inactive state are their own slices. One «Записатися» control hands the barber id to the booking flow T-071 already owns. This screen does not render booking steps, and it does not implement the deep-link rules T-4477b owns on the website.

## Why

Every other app barber task needs a screen. Today the only mention of a barber is a name on a visit.

## Sources

- `apps/mobile/src/app/(client)/account/appointments/list-item.tsx`
- T-071
- T-4869

## Done

- [ ] A known person renders the name
- [ ] Back returns to the directory
- [ ] An unknown slug says the person was not found and offers the directory
- [ ] «Записатися» passes the id into the existing booking flow and does not render steps 0–5
- [ ] A test covers a known person, an unknown slug, and back

## Risks

- [ ] **A second booking flow.** If the existing flow cannot accept an id yet, the control is present and the handoff is one call. The steps stay in T-071

## Out of scope

- Website deep link behavior (T-4477b)
- Prices, gallery, and reviews (T-4477a, T-191, T-240)
