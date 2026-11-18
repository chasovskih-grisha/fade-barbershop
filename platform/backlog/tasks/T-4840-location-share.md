# T-4840 · Share this studio

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4831, T-4844
- **StoryPoints**: 6

## What

There is no way to send LVI-01 to someone else except copying the address bar. The studio page and the app studio screen get one share control. It shares the canonical `/locations/{code}` URL and the studio name. It does not share a booking link (T-4532) and it does not attach a photo file. Slices: website (T-4840a), app (T-4840b).

## Why

Choosing a studio is often a message to another person. The page makes them retype the address.

## Sources

- `apps/web/src/app/locations/[code]/LocationDetail.tsx`
- T-4541 (booking deep links are a different URL)

## Done

- [ ] T-4840a and T-4840b are done
- [ ] The shared URL is `/locations/{code}`, not `/booking`

## Risks

- [ ] **A share sheet that fails.** The website falls back to copying the URL and says that it was copied

## Out of scope

- Booking deep links and the embeddable widget (T-4541)
- OG image bytes (T-4841)
