# T-4605c · Contracts і клієнти: узгодження конвенції (5/19)

- **Stage**: M6 (phase 40) · **Tags**: frontend, architecture, quality · **Complexity**: middle · **Depends on**: T-4605a, T-4605b
- **StoryPoints**: 5

## What

Slice 3/5 епіка T-4605. Другий словник імені в monorepo — `packages/contracts`. Якщо перейменувати тільки `Dto`, в коді залишаться дві конвенції для однієї відповіді API, і заявка «вирівняти весь кодобейз» не виконана.

- **`packages/contracts`**: 13 типів `*Input`/`*Result` → `*Request`/`*Response`, `*ErrorBody` → `*ErrorResponse` (питання 3 і 4 з T-4605). Безсуфіксні `Article`, `ArticleRef`, `ArticleSummary`, `OtpChannel`, `ArticleStatus` — за рішенням ADR з T-4605a.
- **8 файлів-споживачів `@fade/contracts`** у цьому ж PR (жодного зеленого стану між ними): `apps/admin/src/app/blog/{blog-api,ArticleEditor,ArticleForm,BlogManager}` і `apps/api/src/identity/infrastructure/{admin-login,refresh-session,request-otp,verify-otp}.controller.ts`.
- **`apps/web/src/app/booking/types.ts`**: 9 типів `*Dto` → `*Response` за таблицею; споживачі — `bookingApi.ts`, `useBookingData.ts`, `useBookingFlow.ts`, `steps/{Location,Service,Barber,Slot}Step.tsx`, `__tests__/booking-flow.test.tsx`.
- **`apps/mobile`**: DTO-типів none — Verify, що mobile споживає саме `@fade/contracts`, а не власні копії, і що після b/c нічого не зламалось.

**Межа цього слайса — лише перейменування.** Усунення дублювання `apps/web/src/app/booking/types.ts` і `apps/web/src/lib/api/locations.ts` (два конкуруючі словники типу локації) — це DRY, тобто T-2500d, не тут.

## Why

`AGENTS.md` вимагає: «Клієнти залежать від `packages/contracts`, не від внутрішнього домену API». Поки contracts говорить `Input`/`Result`, а API — `Dto`, правило виконується за суттю, але не на іменах: розробник не знає, який словник канонічний, і пише четвертий. Плюс contracts — це публічна точка, схожа на поверхню API, для адмінки й mobile: ламається компіляцією, а не рантаймом, тільки якщо перейменувати його разом зі споживачами.

## Sources

- T-4605a (таблиця, ADR)
- `AGENTS.md` (клієнти залежать від `packages/contracts`)
- T-3802 (майбутня API-платформа), T-4300d (контракти UUID)

## Done

- [ ] `rg -i '\b(input|result)(dto)?\b' packages/contracts/src` — жодного транспортного імені з `Input`/`Result` (Verify за списком з T-4605a, а не регуляркою по всьому тексту)
- [ ] `packages/contracts` експортує 0 типів поза конвенцією з ADR; README пакета оновлено
- [ ] `apps/admin` і `apps/web` компілюються на нових контрактах; їхні Tests зелені
- [ ] `tsc --build` по всьому monorepo чистий (увесь `tsc --build`, не лише змінені пакети)
- [ ] `apps/mobile` перевірено на власні копії контрактів — їх none або вони усвідомлені як окрема задача

## Risks

- **Розрив контракту на споживачів.** `@fade/contracts` імпортують 8 файлів у 2 застосунках. Між комітом «contracts перейменовано» і комітом «споживачі оновлено» компіляція падає — тому обидва кроки в одному PR, без проміжного коміта в main.
- **Третій словник натомість другого.** Якщо замість `*Input`/`*Result` обрати четвертий варіант («залишимо contracts як є»), беклог треба поправити: тоді заявка про глобальне вирівнювання не закрита, і T-4605b доводиться переробляти.
- **`Result` — загальне слово.** Перед перейменуванням Verify, чи є в contracts ідентифікатори `Result`, не пов'язані з контрактами (наприклад, `Promise<Result<…>>`) — інакше регекспорт змішується.

## dependencies

- T-4605d (лінтер-гейт має покривати й contracts)
