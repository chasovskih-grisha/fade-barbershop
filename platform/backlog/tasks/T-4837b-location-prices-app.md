# T-4837b · Slice: this studio’s prices on the app studio screen

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, mobile · **Complexity**: middle · **Depends on**: T-4837, T-4844
- **StoryPoints**: 5

## What

The app studio screen lists the services and prices for that studio’s id. It does not reuse the home list, which is not scoped to one studio (T-4849).

## Why

The home list and the studio list answer different questions.

## Sources

- T-4837
- T-4844
- `apps/mobile/src/lib/api/catalog.ts`

## Done

- [ ] The request is scoped with this studio’s id
- [ ] Rows show name, duration, and price
- [ ] An empty catalog omits the section

## Risks

- [ ] **Showing the home payload again.** The home services stay where they are. This section fetches for the open studio

## Out of scope

- The website prices (T-4837a)
- Reworking the home service list (T-4849)
