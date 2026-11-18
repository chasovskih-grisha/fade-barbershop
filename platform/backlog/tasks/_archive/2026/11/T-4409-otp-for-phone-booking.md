# T-4409 · OTP для телефонного запису (адмін ініціює)

- **Stage**: M1 (phase 1) · **Tags**: backend, security · **Complexity**: middle · **Depends on**: T-010, T-046
- **StoryPoints**: 5

## What

З вайди T-046 (адмін створює візит по телефону): адмін з екрана телефонного запису ініціює OTP для клієнта на його номер (той самий потік RequestOtp/VerifyOtp, ADR 0005). Код не логується, ліміти на номер, шаблон повідомлення за суфіксом «для запису по телефону» (purpose `booking`).

## Реалізація (2026-09-27)

- **Ендпоінти** (`AdminClientOtpController`): `POST /admin/clients/otp/request { phone }`, `POST /admin/clients/otp/verify { phone, code }` — під глобальним AdminSessionGuard; actorId — з cookie-сесії (`adminUserId`), не з DTO.
- **Use cases** (`application/admin-client-otp.ts`): `AdminRequestClientOtpHandler` (purpose 'booking' → `OtpSender.send(phone, digits, 'booking')`; подія `identity.otp.requested` з `purpose`, **без digits**) і `AdminVerifyClientOtpHandler` — верифікація адміном **без створення клієнтської сесії** (структурно: без SessionRepository у deps), фіксує `phoneVerifiedAt` на User (ідемпотентно, перша дата) + подія `identity.phone.verified` (userId/phone/actorId) в outbox.
- **Домен**: `User.phoneVerifiedAt` + `markPhoneVerified` (ідемпотентно); порт `OtpSender.send(+purpose)`; migration `20260927010000_user_phone_verified`.
- **Шаблон** (уточнено 2026-09-29): purpose прокидається в реалізації каналу (console/mailpit) — суфікс «для запису по телефону» у повідомленні. Жива верифікація спершу спростувала це: senders приймали лише 2 аргументи (TS мовчки ігнорує третій) — виправлено, обидві реалізації рендерять за purpose (дефолт `'login'`), +2 спеки в otp-sender.factory.spec.
- **Жива верифікація end-to-end (2026-09-29)**: request → challenge у DB → лист у Mailpit з темою «Fade — код для запису по телефону» → digits з листа → verify → `phoneVerifiedAt` у DB → повторне verify відхилено (used). Перший споживач SMS-каналу доведений живим прогоном, не лише юніт-спеками; пізніше той самий цикл прожитий **по HTTP через контейнерний api** — перемикач `OTP_PROVIDER` (OtpSenderFactory) підтверджений наскрізно, включно з першою (не ідемпотентною) верифікацією сід-клієнта.

## Поточний зріз (2026-10-02, димовий Playwright-прогін екрана §6.2)

Екран телефонного запису не мав жодного браузерного прогону: `pnpm e2e` покривав лише web-бронювання, а адмінський екран lived тільки в jest-тестах з моками — тобто жодного тесту не проходило справжнім каналом OTP. Додано `apps/admin/e2e/phone-booking.spec.ts` (+ `playwright.config.ts`, `e2e:admin` у кореневому package.json, `@playwright/test` у devDeps адмінки, `testPathIgnorePatterns: ['/e2e/']` у jest, щоб не підхоплював Playwright-спеку).

- **Прогін наскрізь:** логін → «Надіслати код» → **справжній** OTP із Mailpit (`/api/v1/messages` + `/api/v1/message/:id`) → форма → 201 → `/admin/calendar?date=` показує візит із непорожнім `clientId`. Остання перевірка закриває регресію T-046: раніше `origin.clientId` був `null`, і такий запис був би невидимий у «Моїх візитах».
- **Живий прогін зерий** на стеку (admin :13002, api :13000, smspit :19096) після `seed:dev` + `seed:admin` + `seed:customers`.
- **Обмеження, які тест поважає (і пояснює):** клієнт і барбер — із сіду (verify відкидає невідомий `User`; барбери-фікстури-e2e не мають `AvailabilityWindow`); слот на 15-хв сітці в Пн–Сб, бо `09:46` → 400, а `09:45` проходить; крок рухається щокроково, бо в локації рівно 2 крісла; знімок Mailpit перед надсиланням, бо Mailpit персистентний і без нього тест читає код попереднього прогону.
- **Три пастки, що коштували реальних проганих ітерацій** (зафіксовані в `docs/testing-guidelines.md` §1.1): `getByRole('alert')` збігається з **порожнім** alert-вузлом-обгорткою, що є на сторінці завжди; перевірка логіну через зникнення «Увійти» хибно-зелена, бо кнопка під час завантаження перейменовується на «Вхід…»; `/admin/calendar` приймає один параметр `?date=`, а не `from`/`to`.
- **Не гейт CI.** У `ci.yml` none Playwright-job (ні web, ні admin) — Scenario потребує живого стеку; це команда рівня `pnpm e2e`.

## Why

Клієнт дзвонить і хоче записатися без додатка; без OTP адмін діє «в повітрі» — номер не верифікований, подальші автоматріггери (нагадування, лояльність) тримаються на підтвердженому контакті.

## Sources

- ADR 0005 (телефон = логін); admin-screens.md §6.2; identity README

## Done

- [x] Адмін ініціює OTP клієнта з екрана запису; код не логується (гейт-тест: payload подій без digits; код тільки в канал — CapturingSender)
- [x] Верифікований номер стає `phoneVerifiedAt` у клієнта (ідемпотентно) + подія PhoneVerified
- [x] Rate limit успадкований (60s resend, 5 спроб → lock); аудит — подія PhoneVerified з actorId в outbox (файловий audit-log T-3604 — на старті відповідної задачі)

## Risks

- [x] **Витік коду**: гейт у юніт-спесі — `JSON.stringify(event.payload)` не містить digits; код живе лише в каналі (sender) і хеші challenge
