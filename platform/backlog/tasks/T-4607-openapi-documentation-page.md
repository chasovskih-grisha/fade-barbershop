# T-4607 · OpenAPI Documentation Page & Route

- **Stage**: M5 (phase 27-28) · **Tags**: backend, api, documentation, platform · **Complexity**: senior · **Depends on**: T-4569, T-4300d
- **StoryPoints**: 8

## What

Реалізація сторінки документації OpenAPI та маршрутів для API додатку:
- **Swagger UI**: доступна за `/docs` (альтернатива: `/openapi`) — інтерактивна Documentation
- **OpenAPI JSON**: доступна за `/docs.json` (альтернатива: `/openapi.json`) — сира специфікація
- Всі ендпоінти з валідними контрактами мають бути видимі в обох місцях
- Кожен ендпоінт має мати релевантний і валідний контракт (request/response схем, помилки, приклади)

## Why

- Дозволити розробникам/партнерам досліджувати API без зовнішніх інструментів
- Мати уніфіковану специфікацію для генерації SDK (T-4569: `openapi-typescript-codegen` → `@fade/api-client`)
- Автоматично синхронізувати документацію з кодом контролерів

## Sources

- T-4569 (Developer Portal: Docusaurus + OpenAPI renderer — тут ми робимо embedded версію)
- T-4300d (contracts) — використовуємо існуючі DTO/інтерфейси як бази для схем
- NestJS Swagger (`@nestjs/swagger` вже в залежностях)
- Контролери в `apps/api/src/*/infrastructure/*.controller.ts` — вже мають `@ApiTags`, потрібно доповнити

## Done

- [ ] **SwaggerModule setup** в `apps/api/src/main.ts`:
  - Create `SwaggerModule.createDocument()` з `DocumentBuilder`
  - Configure `title`, `description`, `version`, `servers` (local: `http://localhost:13000`)
  - Add `bearerAuth` / `apiKeyAuth` схеми (якщо є auth на ендпоінтах)
  - Включити `operationId` для генерації SDK
- [ ] **Маршрути**:
  - `GET /docs` → Swagger UI (SwaggerModule.setup)
  - `GET /docs.json` → JSON специфікація (SwaggerModule.setup з `jsonDocumentUrl`)
  - Альтернативно: `/openapi` та `/openapi.json` — як fallback/аліаси
- [ ] **Покрити всі існуючі ендпоінти декораторами**:
  - `@ApiOperation({ summary, description })` — на кожному handler
  - `@ApiResponse({ status, description, type/schema })` — success + error responses
  - `@ApiBody({ type, description, examples })` — для POST/PUT/PATCH
  - `@ApiParam`, `@ApiQuery` — для параметрів
  - `@ApiBearerAuth()` / `@ApiSecurity()` — де потрібна authorization
  - Використовуючи існуючі DTO (`LocationDto`, `ServiceDto`, `BarberDto`, `SlotRequestDto`, `AvailableSlotDto`, `BookSlotDto`, тощо) як `type` в декораторах
- [ ] **Verify валідність спеки**:
  - `GET /docs.json` повертає валідний OpenAPI 3.0/3.1 документ
  - Жодного ендпоінту не пропущено (Verify по `@Controller` prefix + method decorators)
  - Всі response codes задокументовані (200, 201, 400, 401, 403, 404, 409, 422, 500)
  - Схеми не мають `any` / порожніх об'єктів
- [ ] **CI гейт** (опціонально, але бажано):
  - Скрипт/тест, що валідує `openapi.json` через `swagger-codegen` або `openapi-typescript-codegen`
  - Fail білд якщо спека невалідна або є ендпоінти без `@ApiOperation`

## Ендпоінти для перевірки (інвентар на момент створення)

### Booking (`/booking`)
- `GET /booking/locations` → `LocationDto[]`
- `GET /booking/services/:locationId` → `ServiceDto[]`
- `GET /booking/barbers/:locationId` → `BarberDto[]`
- `POST /booking/slots` (body: `SlotRequestDto`) → `AvailableSlotDto[]`

### Admin Bookings (`/admin/bookings`)
- `POST /admin/bookings` (body: `BookSlotDto`) → `{ id: string }`

### Admin Appointments (`/admin/appointments`)
- [ ] Verify контролер — Add декоратори

### Client Appointments (`/appointments`)
- [ ] Verify контролер — Add декоратори

### Admin Calendar (`/admin/calendar`)
- [ ] Verify контролер — Add декоратори

### Client Bookings (`/booking` — client-bookings.controller)
- [ ] Verify контролер — Add декоратори

### Locations / Admin Settings
- [ ] `admin-geocoder-settings.controller` — Add декоратори

### Identity / Auth endpoints
- [ ] Verify IdentityModule — Add декоратори

## Risks

- [ ] **Назва маршруту**: `/docs` vs `/openapi` — узгодити з командою (T-4569 Developer Portal може мати власний `/docs`, тому embedded версія краще за `/api/docs` або `/openapi`)
- [ ] **Конфлікт з веб-документацією**: якщо веб-сайт (apps/web) теж має `/docs`, використовувати префікс `/api/docs` або `/openapi`
- [ ] **Неповні DTO**: деякі контролери використовують інлайн-типи або `any` — потрібно винести в окремі DTO файли для коректної генерації схем
- [ ] **Валідація vs Documentation**: `class-validator` відсутній, декоратори `@nestjs/swagger` не валідують — це лише для документації (ADR 0019, T-4605)

## Примітки

- Не створювати окремий `openapi.yaml` вручну — генерувати з коду (Single Source of Truth)
- Якщо потрібен статичний файл для CI/CD — Add скрипт генерації в `package.json` (напр. `pnpm --filter api run openapi:generate > packages/contracts/openapi/openapi.json`)
- Route naming: рекомендую `/api/docs` і `/api/docs.json` для уникнення колізій з frontend routes