# T-4827 · The listing can pin the nearest studio without hiding the others

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4821, T-4826
- **StoryPoints**: 5

## What

`useNearestLocations` asks for geolocation on mount and is not used by the listing. The listing is the server render of `getLocations()`.

The listing loads the full directory first. A control «Найближча» asks for a position once. Permission granted: the matching studio is pinned at the top of the list and on the map, and the other studios stay. Permission denied, dismissed, or an error: the city order from T-4821 stays, and the page says that the order is unchanged. The control does not fire on first paint.

## Why

A directory that jumps to “nearest” before the guest has asked is a different page from the one they opened. A directory that cannot answer “which is closest” makes them leave for a maps app.

## Sources

- `apps/web/src/app/hooks/useNearestLocations.ts`
- `apps/web/src/app/hooks/useGeolocation.ts`
- `GET /locations/nearest`

## Done

- [ ] First paint does not call the geolocation prompt
- [ ] After a successful fix, one studio is marked nearest and the others remain
- [ ] Denial and error keep the city order and do not show an empty list
- [ ] The visitor city on the nearest response is not written onto a studio
- [ ] A test covers granted, denied, and the untouched first render

## Risks

- [ ] **Two lists.** The pinned studio is the same card moved, not a second card with different facts

## Out of scope

- Offline geo degradation (T-4491) and the offline cache (T-4429)
- Auto-selecting a location inside booking (T-4532 forbids silent substitution)
