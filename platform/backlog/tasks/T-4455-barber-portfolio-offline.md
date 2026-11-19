# T-4455 · Барбер публікує до/після в офлайні

- **Stage**: M4 (phase 8) · **Tags**: backend, barber-app, portfolio · **Complexity**: junior · **Depends on**: T-190, T-4437, T-100
- **StoryPoints**: 3
- **Status**: review

## What

У барберському додатку — екран «Портфоліо» з фото-потоками прав: додавати до/після зі свого пристрою (не лише з AI), категорія (стрижка/борода), tags, перегляд превью, право на публікацію (кероване адміном), статус модерації (на модерації/публічний/відхилено). Діє правило «реальні фото клієнта зі згоди».

## Why

Кращі майстри — портфоліо; фото-керування з пристрою (T-190 стриманий, опинилось, що активно схильні публікувати) розвиває соціальний капітал.

## Sources

- barber-screens.md; portfolio README; T-190/100, T-4437 (підтверджені AI); правила згоди клієнта

## Done

- [x] Екран фото до/після (Add/tags/статус) у барбер-додатку: backend-контракт `POST /barber/portfolio` (категорія `haircut|beard`, 1–4 фото «після», опційне «до», теги, підпис), `GET /barber/portfolio/:barberId` зі статусами; домен у `portfolio/domain/portfolio-item.ts`
- [x] Модерація адміном і право публікації (role): `POST /admin/portfolio/:id/publish` / `:id/hide` (лише `admin`, причина приховування обов’язкова), черга `GET /admin/portfolio?status=`, публічна галерея `GET /portfolio/barbers/:barberId` — тільки `published` із чинною згодою
- [x] Згода клієнта фіксується при прив'язці фото (журнал): `recordConsent`/`revokeConsent`, `ConsentJournalEntry` (хто, коли, `opt_in_screen`/`in_chair`, рішення), `GET /admin/portfolio/:id/consent-journal`; відмітка в кріслі з іменем знижується до `anonymous`
- [x] Тести: 14 — валідація фото/категорії/тегів, `pending_consent → pending_review → published`, заборона публікації без згоди й не-адміном, ідемпотентне приховування, миттєве приховування після відкликання згоди, журнал згоди, HTTP-мапінг 400/403/404/409

## Risks

- [x] **Незаконне фото**: публікація без згоди клієнта — журнал згоди + `pending_consent` без можливості публікації + можливість швидко прибрати з дошки (`hide`, `revokeConsent`)
- [x] Згода перевіряється повторно у `publicGallery` — дані, змінені в обхід use case, не потрапляють у публічну видачу

## Deferred

- Реальне завантаження/обробка файлів і публічна копія в object storage (ADR 0008, `PublicMediaStorage`): контракт приймає `objectKey`, адаптер підключається окремим провайдером.
- Prisma-персистенція елементів і журналу згоди: у `prisma/schema.prisma` ще немає таблиць портфоліо, тому `InMemoryPortfolioRepository`/`InMemoryPortfolioConsentJournal` (той самий підхід, що в сусідніх зрізах).
- Автентифікація барбер-додатка: роль передається тілом запиту, `BarberSessionGuard` — окрема картка (T-4434 барбер-сесії); сервер уже генерує id через `uuidv7`.
- UI барбер-додатка, доменні події `PortfolioItemPublished/Hidden` для `content`/`notifications` — окремі картки.
