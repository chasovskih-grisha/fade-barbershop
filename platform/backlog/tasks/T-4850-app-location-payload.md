# T-4850 · The app reads the public location the website already reads

- **Stage**: M5 (phase 30) · **Tags**: frontend, mobile · **Complexity**: middle · **Depends on**: T-030, T-070
- **StoryPoints**: 5

## What

`apps/mobile/src/lib/api/locations.ts` keeps `id`, `code`, `name`, `address`, and `active`. The public location already includes `addressParts`, `lat`, `lng`, `phone`, `email`, `hours`, `chairs`, `channels`, `photos`, and `logo`.

Extend the mobile type to that payload and add `fetchLocation(code)` against `GET /locations/{code}`. Do not add a field the public DTO does not have. Do not add a screen; T-4844 is the screen.

## Why

Every app layout task above needs hours, photos, and coordinates. The client currently throws them away.

## Sources

- `apps/mobile/src/lib/api/locations.ts`
- `apps/api/src/locations/infrastructure/admin-locations.dto.ts` (`LocationDto`)
- `apps/web/src/lib/api/locations.ts` (the website already maps a subset)

## Done

- [ ] The mobile type includes the public fields listed above
- [ ] `fetchLocation` returns one studio or a not-found result, and a failed response is an error, not an empty studio
- [ ] A test parses a payload with a null `addressParts` and a payload with a city

## Risks

- [ ] **A second mapper.** The mobile type matches the public DTO names. It does not rename `addressParts` to `city` at the boundary; callers read `addressParts.city`

## Out of scope

- A new API field
- The screens that render the fields (T-4844 and the app slices)
