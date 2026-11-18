# Ідентичність та доступ (`identity`)

> Тип піддомену: **Generic**

Хто користувач і що йому дозволено. Не плутати з карткою клієнта в CRM.

Для `client` логін — **телефон + SMS OTP** на сайті і в додатку. Один `User`, кілька `Session` (web cookie, mobile bearer). Див. ADR 0005.

**Спільна сесія web-продуктів** (ADR 0017): клієнтська cookie-сесія ставиться з `Domain=.fade.com.ua` — `fade.com.ua` (кабінет) і `shop.fade.com.ua` (магазин) читають **одну і ту саму сесію**: залогінився будь-де — залогінений всюди; вхід/вихід — той самий `RequestOtp` / `VerifyOtp` / `RevokeSession`. Адмінська сесія — окрема cookie на `admin.fade.com.ua` (не батьківська, привілейований домен не блимає на публічних хостах).

## GDPR: стирання акаунта (T-4805)

- **Заявка**: `POST /identity/account-erasure-requests` з `{ phone, code }`. Код перевіряється тим самим OTP-челенджем, що й вхід (`purpose: login`); без коду номер не доведений. Повторна заявка ідемпотентна — повертає наявний рядок `AccountErasure`.
- **Воркер** (`RunErasure`, інтервал 30 с, `ERASURE_WORKER_DISABLED=true` вимикає): анонімізує `User` (phone → `+1999<uuid>`, email/name/username/passwordHash → null, `active=false`), `ClientProfile` (імʼя, нотатки, вподобання, день народження → null/[]), відкликає сесії та push-токени, soft-delete фото `SourcePhoto` і видаляє обʼєкти з MinIO через `S3PhotoStorage`.
- **Фінансова цілісність**: платежі, чеки й візити не змінюються — стирається лише PII.
- **Збої**: backoff 5→10→20 хв, після 3 спроб `status=failed` для ручного розбору; аудит пише лише id/статус/кількості, без plaintext PII.
- **Комплаєнс-звіт**: `GET /admin/account-erasures/report` — кількості за статусами й останні завершені заявки з кількістю видалених обʼєктів.

## Ubiquitous language

- **User** — обліковий запис. Для клієнта ідентифікатор — `PhoneNumber`.
- **PhoneNumber** — E.164 (`+380…`). Унікальний для `User`.
- **OtpChallenge** — одноразовий код на номер; коротке життя, ліміт спроб.
- **Role** — client | barber | admin.
- **Session** — активний вхід на каналі `web` | `mobile` | `admin`.

## Aggregates (план, ще не код)

- `User`
- `OtpChallenge`

## Domain events (план)

- `OtpRequested`
- `UserRegistered` (перший успішний OTP клієнта)
- `SessionStarted`
- `RoleGranted`
- `SessionRevoked`

## Use cases (план)

- `RequestOtp` — номер → SMS (або console в dev)
- `VerifyOtp` — номер + код → Session; створює User+role `client`, якщо немає
- `RevokeSession` / logout
- `ChangePhoneNumber` — окремо, не «другий логін»
- `AdminLogin` — username + password → Session (`admin`); роль не `admin` → 403

## Порти (план)

- `UserRepository`
- `OtpChallengeRepository`
- `OtpSender` (SMS-провайдер)
- `Clock`
- `TokenIssuer` (mobile) / cookie на web-адаптері

## Відправник OTP (T-4301, T-4400)

`OtpSenderFactory` обирає канал за `OTP_PROVIDER`:

- `console` (дефолт) — `DevOtpSender`: код у логах (лише dev).
- `mailpit` — `MailpitOtpSender`: «SMS як email» на `sms.dev` (Web UI Mailpit), `MAILPIT_URL`.
- `sms` — `HttpOtpSender`: реальний прод-провайдер (TurboSMS-подібний HTTP API),
  альфа-ім'я **FADE**. Потрібні `SMS_PROVIDER_URL` і `SMS_PROVIDER_TOKEN`
  (секрети — з secret manager T-300, не з репозиторію); без них фабрика кидає
  на старті, щоб не піти мовчки в console і не залишити клієнта без коду.

Якщо заданий `SMS_FALLBACK_URL`/`SMS_FALLBACK_TOKEN`, основний провайдер
обгортається `FallbackOtpSender`: відмова основного — error-лог (алерт T-4204) і
доставка резервним; обидва впали — помилка видима use case-у (клієнт може
повторити). Текст коду — спільний (`otp-message.ts`) для Mailpit і прод-каналу.

## Хто викликає

- `apps/web` — кабінет клієнта (`/login`, cookie)
- `apps/mobile` — клієнт і барбер (bearer)
- `apps/admin` — окрема сесія засновника, не клієнтський OTP на публічному домені

## Ідентифікатори в API (T-4300d, ADR 0021)

`User`, `Session`, `OtpChallenge` мають UUID-ключі (v7 генерує застосунок).
Контракти (`@fade/contracts`) віддають їх рядком — жодного числового id в
клієнтах:

```json
{
  "token": "…",
  "user": { "id": "0192f1a4-7c3b-7a8e-9b41-2f6d5c8e0a13", "phone": "+380501112233" }
}
```

Приклад сесії пристрою (`GET /identity/client/sessions`):

```json
{ "id": "0192f1a4-7c41-7f0a-8d2e-5b7c9a1e3f60", "channel": "web", "createdAt": "2026-11-11T09:00:00.000Z", "current": true }
```

## Шарність

- `domain/` — Чиста модель. Без Nest, Prisma, HTTP, Expo. Тут entities, value objects, events, repository-порти.
- `application/` — Use cases: command/query, handlers, політики доступу. Транзакція = один use case.
- `infrastructure/` — Адаптери цього контексту (Prisma, HTTP, черга). Зовнішні системи лише через ACL, не в domain.

Код домену не імпортує Nest, Prisma, React Native і HTTP-клієнти. Залежності спрямовані всередину: infrastructure → application → domain.

Публічний API контексту (коли з’явиться код) реекспортує domain + application, **не** infrastructure.
