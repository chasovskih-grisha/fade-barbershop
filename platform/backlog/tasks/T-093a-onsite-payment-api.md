# T-093a · └ Слайс: оплата на місці — API і чек (3 SP)

- **Stage**: M2 (phase 8) · **Tags**: backend, billing · **Complexity**: middle · **Depends on**: T-045
- **StoryPoints**: 3

## What

PAY-ONS-01…05, backend half: адмінський API рахує незмінний залишок `FinalPrice` − зафіксований депозит, приймає готівку/POS, повертає статус чека і повторює той самий фіскальний чек. Актор береться з адмін-сесії, а не з тіла запиту; повторне позначення не створює другого платежу.

## Sources

- `PAY-ONS-01…05`; `PAY-ADM-01…08`; `admin-screens.md` §5.2, §14

## Implementation plan

- `apps/api/src/payment/application/onsite-payment.use-case.ts`
- `apps/api/src/payment/infrastructure/admin-payments.controller.ts`
- `apps/api/src/payment/payment.module.ts`
- `apps/api/src/payment/application/deposit-flow.use-case.ts`
- `apps/api/src/payment/infrastructure/payment-gateways.ts`
- tests: `apps/api/src/payment/application/onsite-payment.spec.ts`, `apps/api/src/payment/payment.module.spec.ts`

Checks:

- `npx jest apps/api/src/payment/application/onsite-payment.spec.ts apps/api/src/payment/payment.module.spec.ts --config apps/api/jest.config.js --runInBand`

## Done

- [ ] Залишок і статус чека читаються без редагованої суми
- [ ] Повторна оплата ідемпотентна, чек повторюється з тим самим `check_id`
- [ ] Актор оплати — адмін із сесії

## Risks

- [ ] **POS-залежність**: збій POS не блокує позначку готівкою
- [ ] **Чек vs депозит**: повтор чека не фіскалізує депозит удруге

## Implementation notes

- apps/api/src/payment/application/onsite-payment.spec.ts
- apps/api/src/payment/application/onsite-payment.use-case.ts
- apps/api/src/payment/infrastructure/admin-payments.controller.ts
- apps/api/src/payment/infrastructure/payment-gateways.ts
- apps/api/src/payment/payment.module.spec.ts

## QA

- `npx jest apps/api/src/payment/application/onsite-payment.spec.ts apps/api/src/payment/payment.module.spec.ts --config apps/api/jest.config.js --runInBand` exit 0
