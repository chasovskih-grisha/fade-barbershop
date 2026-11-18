# T-4741 · The website booking flow can start a father-and-son visit

- **Stage**: M1 (phase 3) · **Tags**: frontend, backend, ux · **Complexity**: senior · **Depends on**: T-044, T-041
- **StoryPoints**: 11

## What

`POST /admin/appointment-parties` creates a party, and it requires an admin session. The website booking steps never offer screen 1b. T-044 is done for the domain and left the client flow open. T-041 names the ordinary steps and does not name a party.

On the website, after the service, the client can choose «Батько + син». The default stays a single visit. The party step asks for the mode, the son's name, and the barbers the mode allows: one barber in sequence, two different barbers in parallel. It then uses the slot step for that party's duration. Submit calls the existing party use case with the signed-in client. It does not create a second party model. An admin session is not required for the client's own party.

The open 90-minute versus 95-minute question stays where T-044 left it. This task uses the duration the API already books.

## Why

The domain can hold two chairs for a father and a son. A client on the site cannot ask for that visit.

## Sources

- `docs/booking-flow.md` screen 1b
- `apps/api/src/appointment-party/infrastructure/appointment-party.controller.ts`
- ADR 0011
- T-044

## Done

- [ ] Slices a and b are `done`
- [ ] A normal booking never enters the party step
- [ ] A signed-in client can create a sequential party and a parallel party through the website
- [ ] The son's name is required, and the two parallel barbers are different people

## Risks

- [ ] **Resolving the duration dispute.** Sequential length stays the length T-044 already persists
- [ ] **An admin-only client.** The client route checks the client session and sets the client id from it. It does not reuse the admin controller with a forged role
- [ ] **The app.** The app has no booking-step screens yet. This task does not add them

## Out of scope

- Phone booking (T-4738) stays one service
- The price breakdown (T-090)
- Mobile booking steps
