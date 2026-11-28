# T-4520 · Композитний слот: кілька послуг в один запис

- **Stage**: M1 (phase 4) · **Tags**: backend, catalog, high-risk · **Complexity**: senior · **Depends on**: T-040, T-042, T-090 (снепшот ціни), T-041
- **StoryPoints**: 8

## What

Дозволити клієнту обрати **кілька послуг в один запис** (наприклад, стрижка + гоління бороди), а не лише один SKU. Слот будується за **сумарною тривалістю** послуг; `FinalPrice` = сума цін об'єктів слоту; `AgreedPrice` снепшотить кожну позицію окремо. Каталог не змінює модель SKU — композиція динамічна у флоу (фіксовані комбо лишаються як окремі послуги). Обмеження v1: без «різних барберів в один запис», без композиції батько+син.

## Why

Флоу запису (booking-flow крок 1) дозволяє лише одну послугу на візит; «комбо» в каталозі — заздалегідь заведений SKU, який барберщик не може зібрати з довільних двох послуг на льоту. Це найчастіший реальний запит («голова+борода»), який зараз змушує робити два записи поспіль. Композиція — гнучкість каталогу і менше ручної роботи адміна з комбо-SKU.

## Sources

- `docs/booking-flow.md` §Екран 1 (одна послуга на запис, бейдж комбо)
- `apps/api/src/scheduling/README.md` (слот, тривалість, інваріант крісел)
- `apps/api/src/catalog/README.md` (Service: `duration`, `price`, комбо)
- `apps/api/src/billing` README (`AgreedPrice`, `FinalPrice` — T-090)
- `docs/admin-screens.md` §15 (комбо в каталозі)

## Done

- [ ] `ComposedSlot`/позиції у записі: N послуг, сумарна тривалість, сумарна ціна
- [ ] Слот висновується за найдовшою/сумарною тривалістю; інваріант крісел не ламається
- [ ] `AgreedPrice` снепшотить кожну позицію; депозит від суми
- [ ] Booking-flow: багатовибір послуг; Slice-картка compose в адмінці
- [ ] Tests (домен + use case); `pnpm docs:validate` зелений

## Risks

- [ ] Сумарна тривалість перетинає границі слотів робочого дня — правило обрізання
- [ ] Барбер не може виконати одну з обраних послуг (залежить від T-4521) — потрібен фільтр

## Розбивка (слайси, 8 SP)

1. **T-4520a · Складений запис: домен і ціна** *(middle, 3 SP)* — позиції запису, сумарна тривалість/ціна, снепшот `AgreedPrice`.
2. **T-4520b · Доступність і слоти композиції** *(senior, 3 SP)* — слот за сумарною тривалістю, обрізання по робочому дню, інваріант крісел.
3. **T-4520c · Флоу багатовибору і адмін-картка** *(junior, 2 SP)* — вибір послуг у флоу, compose-Slice в адмінці.

## Blocking evidence

Composed slots change the booking domain (`ComposedSlot`, per-position `AgreedPrice`), the public booking contract in `@fade/contracts`, the admin slice card and the multi-select in the booking flow. One row cannot close it under the gate: `reviewTask` accepts only files its single craft tag owns, while this work spans `apps/api` and `apps/web`, and a backend-only diff would leave four of the five `Done` boxes unproven.
