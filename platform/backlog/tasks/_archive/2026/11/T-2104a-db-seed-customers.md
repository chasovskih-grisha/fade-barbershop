# T-2104a · Сід клієнтів (4/12) — done 2026-09-27

- **Stage**: M0 (phase 0) · **Tags**: backend, devops, testing · **Complexity**: junior · **Depends on**: T-012
- **StoryPoints**: 4 · **Статус**: done

## What
Create сід-файл для клієнтів: тестові акаунти з різними ролями (клієнт, адмін, барбер), телефон (E.164 `+380…`) — без сідованих OTP-кодів і email (ідентичність за ADR 0005 — тільки телефон; коди генеруються на льоту за T-010). Використовувати `prisma` seeders.

## Why
Тестування автентифікації, лояльності, бронювання потребує реальних клієнтів. Сід забезпечує різноманітні сценарії.

## Sources
- `src/seed-customers.ts` (фантом 2026-09-27: `prisma/seeders/customers.ts` не існував; прийнято конвенцію репо — сід-скрипти в `src/`, як `src/seed-admin.ts`)
- Тестові дані з T-301

## Реалізація (2026-09-27)
- **`src/seed-customers.ts`** — патерн `seed-admin.ts`: програмний експорт `seedCustomers(prisma, customers?)` + CLI (`pnpm seed:customers`). 5 демо-клієнтів (`DEFAULT_CUSTOMERS`), нормалізація номерів через доменний `PhoneNumber.of` (приймає і `050…`, і `+380…` — зберігається завжди E.164). Ідемпотентність: findUnique за унікальним телефоном → `create | update` (summary `created/updated/phones`).
- **Ролі**: тільки `role: 'client'` (адмін — `seed-admin.ts` T-013, барбери — `scripts/seed-dev.mjs`). Сід **не пише** подій в outbox і не створює OTP/email/паролів — ADR 0005.
- **Env-конфіг**: `FADE_SEED_CUSTOMERS_PHONE`(+`_NAME`) перевизначає ростер для CI/стейджу (`resolveSeedCustomers`).
- **Скрипти**: `pnpm seed:customers` — новий; у `seed:e2e` додано `ts-node src/seed-customers.ts` після seed-admin.
- **Специ**: `src/seed-customers.spec.ts` (4): створення з нормалізацією E.164, ідемпотентність (другий прогін = update), env-перевизначення, валідація не-валідного номера до походу в DB.
- **Жива перевірка на контейнерній DB**: 1-й прогін `created=5`, повторний `created=0 updated=5`; psql — 5 рядків `role=client` з `+380…`.

## Done
- [x] Сід-клієнти створені
- [x] Ролі призначені (client; адмін/барбери — у своїх сідах)
- [x] Дані валідовані (E.164 через PhoneNumber; спеки + живий прогін; гейти 538/538, coverage EXIT=0)
