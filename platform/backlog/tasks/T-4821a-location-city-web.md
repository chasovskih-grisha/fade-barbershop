# T-4821a · Slice: city on the website listing and the studio page

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, seo · **Complexity**: middle · **Depends on**: T-4821
- **StoryPoints**: 5

## What

Read `addressParts.city` on the website `Location` type. Group `/locations` by city. Studios with a null city sit in one trailing group that has no invented label. The hero and the listing `description` stop saying the network is in Kyiv. On `/locations/{code}` the visible city and `addressLocality` are that field, omitted when null.

## Why

The wire already has the city. The pages are the surfaces that still lie.

## Sources

- T-4821
- `apps/web/src/lib/api/locations.ts`
- `apps/web/src/app/locations/page.tsx`
- `apps/web/src/app/locations/[code]/page.tsx`

## Done

- [ ] `Location` keeps `addressParts.city` through the public list and the detail load
- [ ] Two cities render as two groups, in the order the data returns, not alphabetical invention
- [ ] JSON-LD `addressLocality` equals `addressParts.city`, and the key is absent when the city is null
- [ ] The listing `<title>` and description do not claim a city the payload does not contain
- [ ] A test covers Lviv-shaped data and a null city

## Risks

- [ ] **Grouping a one-city network into a noisy heading.** A single city still shows the heading once, above the cards, not once per card

## Out of scope

- The app list (T-4821b)
- Parsing the code `LVI` into a city
