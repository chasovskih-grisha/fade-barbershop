# T-4835 · Directions follow the pin, and the invented route copy goes away

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4831, T-4850
- **StoryPoints**: 10

## What

`LocationDirections` tells every studio it is a 5–7 minute walk from “the central station of the district”, that parking is always free at the door, and that coffee is waiting. A second card, «Парковка та орієнтири», repeats a different invented paragraph. The only real control is an underlined OpenStreetMap link.

Both invented blocks are removed. The directions region is the stored address, the coordinates, and a map of that one pin on the night surface. «Відкрити в картах» remains a text link built from `lat` and `lng`. If the map does not load, the address and the link remain. There is no minute estimate and no amenity the record does not have. Slices: website (T-4835a), app (T-4835b).

## Why

LVI-01’s page currently gives walking directions that were not written for LVI-01.

## Sources

- `apps/web/src/app/locations/[code]/LocationDirections.tsx`
- `apps/web/src/app/locations/[code]/LocationDetail.tsx` (the parking card)
- T-4405 (coordinates)

## Done

- [ ] T-4835a and T-4835b are done
- [ ] The strings about the metro, free parking, and coffee are gone from the studio route

## Risks

- [ ] **A bright map tile on a night page.** The frame uses the night surface while tiles load, so the page does not flash white

## Out of scope

- The multi-studio map (T-4826)
- Transit routing and walking times
- A new amenity field. Until one exists, the page does not mention parking or coffee
