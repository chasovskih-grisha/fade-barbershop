# T-053at · Empty states book.fade.com.ua

- **Stage**: M1 (phase 4) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-053c
- **StoryPoints**: 3

## What

Empty states for quick-booking:
- No services available
- No barbers available
- No slots available (T-053h waitlist)
- Service search no results
- Offline error state
- Network error state
- Call-to-action buttons in empty states

## Sources

- T-053c (5-step flow)
- T-053h (waitlist)
- ux-guidelines (empty states)
- design-system.md (empty state components)

## Done

- [x] No services empty state works
- [x] No barbers empty state works
- [x] No slots empty state works
- [x] Offline state works
- [x] Network error state works
- [x] CTAs work

## Out of flow (removed from checklist 2026-11-10)

- **Service search no results** — in flow none service search at all (`grep -rni search src/app/booking` → 0 matches), so the state does not exist: item describes a screen that is neither in T-041 nor in code. Adding search to a catalog of 1–3 items is a new screen, not an empty state.

## Verification (2026-11-10, status remains `review`)

Checked via code, tests, and live run in Chromium: `booking-flow.empty.test.tsx` — 3 empty states + 3 CTA cases (click actually returns to previous step), `OfflineBanner.test.tsx` — offline banner; entire flow suite (25 tests) and `apps/web` package (48/180) are green.

**Maintained**
- Empty states for services, barbers, and slots: `steps/{ServiceStep,BarberStep,SlotStep}.tsx`; slots have hint "Try another date or another barber". Barbers: condition `<= 1`, because "Any barber" is a list item, not a real barber.
- **CTAs in empty states (fixed 2026-11-10)**: services → "Choose another location", barbers → "Back to services", slots → "Choose another barber". In browser verified that CTA is not only visible but also leads to the required step (services → "Step 1 of 7", slots → "Step 3 of 7").
- Offline: `components/states/OfflineBanner.tsx` connected in `PublicShell`, meaning it covers `/booking` as well.
- Network error on locations step: text + "Try again" button (`LocationStep.tsx` → `refresh`).

**Not met**
- **Network error as full state** — only locations step has retry; for services/barbers/slots error settles in `flow.error` at page level (`page.tsx`, `role="alert"`) without retry button, meaning exiting error without reload is only possible via "Back".

**Conclusion:** 5 of 6 points maintained after CTA; search removed as out of flow (see above). Closing — after request retry on every data step (currently only in locations).

## Risks

- [ ] **User confusion**: poor empty states can confuse users
