# T-301 · Автоматизація GWT-сценаріїв флоу запису

- **Stage**: горизонтальна (старт з M1) · **Tags**: integration, backend · **Complexity**: middle · **Depends on**: T-041 (перший прохід вручну)
- **StoryPoints**: 5

## What

Автоматизувати 8 сценаріїв `booking-flow-tests.md` (e2e: web-флоу + гілки — party, AI inline, промокод з капом, waitlist, помилки оплати) + регрес ключових AC-гейтів (PAY, LYL, DSC). Mobile-гілки — на тих самих сценаріях (окремий розділ booking-flow.md).

## Sources

- `booking-flow-tests.md` (сценарії і правило приймання); traceability (гейти)
- `docs/engineering-principles.md` (піраміда тестів, ковередж-гейти CI, правила якості тестів)

## Done

- [ ] Сценарії в CI; червоний білд при порушенні AC
- [ ] Піраміда дотримана за `engineering-principles.md`: e2e ≤ 10%, ковередж не нижче гейтів (api ≥ 85% рядків), фейкові ACL-порти замість моків

## Risks

- [ ] **E2E крихкість**: селектори за data-testid, не по стилях


## Blocking evidence

Every scenario needs a live Postgres: `apps/api/package.json` runs the e2e lane through `seed:e2e` (`prisma migrate reset --force` + `scripts/seed-dev.ts` + `seed-appointments.ts`) and `test:functional`. This workspace has no database service and the project gate runs the API suite with `/e2e/` excluded, so the eight `booking-flow-tests.md` scenarios cannot be executed or asserted here.

### Re-verified at 78dab8f8 (2026-11-26)

The suite belongs in `apps/api/src/e2e`, which needs a live Postgres (`npm run seed:e2e`, e2e excluded
from the DB-less unit run the gate uses); no `DatabaseMeta` model exists in
`apps/api/prisma/schema.prisma`, and no e2e harness for booking flow is in the repository. Unblock: a
database in CI and the `qa` seat's harness.
