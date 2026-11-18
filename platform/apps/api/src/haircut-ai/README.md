# AI-підбір зачіски (`haircut-ai`)

> Тип піддомену: **Supporting (ACL)**

Генерація пропозицій зачісок за фото клієнта. Зовнішній AI-провайдер ховається за anti-corruption layer (ADR 0008); у домені — фото, статуси і вибрані варіанти, не «сирий» відповідь провайдера.

Фото клієнтів — персональні дані: приватне об'єктне сховище, short-lived signed URLs, доступ за ACL (власник, барбер призначеного візиту, admin), авто-видалення (ADR 0008; дефолт — 12 місяців після останньої активності, налаштовується адміном — AI-ADM-06). Приймальні критерії: `docs/acceptance-criteria/02-ai-haircut-suggestion.md`.

## Ubiquitous language

- **SourcePhoto** — оригінальне фото клієнта для генерації.
- **HaircutSuggestion** — результат AI: набір згенерованих варіантів зачісок на фото клієнта.
- **GenerationStatus** — стан обробки: `pending` | `processing` | `ready` | `failed`.
- **SelectedVariant** — обраний клієнтом варіант із HaircutSuggestion (стає `HaircutReference` у `scheduling`).

## Aggregates (план, ще не код)

- `SourcePhoto`
- `HaircutSuggestion`

## Domain events (план)

- `PhotoUploaded`
- `SuggestionGenerated`
- `VariantSelected` (→ `scheduling` створює/оновлює `HaircutReference`)
- `SuggestionFailed`
- `PhotoDeleted`

## Порти (план)

- `PhotoRepository` (object storage, не Postgres)
- `SuggestionRepository`
- `AiGenerationGateway` (зовнішній провайдер, ACL — специфікація нижче)

## Порт `AiGenerationGateway` (план)

Єдиний вихід домену до зовнішнього AI-провайдера (ADR 0008). Інтерфейс живе в `domain/ports/` і не знає про HTTP, SDK і схеми провайдера; конкретний адаптер — в `infrastructure/`, вибір провайдера — конфіг (env), не код.

```ts
// domain/ports/ai-generation-gateway.port.ts — лише доменні типи, нуль типів провайдера
interface AiGenerationGateway {
  createGenerationJob(request: GenerationRequest): Promise<GenerationJobHandle>;
  getJobResult(handle: GenerationJobHandle): Promise<GenerationJobResult>; // ідемпотентний, безпечний для повторів
}

interface GenerationRequest {
  sourcePhotoUrl: string;     // short-lived signed URL на НАШ бакет (TTL ~15 хв) — master-копія наша
  variantCount: number;       // 3–4 (AI-WEB-04)
  options: GenerationOptions; // доменні параметри; адаптер перекладає їх у мову провайдера
}

interface GenerationJobHandle {
  value: string;              // опакетований ID завдання; зміст має сенс лише всередині адаптера
}

interface GenerationJobResult {
  status: 'processing' | 'ready' | 'failed';
  variants?: GeneratedVariant[];      // лише при ready
  failureReason?: 'invalid_photo' | 'provider_timeout' | 'provider_quota' | 'unknown'; // AI-ADM-04
}

interface GeneratedVariant {
  objectKey: string;          // ключ у НАШОМУ бакеті — адаптер ре-хостить результат до нас
  contentType: 'image/png' | 'image/jpeg' | 'image/webp';
}
```

Правила ACL (перевірювані, не побажання):

- **Handle не потрапляє в домен.** Зіставлення `HaircutSuggestion ↔ handle` зберігається в інфраструктурній таблиці (`provider_jobs`: suggestion_id, provider_job_id, спроби, дедлайн). У домені — тільки `GenerationStatus`.
- **Фото йде від нас.** Провайдер отримує short-lived signed URL на `SourcePhoto` з нашого бакету — не файл від клієнта напряму і не публічний URL. Master-копія і контроль утримання залишаються нашими (ADR 0008).
- **Результат ре-хоститься.** Адаптер завантажує зображення варіантів з провайдера у наш приватний бакет і повертає наші `objectKey`. URL-и провайдера не зберігаються і не віддаються клієнту — після їх TTL вони мертві, і нам це байдуже.
- **Сира відповідь не зберігається.** Адаптер перекладає схему провайдера в `GenerationJobResult`; зміна провайдера = новий адаптер, домен і статуси не змінюються.
- Тестовий інваріант (ADR 0008): жоден доменний тест не імпортує типи провайдера.

## Асинхронний флоу генерації (план)

Генерація ніколи не блокує HTTP-запит клієнта (AI-WEB-03: «Завантажено → Обробка AI → Готово / Помилка»). Конвеєр: **request → черга → poll → статуси**.

1. **Request.** Клієнт (згода AI-WEB-02, ліміт AI-WEB-05) викликає `RequestSuggestion`. Домен створює `HaircutSuggestion` зі статусом `pending`, подія `PhotoUploaded`. У відповідь — ID і статус; клієнт більше нічого не чекає.
2. **Черга.** Use case ставить завдання в чергу (Redis jobs, стек `infra/`); воркер забирає і переводить `pending → processing`. Повторне виконання воркера ідемпотентне: перед створенням завдання провайдера перевіряється поточний статус.
3. **Провайдер.** Воркер викликає `createGenerationJob` (signed URL + параметри); handle — у `provider_jobs`. Дедлайн генерації — **10 хв** (дефолт, налаштовується); перевищення → `failed` з причиною `provider_timeout` (AI-ADM-04).
4. **Poll — рішення: опитування, не вебхук.** Воркер опитує `getJobResult` з наростаючим інтервалом (~5 с → 30 с). Приймати вебхуки провайдера означає новий публічний ендпоінт — зайва поверхня атаки і крок убік від «жодних публічних маршрутів для фото» (AI-WEB-08). Вебхук можливий пізніше лише як сигнал «опитай зараз раніше» з HMAC-перевіркою підпису; вміст вебхука **ніколи** не є джерелом результату — результат завжди через `getJobResult`.
5. **Готово.** `ready`: адаптер ре-хостить варіанти у наш бакет, домен зберігає варіанти і статус `ready`, подія `SuggestionGenerated` (споживачі: push-сповіщення — фаза 7, аналітика). Далі клієнт обирає варіант — `VariantSelected` → `HaircutReference` у `scheduling` (див. `03`). Статуси клієнт бачить через **наш** API (полінг екрана, AI-WEB-03), не провайдера.
6. **Помилка.** `failed` + причина в `SuggestionFailed` (AI-ADM-04). Спроба, що впала з вини провайдера/системи (`provider_timeout`, `provider_quota`, `unknown`), **не витрачає добовий ліміт**; `invalid_photo` теж не витрачає (AI-WEB-06). Статус `failed` — термінальний: нова спроба = нова `HaircutSuggestion` (з власним місцем у ліміті).

Статусна машина: `pending → processing → ready | failed`. Зворотних переходів немає; `processing → pending` не існує — повторне виконання продовжує ту саму спробу. Відображення на екран клієнта: `pending` = «Завантажено», `processing` = «Обробка AI», `ready` = «Готово», `failed` = «Помилка».

## Хто викликає

Web (кабінет клієнта), mobile клієнта; admin — моніторинг, ліміти, видалення. Барбер — лише читання вибраного референсу через `scheduling`.

## Шарність

- `domain/` — Чиста модель. Без Nest, Prisma, HTTP, Expo. Тут entities, value objects, events, repository-порти.
- `application/` — Use cases: command/query, handlers, політики доступу. Транзакція = один use case.
- `infrastructure/` — Адаптери цього контексту (Prisma, HTTP, черга, AI-провайдер лише через ACL, не в domain).

Код домену не імпортує Nest, Prisma, React Native і HTTP-клієнти. Залежності спрямовані всередину: infrastructure → application → domain.

Публічний API контексту (коли з'явиться код) реекспортує domain + application, **не** infrastructure.