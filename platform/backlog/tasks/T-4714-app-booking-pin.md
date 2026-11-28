# T-4714 · Pinned booking summary in the client app

- **Stage**: M2 (phase 6) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-071, T-4711a
- **StoryPoints**: 7

## What

The client app keeps the same running trail as the website booking flow: location, service, barber, and time, pinned under the progress bar. Each earlier fact is a way back to that screen. The words and the omission rules come from T-4711a, so the app and the site do not describe one visit two ways.

The app already uses one screen per step and a back gesture. The pin does not replace the gesture. It is how the client sees the trail without stepping all the way back, and how a chosen time stays on screen while the slot list scrolls.

## Why

T-4711 stops at the website. A client who books in the app otherwise has to remember the chair and the service on every later screen.

## Sources

- T-4711a
- `docs/booking-flow.md` (mobile differences)
- `docs/client-screens.md`
- `docs/design-system.md`
- T-071

## Done

- [ ] Slices a and b are `done`
- [ ] On the slot screen the client sees location, service, and barber without scrolling the list
- [ ] A chosen time stays visible while the slots scroll, and disappears when the date changes
- [ ] Back gesture and the pin chips land on the same screen and clear the same later facts

## Risks

- [ ] **The pin fights the thumb zone.** The primary action stays at the bottom. The pin is one compact row under the progress bar, not a second header stacked on the site banner
- [ ] **A different «any barber».** An empty barber id before that screen is not «Будь-який барбер». The app uses the rule in T-4711a
- [ ] **Screens that are not in the tree yet.** The pin attaches to the client booking screens from T-071. It does not invent a missing step

## Out of scope

- The barber side of the app. A barber looking at a chair is not this trail
- The website (T-4711) and the cabinet (T-4712)
- Admin phone booking (T-4713)
- Price, promo, and deposit. Those stay on the confirm screen
