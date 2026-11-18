# T-4442 · Public "open/closed" status

- **Stage**: M2 (phase 5) · **Tags**: backend, frontend · **Complexity**: junior · **Depends on**: T-030, T-022
- **StoryPoints**: 3

## What

Displaying "open/closed now" on public surfaces (web header, location card, date picker) based on schedule (T-023) and exceptions (T-4414): server-side calculation with location local time, update without full reload; "undefined" in case of missing data.

## Why

Client chooses a location: status "closed at 18:00" prevents attempting to book on a closed day (fewer errors per T-040).

## Sources

- web-screens.md; T-030 (public location data), T-022 (working hours), T-4414 (exceptions)

## Done

- [ ] Server-side status calculation from schedule + exceptions (UTC → local time)
- [ ] Render in header and card; auto-update on day transition
- [ ] Test "exception today → closed"

## Risks

- [ ] **Timezone**: client is not in location's local zone — status is built using location's zone, not client's
