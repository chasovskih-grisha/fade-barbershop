# T-4820 · A location card states only what that studio record knows

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-030, T-022
- **StoryPoints**: 5

## What

The listing at `/locations` (`apps/web/src/app/locations/page.tsx`) stamps the same sentences on every card: «Флагманська студія», «Щодня з 09:00 до 21:00 • Парковка • Wi-Fi». LVI-01 is not a Kyiv flagship, and the hours on the card ignore `location.hours`.

The card shows the studio name, the address, the phone when the record has one, and today's open interval from `hours` (or «Вихідний» when today is closed). It does not invent amenities, a rank, or a clock.

## Why

A guest comparing studios is choosing a place to travel to. A card that is the same sentence for every code is not a listing.

## Sources

- `apps/web/src/app/locations/page.tsx`
- `apps/web/src/lib/api/locations.ts` (`OpeningHour`)
- `docs/design-system.md` (the card is a fact, not a poster)
- T-022 (hours), T-030 (the page already exists)

## Done

- [ ] No card renders «Флагманська студія», a fixed 09:00–21:00, «Парковка», or «Wi-Fi»
- [ ] Today’s row comes from that location’s `hours`; a closed day says «Вихідний»; missing hours omit the row
- [ ] Phone renders only when `phone` is set, as a `tel:` link whose visible text is the stored number
- [ ] A test renders two locations with different hours and asserts the cards differ
- [ ] At 320px and 1280px the card does not scroll sideways

## Risks

- [ ] **Today in the wrong timezone.** “Today” is the studio’s calendar day, not the browser’s, when those differ. Until a zone is stored, use the same day-index the hours component already uses and say so in the test

## Out of scope

- The open/closed badge and its server clock (T-4442). This card prints the stored interval for today
- The book URL (T-4532). The card may keep `/booking`
- Live free slots (T-130)
- City grouping and the Kyiv headline (T-4821)
