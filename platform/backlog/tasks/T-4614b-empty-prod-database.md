# T-4614b · Stage і prod без демо-сіду

- **Stage**: горизонтальна · **Tags**: devops, backend · **Complexity**: middle · **Depends on**: T-4614, T-4614a, T-2104
- **StoryPoints**: 5

## Блокер

Порожня прод-база цим шляхом не виходить. Після міграцій у ній з’являться локації і барбери, яких ще none.

`infra/docker-compose.yml`, сервіс `db-seed`, одна команда:

`prisma migrate deploy` → `seed:dev` → `seed:customers` → `seed:appointments` → `seed:admin`

`api` стартує лише після `db-seed: service_completed_successfully`. `seed:dev` пише довідники локацій і барберів (`apps/api/scripts/seed-dev.mjs`). `docs/seeding.md` описує цей ланцюг як старт свіжого середовища.

## What

Stage і prod: лише `prisma migrate deploy` і обліковий запис засновника. `seed:dev`, `seed:customers`, `seed:appointments` лишаються командами dev/e2e і в прод-старт не входять.

## Done

- [x] Прод-старт api на порожній базі закінчується схемою і одним адміном. Локацій, барберів, клієнтів і записів нуль
- [x] Повторний старт не створює другий адмін-акаунт і не досіює довідники
- [x] `docker compose` для dev як і раніше піднімає повний сід (ADR 0018, T-2104)
- [x] Перевірено на чистій базі, не на базі, де сід уже відпрацював

## Risks

- [x] **Адмін без сіду**: `seed:admin` зараз стоїть у тому ж ланцюгу, що й демо-дані. Винести його окремо, не викинувши разом із довідниками

## Implementation

- `infra/docker-compose.prod.yml` — one-shot `db-init` на прод-образі api: `apps/api/scripts/prod-init.sh` = `prisma migrate deploy` → `node dist/seed-admin.js`.
- `api` чекає `db-init: service_completed_successfully`; демо-сіди в прод-стеку відсутні.
- `seedAdmin` у `NODE_ENV=production` вимагає `FADE_ADMIN_PHONE` / `FADE_ADMIN_USERNAME` / `FADE_ADMIN_PASSWORD` (dev-дефолти не спрацьовують).
- `pnpm images:check` падає, якщо прод-compose втратить `db-init`, додасть `seed:dev`/`seed:customers`/`seed:appointments` або api перестане чекати init.
