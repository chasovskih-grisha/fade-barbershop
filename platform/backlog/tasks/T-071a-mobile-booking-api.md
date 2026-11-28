# T-071a · Mobile booking calls the booking API and shows deposit states

- **Stage**: M2 (phase 6) · **Tags**: mobile, payments, billing ·  **Complexity**: middle  ·  **Depends on**: T-071, T-4619a, T-4619b-deposit-hold-ui

## What
The client app currently has the booking screens but not the booking. It builds four pseudo-slots from `Date.now()`, never asks the API for availability, and the confirm button only moves local state to “done”. This slice wires the existing screens to the same public flow the website uses.
- The slot step loads availability from `POST /booking/slots` for the selected location, service, barber and date. It does not invent slots locally.
- The confirm step calls `POST /booking/bookings`; the server resolves duration and creates the visit. The app does not send a client-computed duration.
- If the created visit has a deposit, the app shows the deposit step before “done”. It calls `POST /payment/bookings/:bookingId/deposit` and renders the server outcomes: `captured`, `already_paid`, `failed`, `expired`, and the network-unknown state.
- The countdown comes from the server’s `deposit.expiresAt`, not a local 15-minute timer. Expiry says the chair was released and no money was taken; it offers a way back into booking.
- A failed retry stays on the same visit while the server hold is alive. A new attempt after expiry starts a new booking, not a resurrection of the old one.
- Without a deposit, a created visit goes straight to the confirmation screen.
## Why
A booking flow that never creates a visit is a demo, not a booking channel. The app must not show “Запис створено” for a visit that exists only in component state, and it must not tell the client that money moved when no capture happened.
## Sources
- T-071
- T-4619b (web deposit hold UI and outcomes)
- `docs/booking-flow.md` (screens 3–5, mobile differences)
- `docs/booking-flow-tests.md` (slots, confirm and payment branches)
- `docs/acceptance-criteria/01-billing-payments.md` (PAY-MOB-01, PAY-WEB-02, PAY-WEB-03, PAY-WEB-05, PAY-WEB-06)
## Done
- [x] `apps/mobile/src/app/(client)/booking` calls `/booking/slots`, `/booking/bookings` and `/payment/bookings/:id/deposit` through `apiBase()`
- [x] `buildSlots()` and the local pseudo-slot path are removed; an empty API response shows the empty state, not fake times
- [x] A created visit with a deposit shows the server `expiresAt` countdown and the captured/already-paid/failed/expired/unknown outcomes
- [x] Expiry and failure copy matches the web states: the chair is released or the payment failed, and neither claims a charge that did not happen
- [x] Tests mock the three endpoints and cover success without deposit, success with deposit, expiry, failed retry and a network-unknown capture
- [x] The mobile flow no longer advances to “done” without a successful `POST /booking/bookings`
## Completed 2026-11-24
The booking screen is now composed from `use-booking-data`, `use-booking-slots`,
`use-booking-checkout` and `use-deposit-payment`. Slots come from
`POST /booking/slots`; confirm creates the visit through `POST /booking/bookings`;
the deposit countdown and outcomes come from the server. `booking-model.ts`,
`buildSlots()` and the unused demo `*Step.tsx` files are deleted. The `@fade/contracts`
shape is shared with web, and `@fade/domain-shared` supplies the idempotency key.
Tests cover the slots request, deposit-hold mapping, no-deposit success, captured,
already-paid, failed, expired and unresolved reconciliation. Focused booking tests
(16), mobile typecheck and mobile lint pass; the full mobile suite has one unrelated
pre-existing `account/profile/visit-count-line.test.tsx` failure from `expo-router`.
## Risks
- [x] **Local slot drift.** Selecting a service/barber or changing the date refetches availability; stale slots are cleared on failure
- [x] **Double submit.** Confirm and pay are disabled while their requests are in flight; the server owns idempotency
- [x] **Payment ambiguity.** A network failure on capture is reconciled through the read-only deposit route and remains `unknown` until the server says paid
## Implementation plan
- `apps/mobile/src/lib/api/booking.ts` — add typed `listSlots`, `createBooking` and `payDeposit`, reusing the web payloads and `apiBase()`.
- `apps/mobile/src/app/(client)/booking/use-booking-data.ts` — fetch slots for the selected date/service/barber and expose loading/empty/error states.
- `apps/mobile/src/app/(client)/booking/page.tsx`, `use-booking-slots.ts` — feed the rendered list from API results; keep the selected slot as the server slot.
- `apps/mobile/src/app/(client)/booking/BookingSlotStep.tsx`, `BookingConfirmStep.tsx`, `BookingPaymentStep.tsx`, `BookingDoneStep.tsx` — loading/empty, submitting, deposit and outcome states; no “created” screen before the API responds.
- The deposit view is a booking outcome step (`BookingPaymentStep.tsx`), not a second payment flow with different rules.
- Mobile tests next to the booking screen — endpoint calls and the outcome matrix.
Checks:
- `pnpm --filter @fade/mobile test -- booking`
- `pnpm --filter @fade/mobile typecheck`
- `pnpm --filter @fade/mobile lint`
## QA (2026-11-25)
- **Fake-slot path** — no code reference to `buildSlots`, `booking-model`, `SlotsStep`, `ServicesStep`, `BarbersStep`, `LocationStep` or `BookingStepView` remains under `apps/mobile/src`; the only `*Step.tsx` files are the live `Booking*Step.tsx` components wired through `BookingSelectionSteps`/`BookingOutcomeSteps`. Commit `9ff2d511` is the removal.
- **API check** — `pnpm --filter @fade/mobile exec jest --testPathPattern 'src/(app/\(client\)/booking|lib/api/booking)' --no-coverage --runInBand` → 4 suites, 16/16 tests pass, including “loads availability from the public slots endpoint”, “creates a booking through the real API contract”, the slot-load failure and the 409 slot refresh; the empty list branch in `BookingSlotStep.tsx` (“На цю дату вільного часу немає”) is rendered, not directly asserted.
- **Deposit check** — same run: captured, no-deposit success, already paid, declined, expired hold and network-unknown reconciliation through the status route all covered; a pending hold stays unpaid.
- **Device check** — NOT RUN on 2026-11-25: no iOS/Android device or simulator is attached to this environment, so tap-selection, back gesture and the native flow are still unverified on hardware and stay in T-071.
- **Lint** — `eslint` over `apps/mobile/src/app/(client)/booking/**` and the booking API client exits 0.
- **Typecheck** — `pnpm --filter @fade/mobile typecheck` still fails, but only on the in-progress T-070 push files (`push-tokens.ts`, `push-revoke.ts`, `push-setup.ts`, `use-push-registration.ts`); no booking file reports an error.
## Out of scope
- Camera/AI reference upload — T-071 and AI-MOB-02
- Deep link back from the acquiring page — PAY-MOB-03
- Deposit push/refund statuses — PAY-MOB-04/05
- Waitlist and promo/discount UI — their own tasks

## Blocking evidence

The slice is already implemented in the tree (`## Completed 2026-11-24`, all `Done` boxes checked): `apps/mobile/src/app/(client)/booking/{use-booking-data,use-booking-slots,use-booking-checkout,use-deposit-payment}.ts` and the nine focused booking tests. The index row is still `todo` because `reviewTask` (`scripts/agent-gate.mjs`) needs added non-comment lines in an owned product file since `origin/stage`: the work landed under T-071 before the gate existed, so there is no diff left to review. Re-opening it would need an invented change, so the row stays un-claimed.
