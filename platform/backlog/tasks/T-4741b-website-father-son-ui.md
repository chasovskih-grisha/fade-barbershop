# T-4741b · Father-and-son step on the website

- **Stage**: M1 (phase 3) · **Tags**: frontend, backend · **Complexity**: senior · **Depends on**: T-4741a
- **StoryPoints**: 8

## What

Add the opt-in step to `apps/web` booking and a client route that calls the existing create-party use case. The route takes the client id from the session. Parallel mode rejects the same barber twice. The son's name is required. Sequential and parallel durations are the ones the use case already writes. Do not open `POST /admin/appointment-parties` to the browser.

## Why

The use case is tested. The website has no step and no client route.

## Sources

- T-4741a
- `apps/web/src/app/booking/page.tsx`
- `apps/api/src/appointment-party/infrastructure/appointment-party.controller.ts`

## Done

- [ ] Skipping the step still creates a single visit
- [ ] A client session can create each mode
- [ ] An admin cookie is not accepted as the client on the new route

## Risks

- [ ] **Copying the use case.** The client route is a new entrance to the same handler
