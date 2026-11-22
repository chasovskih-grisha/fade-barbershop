# Сід даних (seeding)

> Як наповнювати dev/test/e2e-середовища платформи демо-даними: скрипти, порядок, конвенції, інваріанти. Джерело вимог — T-2104 (зріз 2026-09-27), пайплайн упорядковано 2026-09-28 разом із `db-seed` у docker-compose.

## Чому окремий документ

Сід — це контракт між середовищами: e2e чекають стабільні id, аналітика — дані в минулому, новий розробник — працюючий каталог одразу після `docker compose up`. Без одного файла ці очікування розповзаються по скриптах. Тут зафіксовано, що сіє кожен скрипт, у якому порядку їх запускати і які інваріанти тримати.

## Конвенції (спільні для всіх сід-скриптів)

- **Один скрипт = одна відповідальність.** Довідники, клієнти, записи, адмін — окремі скрипти; бандли складаються в pnpm-скриптах, а не всередині файлів.
- **Ідемпотентність за природним ключем.** Повторний прогін = update, не дублікати. Ключі: `code` локації, `phone` користувача, `name+duration` послуги, `appointmentId` запису.
- **Без outbox-подій.** Пряме записування dev-даних минає домен і `OutboxMessage` (патерн T-012, конвенція T-2104a) — e2e-ассерти на події не брудняться сідом.
- **Без секретів клієнтів.** Не сіються OTP-коди, email, паролі клієнтів (ADR 0005): ідентичність — тільки телефон; пароль є лише в засновника-адміна.
- **DATABASE_URL, з безпечним дефолтом.** Скрипти читають `DATABASE_URL`; без нього — локальний docker-compose Postgres (`localhost:15432`). У CI — лише через env.
- **Окрема база для e2e.** `pnpm test:functional` ганяє `pretest:functional` → `node scripts/e2e-db.cjs prepare`, який створює `barbershop_e2e` (імʼя перекривається `FADE_E2E_DB_NAME`) і застосовує міграції; `jest.setup.js` перемикає на неї `DATABASE_URL`. Сіди **не** застосовуються до неї — вона порожня, і сюїти створюють власні фікстури. Ручна перевірка: `pnpm --filter api e2e:db:url`. Див. [testing-guidelines.md](testing-guidelines.md) §1.2.
- **Порядок захищений кодом, не чесністю.** `seed-appointments` падає з явною помилкою, якщо довідників (а з `FADE_SEED_REQUIRE_CLIENTS=1` — і клієнтів) немає.

## Інвентар сід-скриптів

Всі — з `apps/api` (`pnpm --filter @fade/api …` з кореня платформи або `pnpm …` всередині `apps/api`):

| Скрипт | Що сіє | Ключ ідемпотентності |
|--------|--------|----------------------|
| `pnpm seed:dev` → `scripts/seed-dev.mjs` | Довідники: локації (KYY-01/02, LVI-01) з координатами, годинами (Пн–Сб 09–20), кріслами (рівно 2/локацію), каналами, фото, **email** (`podil@/obolon@/lviv@fade.dev` — одержувач листа підтвердження T-4608); послуги (Haircut 30 хв / Beard 20 хв / Father+son, parallelDuration) з цінами за локацію; барбери Oleh/Taras з StaffAssignment ×3 локації + AvailabilityWindow Пн–Сб 09–17 | `code` локації, `phone` барбера, `[name,duration]` послуги |
| `pnpm seed:customers` → `src/seed-customers.ts` | 5 демо-клієнтів (role=client) з `DEFAULT_CUSTOMERS` **+ CRM-профіль `ClientProfile` кожному** (аудит T-2104c: без нього адмінський список клієнтів і лояльність порожні); env-конфіг `FADE_SEED_CUSTOMERS_PHONE(+_NAME)` — єдиний клієнт для CI/стейдж | `phone` (E.164 після `PhoneNumber.of`); профіль — `userId` (резерв `phone`) |
| `pnpm seed:appointments` → `scripts/seed-appointments.mjs` | 12 записів `apt_seed_001…012`: усі 6 статусів (booked/confirmed/in_progress/completed/cancelled/no_show) × всі 4 джерела (web/admin/walk_in/mobile); минуле — для аналітики. `apt_seed_004` і `apt_seed_012` (admin) — без clientId (створені адміном «на дзвінку»); walk_in `apt_seed_005` — з clientId (реєстрація на ресепшені) | `appointmentId` |
| `pnpm seed:admin` → `src/seed-admin.ts` | Засновник-адмін (T-013): username + password hash. Env: `FADE_ADMIN_PHONE` (дефолт +380000000001), `FADE_ADMIN_USERNAME` (owner), `FADE_ADMIN_PASSWORD` (dev-дефолт, мінімальна довжина валідується) | `phone` |
| `pnpm seed` | **Повний dev-пайплайн у правильному порядку**: seed:dev → seed:customers → seed:appointments | — |
| `pnpm seed:e2e` | **Reset БД** + усі скрипти в FIXED_IDS-режимі (читабельні id: loc_KYY_01, apt_seed_01…), порядок: довідники → адмін → клієнти → записи | — |

## Пайплайн

```bash
# dev (поверх наявної БД, ідемпотентно):
pnpm seed              # = seed:dev + клієнти + записи (повний пайплайн у правильному порядку)

# окремі скрипти (порядок має значення):
pnpm seed:dev          # 1. локації/послуги/барбери
pnpm seed:customers    # 2. клієнти
pnpm seed:appointments # 3. записи (читає 1+2; без них — помилка конфігурації)
pnpm seed:admin        # незалежний: засновник (можна будь-коли)

# e2e (з нуля, детерміновані id):
pnpm seed:e2e          # reset + FIXED_IDS + адмін + клієнти + записи
```

`seed:appointments` читає довідники з БД і падає з явною помилкою, якщо їх немає — порядок у пайплайні захищений, не на словах. З `FADE_SEED_REQUIRE_CLIENTS=1` (увімкнено в `db-seed` сервісі docker-compose) так само падає, якщо немає клієнтів — web/mobile демо-записи не виходять без `clientId` на свіжій БД.

### Сід у docker-compose (`db-seed`, T-2104)

One-shot сервіс у `infra/docker-compose.yml` (профілі deps/apps, патерн `minio-init`): `prisma migrate deploy` → `seed:dev` → `seed:customers` → `seed:appointments` → `seed:admin`, з `FADE_SEED_REQUIRE_CLIENTS=1`. `api` стартує лише після його успішного завершення (`service_completed_successfully`) — свіже середовище піднімається з даними без ручних кроків. Вихідники скриптів і `package.json` змонтовані з хоста (ADR 0018): правка сіду не вимагає перебудови образу. Повторний `up` = оновлення, не дублікати.

### Прод-старт (`db-init`, T-4614b)

Прод-стек `infra/docker-compose.prod.yml` **не** запускає `db-seed` і не сіє демо-дані. One-shot `db-init` на прод-образі api виконує лише:

```text
prisma migrate deploy → node dist/seed-admin.js
```

`api` стартує після `db-init: service_completed_successfully`. Обліковка засновника задається обовʼязковими `FADE_ADMIN_PHONE`, `FADE_ADMIN_USERNAME`, `FADE_ADMIN_PASSWORD`; без них `seedAdmin` у `NODE_ENV=production` падає, а compose не піднімається. Повторний старт ідемпотентний: міграції не мають pending, адмін оновлюється за телефоном, другий акаунт не створюється. Довідники, клієнти й записи лишаються виключно dev/e2e-сідами.

## Змінні середовища

| Змінна | Де читається | Призначення |
|--------|--------------|-------------|
| `DATABASE_URL` | усі скрипти | Цільова БД; дефолт без env — `localhost:15432` (docker-compose) |
| `FADE_SEED_FIXED_IDS=1` | seed-dev, seed-appointments | Читабельні id для e2e; на непорожній БД з іншими id — fail (idConflict) |
| `FADE_SEED_REQUIRE_CLIENTS=1` | seed-appointments | strict-гвард: записи без клієнтів = помилка (fresh-середовища) |
| `FADE_SEED_CUSTOMERS_PHONE` (+`_NAME`) | seed-customers | Замість 5 демо-клієнтів — один env-заданий (CI/стейдж) |
| `FADE_ADMIN_PHONE` / `_USERNAME` / `_PASSWORD` | seed-admin | Обліковка засновника (dev-дефолти — тільки локально) |

## Інваріанти сіду

- **Час ковзає разом із «зараз»**: минулі записи (для аналітики) завжди 1–3 дні тому, майбутні — 1–3 доби вперед, `in_progress` — зараз. Сід не «протухає».
- **Тривалість = каталозі**: `end - start = service.duration`; `fulfillmentMode` — `parallel` лише для Father+son.
- **Ціна = локації**: `agreedPrice` береться зі `ServicePrice` конкретної локації (450 у Львові проти 500 у Києві) — те, що бачить клієнт.
- **Клієнти в web/mobile/walk_in-записах.** Демо-записи джерел web/mobile/walk_in посилаються на сідових клієнтів (порядок пайплайну + strict-гвард для web/mobile); admin — без `clientId` (адмін не встановлював профіль «на дзвінку»).
- **cancelReason — тільки в cancelled** (інваріант агрегата T-042b).
- **Статус/джерело — сід ставить прямо в БД.** Це dev-дані; у проді канал фіксує контролер (T-046, ANL-004). CRM-профіль кожному демо-клієнту сіє `seed:customers`; **лояльність він не нараховує** — сід минає агрегати (T-012), лічильник змінює домен CRM (автонарахування з завершених записів — поза сідом; для демо виставляється в адмінці).
- **FIXED_IDS тільки для e2e**: `FADE_SEED_FIXED_IDS=1` на непорожній БД з іншими id падає з підказкою зробити reset (idConflict у seed-dev).

## Що сід НЕ робить

- Не сіє OTP-коди, email, паролі клієнтів (ADR 0005); пароль є тільки в засновника-адміна (T-013).
- Не пише в outbox — тести, що чекають події, створюють їх через домен (e2e-фікстури `@fade/test-utils`, T-2104d).
- Не запускається в CI проти прод-БД: скрипти читають `DATABASE_URL`, дефолт — локальний docker-compose (порт 15432).

## Пов'язане

- T-2104a/b/c (слайси сіду), T-2104d (`@fade/test-utils`), T-012 (сід засновника), T-013 (seed-admin)
- `engineering-principles.md` (чому події — тільки через домен), `docs/adr/0005` (ідентичність за телефоном)
- `infra/docker-compose.yml` (`db-seed`) — як свіже середовище отримує дані автоматично
