# T-4712 · Pinned visit on the website cabinet

- **Stage**: M1 (phase 4) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-032, T-4533
- **StoryPoints**: 7

## What

While a client changes an existing visit on the website, the visit itself stays pinned: location, service, barber, and the time that is already booked. Rescheduling adds a second time, labeled as the new one. This is not another booking-flow pin. T-4711 covers choosing a visit. This epic covers changing one the client already has.

The reschedule form and the reference editor both open over the visit. Today the service and barber are a sentence above the inputs. Scroll, or a long photo step, and it is no longer obvious which visit is being changed.

## Why

Moving the wrong visit, or uploading a reference onto the wrong one, is worse than a slow form. The pin is the identity of the visit. The form underneath is only the change.

## Sources

- `docs/client-screens.md` §4 (visit card, reschedule, reference edit)
- `docs/design-system.md`
- `apps/web/src/app/account/appointments/RescheduleForm.tsx`
- T-4711 (same pin language; different job)

## Done

- [ ] Slices a and b are `done`
- [ ] On reschedule, the booked visit stays visible above the new date and time
- [ ] The new time is labeled as new, and is absent until the client has entered a time that fits the visit
- [ ] The reference editor shows the same visit pin and does not invent a new time

## Risks

- [ ] **Two times, one label.** «Зараз» and «Новий час» must not share a wording. A client who confirms the old time by mistake has not rescheduled
- [ ] **A second receipt.** Price, promo, and deposit math stay where they already are. The pin may say «Депозит переноситься» when the visit is waiting on a deposit. It does not repeat `FinalPrice`

## Out of scope

- The booking flow (T-4711)
- The mobile app (T-4714)
- Admin phone booking (T-4713)
- Cancel and pay actions. They keep their own confirms
