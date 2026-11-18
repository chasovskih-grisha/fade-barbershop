# T-053as · Loading states book.fade.com.ua

- **Stage**: M1 (phase 4) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-053c
- **StoryPoints**: 3

## What

Loading states for quick-booking:
- Skeleton loaders for service list
- Skeleton loaders for barber list
- Skeleton loaders for time slots
- Button loading states
- Page-level loading indicators
- Optimistic UI updates
- Transition animations

## Sources

- T-053c (5-step flow)
- ux-guidelines (loading states)
- design-system.md (skeleton components)

## Done

- [x] Service skeleton works
- [x] Barber skeleton works
- [x] Slots skeleton works
- [x] Button loading works
- [ ] Page indicator works
- [ ] Optimistic UI works
- [ ] Transitions smooth

## Verification (2026-11-10, status remains `review`)

Checked via code, tests, and live run in Chromium. `booking-flow.loading.test.tsx` — 3 cases (Service/Barber/Slot), `comment-step.test.tsx` — submit spinner; entire flow suite (25 tests) and `apps/web` package (48 suites / 180 tests) are green.

**Maintained**
- Service/barber/slot skeletons: `steps/{ServiceStep,BarberStep,SlotStep}.tsx` — `Skeleton` from `@fade/ui` under `aria-busy="true"`; locations step also has a skeleton (`LocationStep.tsx`).
- Loading state arrives as a single flag from `useBookingData` (catalog and slots), so skeleton does not flicker between steps.
- **Button loading (fixed 2026-11-10)**: `CommentStep.tsx` passes `loading={submitting}` — `Button` from `@fade/ui` renders `animate-spin` ring and sets `aria-busy="true"` + `disabled`. In browser on artificial POST delay: `aria-busy=true disabled=true`, button spinner is in place.

**Not met**
- **Page-level indicator**: none — neither on `/booking` nor in shell; `StepIndicator` is step progress, not loading.
- **Optimistic UI**: none — every choice (service/barber/slot) completes after server response (next step waits for data). Consciously omitted: step warns about error rather than showing nonexistent state.
- **Transitions**: only `transition-colors` on primitives (`Button`/`Card`/`SlotPicker`); transitions between steps (slide/fade) none.

**Conclusion:** 4 out of 7 points are met (skeleton × 3 and button). Closing — after decision on page indicator, optimistic UI, and transitions between steps; these are separate UX tasks, not a consequence of the spinner.

## Risks

- [ ] **Perceived performance**: poor loading states can slow down UX
