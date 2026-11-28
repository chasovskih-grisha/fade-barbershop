# T-4821 · The listing and the studio page name the studio’s city

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4405, T-030
- **StoryPoints**: 8

## What

The public location already carries `addressParts.city` (`LocationDto` in `admin-locations.dto.ts`, from T-4405). The website type in `apps/web/src/lib/api/locations.ts` drops it. The listing hero and its meta description say the studios are in central Kyiv. The studio page writes `addressLocality: 'Kyiv'` for every code, including LVI-01.

The city on screen and in the structured data is `addressParts.city`. A null city is not replaced with Kyiv. The listing groups studios by that city. Slices: website (T-4821a), app (T-4821b).

## Why

LVI-01 is a Lviv studio. A page that calls it Kyiv sends the guest to the wrong city.

## Sources

- `apps/api/src/locations/infrastructure/admin-locations.dto.ts` (`addressParts`)
- `apps/web/src/app/locations/page.tsx` (hero and `metadata`)
- `apps/web/src/app/locations/[code]/page.tsx` (JSON-LD)
- T-4405 (the city is already stored)

## Done

- [ ] T-4821a and T-4821b are done
- [ ] No guest surface in this catalog prints Kyiv unless that studio’s `addressParts.city` is Kyiv

## Risks

- [ ] **A second city.** `GET /locations/nearest` returns the visitor’s city. That field is not the studio’s city and must not fill `addressLocality`

## Out of scope

- Adding a city column or a geocoder (T-4405 already stored `addressParts`)
- Translating the city name (T-4613)
- The nearest-studio pin (T-4827)
