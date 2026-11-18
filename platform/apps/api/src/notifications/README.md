# Сповіщення (`notifications`)

> Тип піддомену: **Generic**

Push / SMS / email за подіями інших контекстів. Без власної бізнес-логіки запису.

**OTP для входу не тут.** Код логіну шле `identity` через порт `OtpSender`. Цей контекст — нагадування про візит, пуш чату тощо.

## Що вже є в коді

- **T-4608 — підтвердження запису**: споживач `scheduling.appointment.booked` → лист/SMS (канал — адмін-налаштування `GET/PUT /admin/settings/booking-confirmation`).
- **T-4422 — сповіщення безпеки**: `identity.session.started` → лист про новий вхід.
- **T-080 — нагадування про візит (SMS)**: `scheduling.appointment.booked` / `.rescheduled` → відкладена рядок outbox `notification.reminder.due` (`availableAt = start − leadMinutes`) → коли релей бачить дозрілий рядок, клієнт отримує SMS. Канал і час у допуску — `GET/PUT /admin/settings/appointment-reminder` (`sms|none`, `leadMinutes`).
- **T-080 — push-канал візиту**: `scheduling.appointment.booked` / `.rescheduled` / `.cancelled` → push на пристрої клієнта (`PushToken` активних сесій). Текст українською, час — Europe/Kyiv. Відписка клієнта (`ClientNotificationPreference.pushEnabled=false`) поважається; провайдер добирається за `PUSH_PROVIDER` (`console` dev / `expo` prod).
- **Релей**: таймер `NOTIFICATIONS_OUTBOX_POLL_MS` (дефолт 15 с, 0 — вимкнути, у тестах вимкнено) + `infrastructure/outbox-routing.ts`, де тип події мапиться на список споживачів; рядок закривається `publishedAt`, коли **всі** споживачі довели справу.
- **Ідемпотентність**: `NotificationRecord.eventId` унікальний — повторна доставка не дублює листа. Ключ споживача іменований (`<eventId>:reminder-schedule`), бо одну подію візиту читають кілька споживачів.

## Листи

Кожен лист — тека `templates/<подія>/` з трьома файлами: `subject.liquid`, `body.txt.liquid`, `body.html.liquid`. Спільна верстка — `templates/layouts/letter.liquid` і `templates/partials/`. Рендер — `infrastructure/liquid-email-renderer.ts` (Liquid; HTML екранується, текст — ні). Дата в Europe/Kyiv, склад рядків і перевірка http(s)-посилань лишаються у view-model (`application/`). SMS і push — не листи, їхні тексти лишаються функціями. Редагування текстів власником — T-4523, не цей рендерер.

### Токени й примітиви (T-4611a/b/c)

- **Кольори, відступи, радіуси, шрифт** — лише з `packages/design-tokens/tokens.json`, нарізка `email.*` (світла тема Paper/Ink; темна тема сайту в листи не заходить). Рендерер інжектує їх у кожен шаблон як `email`, тому в `templates/` немає жодного хекс-коду — це перевіряє `email-template-tokens.spec.ts`.
- **Шрифт** — системний стек (`email.fontStack`). Fixel у листах **не** використовується: Gmail вирізає webfont, Outlook не підтримує. Це зафіксоване правило, не випадковість.
- **Примітиви** — `templates/layouts/letter.liquid` (каркас, preheader, картка) і `templates/partials/` (`text`, `rows`, `button`, `figure`). Новий лист збирається з них; власна таблична сітка в листі — сигнал, що примітива бракує, і його треба розширити тут.
- **Знак бренду** — `logoHtml` (глобальний для рендерера): `lockup-on-milk.svg` з `packages/brand-assets` як data-URI з обов'язковим `alt`; якщо асета немає — текстовий wordmark (`emailLogoWordmark`). Нічний `lockup-on-dark.svg` — хром сайту/адмінки/застосунку (T-4609b/c/d), не лист.
- **Обмеження листа**: таблична сітка, inline-CSS, без `<style>`/`<script>`/зовнішніх ресурсів і медіа-запитів; тексти й атрибути екрануються в контексті. `text`-версія генерується з тих самих даних окремим рендером.
- **Межі**: тексти — T-4523; канали, ретраї, дедуплікація — T-4555. Цей контекст дає їм примітиви й рендер, а не редагує контент і не додає канали.

## Ubiquitous language

- **Notification** — вихідне сповіщення.
- **DeviceToken** — токен пристрою для push.
- **ReviewChannelChoice** — шаблон push після завершення візиту з **двома рівноцінними кнопками**: приватний відгук (`feedback`) і «Оцінити в Google» (GBP-лінк локації, фаза 24). Вибір каналу — клієнта; показ кнопок не залежить від оцінки/статусу відгуку (**без гейтингу** — політика Google, GBP-004).

## Aggregates (план, ще не код)

- `DeviceRegistration`

## Domain events (план)

- `NotificationQueued`
- `NotificationSent`
- `NotificationFailed`

## Порти (план)

- `DeviceRegistrationRepository`
- `PushGateway`
- `SmsGateway`

SMS-канал уже має свій порт — `SmsSender` (`application/booking-confirmation-sms.ts`); у проді це має бути справжній SMS-шлюз, у dev — Mailpit «SMS як email». `PushGateway` лишається планом: без `DeviceToken` push неможливий.

## Хто викликає

Mobile (реєстрація токена), внутрішні handlers інших контекстів.

## Шарність

- `domain/` — Чиста модель. Без Nest, Prisma, HTTP, Expo. Тут entities, value objects, events, repository-порти.
- `application/` — Use cases: command/query, handlers, політики доступу. Транзакція = один use case.
- `infrastructure/` — Адаптери цього контексту (Prisma, HTTP, черга). Зовнішні системи лише через ACL, не в domain.

Код домену не імпортує Nest, Prisma, React Native і HTTP-клієнти. Залежності спрямовані всередину: infrastructure → application → domain.

Публічний API контексту (коли з’явиться код) реекспортує domain + application, **не** infrastructure.
