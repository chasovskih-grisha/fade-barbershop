# T-4738a · Specify the service on a phone booking

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4738
- **StoryPoints**: 2

## What

In `docs/admin-screens.md` §6.2, on the «Записати» action, state that the phone form chooses a service for the chosen location before the slot. Duration comes from the service. No service, no visit. The service list is empty until a location is chosen, and it is not the first location's list.

## Why

§6.2 says «Записати» follows the booking flow. The phone form is that path, and it has no service.

## Sources

- T-4738
- `docs/admin-screens.md` §6.2

## Done

- [ ] §6.2 states the service, the duration, and the empty location
- [ ] `pnpm docs:validate` reports no new error from this file

## Risks

- [ ] **A second booking flow.** The paragraph describes the phone form that already exists
