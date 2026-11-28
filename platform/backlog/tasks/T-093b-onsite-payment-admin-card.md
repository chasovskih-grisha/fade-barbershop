# T-093b · └ Слайс: картка оплати на місці в адмінці (2 SP)

- **Stage**: M2 (phase 8) · **Tags**: frontend, billing · **Complexity**: middle · **Depends on**: T-093a
- **StoryPoints**: 2

## What

PAY-ONS-01…05, admin UI half: картка візиту показує серверний залишок без поля редагування, дозволяє позначити готівку/POS, показує статус фіскального чека і кнопку «Повторити чек». Для скасованого візиту або no-show картка не показується.

## Sources

- `PAY-ONS-01…05`; `admin-screens.md` §5.2, §14

## Implementation plan

- `apps/admin/src/app/bookings/[uuid]/OnsitePaymentCard.tsx`
- tests: `apps/admin/src/app/bookings/[uuid]/OnsitePaymentCard.test.tsx`, `apps/admin/src/app/bookings/[uuid]/OnsitePaymentReceipt.test.tsx`

Checks:

- `npx jest --config apps/admin/jest.config.js --runTestsByPath apps/admin/src/app/bookings/[uuid]/OnsitePaymentCard.test.tsx apps/admin/src/app/bookings/[uuid]/OnsitePaymentReceipt.test.tsx --runInBand`

## Done

- [ ] Залишок показано як серверне значення, без редагованого поля
- [ ] Готівка/POS позначають оплату через адмінський API
- [ ] Статус чека видно, невдалий чек можна повторити

## Risks

- [ ] **POS-залежність**: підказка пропонує ручний шлях готівкою

## Implementation notes

- apps/admin/src/app/bookings/[uuid]/OnsitePaymentCard.test.tsx
- apps/admin/src/app/bookings/[uuid]/OnsitePaymentCard.tsx
- apps/admin/src/app/bookings/[uuid]/OnsitePaymentDetails.tsx
- apps/admin/src/app/bookings/[uuid]/OnsitePaymentReceipt.test.tsx
- apps/admin/src/app/bookings/[uuid]/OnsitePaymentTotals.tsx
- apps/admin/src/app/bookings/[uuid]/onsite-payment-types.ts

## QA

- `npx jest --config apps/admin/jest.config.js --runTestsByPath apps/admin/src/app/bookings/[uuid]/OnsitePaymentCard.test.tsx apps/admin/src/app/bookings/[uuid]/OnsitePaymentReceipt.test.tsx --runInBand` exit 0
