# T-4452 · No-show: пом'якшення по етапах

- **Stage**: M4 (phase 8) · **Tags**: backend, crm, finance · **Complexity**: middle · **Depends on**: T-160
- **StoryPoints**: 5
- **Статус**: review

## What

Реакція на no-show (T-160) етапами: 1) статус + ручна дія адміна (дзвінок, повторний запис), 2) автоматика: сповіщення клієнту (вибачте/повернемось), пропозиція від нового слота, 3) фінансова політика: депозит списується за правилами (T-4402) з повним журналом. Вікно автоматики і сума — конфігурацією (T-4450 стиль), обов'язковий аудит.

## Why

No-show у перший день — збиток даних; без автоматики оператор вручну звітує по кожному, а депозитні ситуації розбираються довільне.

## Sources

- NSH-* (AC); crm README; financial T-4402 (депозит), T-160

## Done

- [x] Етапи (статус → сповіщення → пропозиція → депозит) працюють за конфігом
- [x] Повний журнал no-show (клієнт, сума, stage, хто виконав)
- [x] Тест: no-show у лімітні дні повторного запису

## Реалізація

- `scheduling/domain/no-show-stage.policy.ts` — чиста політика:
  `openNoShow`, `canAdvance`/`advanceStage` (лише на один етап уперед, без
  відкату), `settleDeposit` (ідемпотентно, сума в межах депозиту, заборона
  до пропозиції), `assessRebook` (лімітні дні, вікно пропозиції, ще не
  сповіщений клієнт, відкритий депозит), `rebookBlockedUntil`,
  `depositSettlementDueAt`, `noShowSummary`.
- `scheduling/application/no-show-staged-response.service.ts` —
  `NoShowStagedResponseService` + порт `NoShowStagedRepository` і in-memory
  реалізація: `register` (ідемпотентна фіксація), `advance`, `requestRebook`
  (відмова/дозвіл пишуться в журнал), `settle`, `settlementDueAt`,
  `dueForAutomation`, `journal`, `summary`.
- Конфіг: `NO_SHOW_STAGED_DEFAULTS` — `rebookWindowDays: 14`,
  `rebookLimitDays: 2`, `depositSettlementHours: 24`,
  `allowManualRebookOnLimitDays: false`; передається в конструктор сервіса.
- `scheduling/application/no-show-staged-response.spec.ts` — 12 тестів.

## Нотатки

- HTTP-маршрути й планувальник не входять у слайс: сервіс викликається з
  наявного контуру no-show (`t-160-noshow-policy.use-case.ts`,
  `t-095-noshow-escalation.use-case.ts`) і повертає готові рішення для
  контролера адмінки.
- Стан кейсів in-memory: у `prisma/schema.prisma` немає таблиці no-show
  кейсів (T-160 досі `in_progress`); Prisma-адаптер підключається без зміни
  use-case.
- Списання депозиту фіксується з сумою й актором у журналі; проведення
  платежу/чека лишається за T-4434/T-4402.

## Risks

- [x] **Списание без відображення**: депозит списується з явною причиною в чеках (T-4434) і журналі
  — журнал кейса фіксує суму, рішення й актора; чек — поза цим слайсом
