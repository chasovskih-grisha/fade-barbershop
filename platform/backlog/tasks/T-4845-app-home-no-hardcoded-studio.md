# T-4845 · The app home stops claiming one street and one price

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, mobile · **Complexity**: middle · **Depends on**: T-070, T-4843
- **StoryPoints**: 5

## What

`IndexHome` always says «Чоловіча перукарня на Теплій, 5» and «перша стрижка 600 ₴», whatever the location payload contains.

The hero names the network and offers the list below as the way to pick a studio. It does not name a street and it does not name a price. The studios in the payload supply the addresses.

## Why

A home screen that advertises one street is a single-shop site wearing a network’s data.

## Sources

- `apps/mobile/src/app/index-home.tsx`
- T-4614e (the website hero’s empty-catalog case — a different app)

## Done

- [x] The strings «Теплій, 5» and «600 ₴» are gone from the home screen
- [x] With two locations loaded, the hero does not name either address
- [x] With an empty location list, the hero does not invent a studio
- [x] A test covers both payloads

## Risks

- [ ] **An empty hero.** The network name and the list heading remain. This task removes the false specifics, not the title

## Out of scope

- The website listing hero (T-4821a and T-4824)
- Prices on the studio screen (T-4837b)
- The home service rows (T-4849)
