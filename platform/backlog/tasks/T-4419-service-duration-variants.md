# T-4419 · Гнучка тривалість послуг (short/long)

- **Stage**: M1 (phase 4) · **Tags**: backend, catalog · **Complexity**: middle · **Depends on**: T-040, T-024
- **StoryPoints**: 5

## What

`DurationVariant` у послуги: варіанти тривалості (коротший/стандартний/довший) з окремою ціною і описом; вибір варіанта у флоу запису (крок 2), слот розраховується від тривалості варіанта, снепшот ціни зберігається з вибраним варіантом (T-044 ціновий аудит не ламається).

## Why

«Стрижка» 30-45 хв і «Стрижка + борода» — різні слоти; зараз тривалість послуги одна, а база вимагає список. Без варіантів адмін заводить декілька послуг «Стрижка 30/45/60», завивається каталог.

## Sources

- scheduling README; catalog README; booking-flow.md; T-044 (снепшот ціни)

## Done

- [ ] Варіант тривалості в моделі; валідація не перекладає п'ятислот
- [ ] Флоу запису пропонує варіант; снепшот зберігає обраний
- [ ] Зворотна сумісність: послуга без варіантів = стандарт (Т-041 не регрес)

## Risks

- [ ] **Дві ціни**: варіант vs знижки (T-030) — порядок застосування в ДТ тестом каталогу
## Implementation plan

Paths:
- apps/api/src/catalog/

Checks:
- pnpm --filter @fade/api exec jest apps/api/src/catalog

## Implementation notes

- apps/api/src/catalog/domain/duration-variant.spec.ts
- apps/api/src/catalog/domain/duration-variant.ts
- apps/api/src/catalog/domain/service.spec.ts
- apps/api/src/catalog/domain/service.ts

## QA

- `pnpm --filter @fade/api exec jest apps/api/src/catalog` exit 0


