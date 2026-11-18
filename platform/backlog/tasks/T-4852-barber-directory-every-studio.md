# T-4852 · The barber directory lists every studio, not the first one

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-023, T-4821
- **StoryPoints**: 8

## What

`getBarbers` calls `getFirstActiveLocation` and then `GET /booking/barbers/{that id}`. `/barbers` is therefore one studio wearing a network title. A barber who works only in Lviv never appears when a Kyiv studio is first.

The directory loads the barbers of every active location and groups them by studio. A person assigned to two studios appears once, with both studios named. Slices: website (T-4852a), app (T-4852b).

## Why

The page the guest opened is the network’s people. Showing one studio’s roster answers a different question.

## Sources

- `apps/web/src/lib/api/staff.ts`
- `GET /booking/barbers/:locationId`
- T-4836 (barbers on a single studio page — the other direction)

## Done

- [ ] T-4852a and T-4852b are done
- [ ] The first active location is not the whole directory

## Risks

- [ ] **The same person twice.** Two assignments collapse to one card. The card names both studios

## Out of scope

- Canonical slugs (T-4413, T-4477a)
- Prices per studio (T-4477a)
