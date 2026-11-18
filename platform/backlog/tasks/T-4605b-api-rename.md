# T-4605b · Перейменування DTO в apps/api (5/19)

- **Stage**: M6 (phase 40) · **Tags**: backend, architecture, quality · **Complexity**: middle · **Depends on**: T-4605a
- **StoryPoints**: 5

## What

Slice 2/5 епіка T-4605. Механічне перейменування в `apps/api` за таблицею з T-4605a — 38 декларацій у 18 файлах:

- **Папки-конвенції** `booking/dto/` (6 файлів) і `scheduling/dto/` (3 файли): файли `*.dto.ts` → `*.request.ts` / `*.response.ts` / `*.payload.ts`, типи перейменовано за таблицею, імпорти оновлено.
- **Розкидані в `infrastructure/`**: `content/infrastructure/content.dto.ts` і `locations/infrastructure/nearest-locations.dto.ts` — разом із маперами `to*Dto` → `to*Response`.
- **Інлайнові декларації в 7 контролерах** (16 типів, 4 приватні): `admin-locations`, `admin-barbers`, `admin-services`, `admin-content`, `client-appointments`, `appointment-party`, `public-content`.
- **Tests**: імена в `.spec.ts` / `.e2e.spec.ts`, локальні аліаси, fixture-об'єкти.

Рішення щодо папки (`dto/` → `api/`) і винесення інлайнових типів з контролерів — за T-4605a, питання 5. Якщо винесення вирішено — воно йде **окремим комітом після** механічного перейменування, щоб диф перейменування залишався рев'юшним.

## Why

API — джерело істини для решти monorepo: web копіює ці типи вручну, contracts їх експортує. Поки в `apps/api` живуть `Dto`, узгодженість з ключовими випадками T-4605c none — перейменування доводиться робити двічі.

## Sources

- T-4605a (таблиця перейменувань, ADR)
- `docs/engineering-principles.md` (гейт `max-lines ≤ 100`, ADR 0019)
- README контекстів `apps/api/src/*/`

## Done

- [ ] `rg -i '\bdto\b' apps/api/src` — порожньо (окрім імен файлів, які теж перейменовано)
- [ ] Жоден `git mv` не зроблено через `mv`+`git add`: історія файлів збережена
- [ ] Один коміт на контекст (`booking`, `scheduling`, `content`, `locations`, `identity`, `services`, `appointment-party`) — диф рев'юшний
- [ ] `tsc --build` для `apps/api` чистий між комітами
- [ ] Повний тестовий набір API зелений, coverage не впав
- [ ] Жодної зміни wire-контракту: `class-validator`/`class-transformer` у стекі none, жодного `class *Dto` не існує, імена TS-інтерфейсів стираються компілятором, декораторів `@nestjs/swagger` у коді none — міграцій DB і back-compat Shim не потрібно
- [ ] **`SlotRequestDto` → `SlotQueryRequest`**, а не `SlotRequestRequest` (рішення T-4605a); правило механічно не застосовується
- [ ] **Перевірено конфлікт однакових імен у barrel-експортах**: `LocationDto`/`BarberDto`/`ServiceDto`/`AvailableSlotDto` дублюються в різних контекстах (`booking`, `locations`, `services`, `identity`), після перейменування це `LocationResponse`/`BarberResponse`/`ServiceResponse`/`AvailableSlotResponse` — жодні два різні типи не потрапляють в один `index.ts`; якщо потрапляють — ім'я розведено явним реекспортом
- [ ] У рев'ю явно зафіксовано: якщо майбутнім ендпоінтам (T-250, T-4553, T-4558) знадобляться DTO-класи з валідацією — це окрема задача на `class-validator` + декоратори, і вона має йти **після** T-4605, щоб не розкололи іменник

## Risks

- **Диф на 18 файлів у одному PR не рев'юиться.** Лікується комітами по контекстах, а не сумарним «rename all».
- **Одне пропущене імпортоване ім'я компілюється випадково** — наприклад, якщо два контролери мають однойменні `LocationDto` (так і є: `booking` і `locations`). Після перейменування обидва стануть `LocationResponse` у різних модулях; Verify, що конфлікту імен у barrel-експортах не виникло.
- **Pre-existing падіння `pnpm lint` в `apps/api`** (зафіксовано в журналі 2026-09-28) — не приписувати його цьому слайсу: критерій «нових лінт-помилок none», а не «`pnpm lint` зелений».

## dependencies

- T-2500f (загальний прохід по TypeScript)
