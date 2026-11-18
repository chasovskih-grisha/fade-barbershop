# T-4300b · Prisma-схеми на UUID v7 (6/30)

- **Stage**: M0 (phase 0) · **Tags**: backend, architecture, high-risk · **Complexity**: middle · **Depends on**: T-4300a
- **StoryPoints**: 6

## What

Перевести Prisma-схеми всіх контекстів на `String` PK (UUID v7): `@id @db.Uuid`, дефолт — не в DB, а в коді (`uuidv7()` у конструкторах агрегатів). FK-колонки — теж UUID. migration дев-бази (дані ще тестові — можна `migrate reset`), без expand/contract на проді (прода ще none).

## Why

Схема — контракт для всіх майбутніх фаз; після M1 змінювати PK дорожче з кожним тижнем. Робити до старту Identity (T-010 done — таблиці identity першими).

## Sources

- ADR 0021 (UUID Primary Keys)
- `packages/contracts/` (серіалізація ID як string)

## Done

- [x] Усі `schema.prisma` (identity + майбутні контексти): PK/FK — UUID v7, без autoincrement
- [x] Міграції дев-бази застосовані; smoke T-010 (OTP-флоу) зелений після переводу
- [x] Дефолт ID генерується в коді агрегатів, не `@@default` в Prisma
- [x] Typecheck/build/tests — усі гейти зелені (ADR 0019)

## Risks

- [x] **Пропущені FK**: пошук по всіх схемах на `Int @id`/`AutoIncrement` — чекліст
- [x] **Індекси**: PK-тип змінює розмір індексів — дев-база перевіряється, прод-план — у T-4300c
