# T-4490 · Класифікація даних і політика утримання

- **Stage**: M6 (phase 40) · **Tags**: backend, legal, security · **Complexity**: middle · **Depends on**: T-300, T-3601, T-4496
- **StoryPoints**: 8

## What

Класифікація даних за рівнями (публічні/внутрішні/конфіденційні/персональні), політика утримання (де 90 днів, де 5 років, де назавжди), автоматичне загасання (без «назавжди» для не-обсяг), реалізована на рівні зберігання і життєвого циклу записів. Застосовується до журналів, к.MinT= помилки/лог токена.

## Why

Перс-дані без політики = штраф після перевірки (T-3601); «зберігати все» — ризик і вартість.

## Sources

- security-hardening.md; ADR 0021 (секрети і журнали); T-300 (бекап), T-4496 (цілісність)

## Done

- [ ] Карта класифікації полів/рівнів; TTL застрашків і журналів
- [ ] Авто-видалення за політикою (крон + перевірка після деліту)
- [ ] Аудит: які записи видалені за період

## Risks

- [ ] **Видалення строгості**: судові requirements не пересекаються з TTL — виняток legal hold (конфіг)

## Implementation plan

Paths:
- apps/api/src/shared/retention/retention-policy.ts
- apps/api/src/shared/retention/retention-policy.spec.ts
- apps/api/src/shared/retention/purge-expired-data.spec.ts

Checks:
- `pnpm --filter @fade/api exec jest apps/api/src/shared/retention/retention-policy.spec.ts apps/api/src/shared/retention/purge-expired-data.spec.ts`

## Implementation notes

- apps/api/prisma/migrations/20261217000000_add_retention_purge/migration.sql
- apps/api/prisma/schema.prisma
- apps/api/src/shared/retention/prisma-retention.store.ts
- apps/api/src/shared/retention/purge-expired-data.spec.ts
- apps/api/src/shared/retention/purge-expired-data.ts
- apps/api/src/shared/retention/retention-policy.spec.ts
- apps/api/src/shared/retention/retention-policy.ts
- apps/api/src/shared/retention/retention.module.ts
- apps/api/src/shared/retention/retention.ports.ts
- apps/api/src/shared/retention/retention.worker.ts

## QA

- `pnpm --filter @fade/api exec jest apps/api/src/shared/retention/retention-policy.spec.ts apps/api/src/shared/retention/purge-expired-data.spec.ts` exit 0
