# T-4462 · Сповіщення подій лояльності

- **Stage**: M4 (phase 8) · **Tags**: backend, loyalty, notifications · **Complexity**: junior · **Depends on**: T-141, T-080
- **StoryPoints**: 3
- **Статус**: review

## What

Пуш/сповіщення на кожну значущу подію лояльності: нараховано бали (після візиту), досягнуто рівня, скоро згорить (за 7 днів), використано бали. Конфігурація каналу (T-4431) і «не спамити» (дедуп + тихі години). Читаємо дані подій баланису (T-141).

## Why

Бали без сповіщення відчуваються як «вигадані»; push на кожне нарахування посилює програму (T-140 мета: утримання).

## Sources

- loyalty README; notifications README; T-141, T-080; LYL-* (AC подій)

## Done

- [x] Сповіщення на 4 події лояльності (канал конфігурується)
- [x] Дедуп і тихі години; «відписатися від лояльності» працює
- [x] Юніт-тест на ліми і тайм-аут згорання

## Реалізація

- `loyalty/application/loyalty-notification-policy.ts` — чиста політика:
  `buildLoyaltyIntent` (усі 4 події), `expiryWarningIntent` (7 днів до кінця
  строку життя балів, 365 днів від останньої активності), `isQuietHour`,
  `startOfAllowedSendWindow` (Europe/Kyiv, 21:00–09:00), `localDayKey`,
  `planLoyaltyNotifications` (дедуп, вимкнений канал, добовий ліміт
  `maxPerDay = 1` → батч) і `applyPlanToLog`/`takeDigest`.
- `loyalty/application/loyalty-notifications.ts` — `LoyaltyNotificationDispatcher`
  з портами `LoyaltyNotificationGateway` (sms/push) і
  `LoyaltyNotificationPreferences.isSubscribed` (відписка блокує все).
  Відкладені через тихі години сповіщення чекають `flushDeferred`, надлімітні
  збираються в один дайджест (`flushDigest`).
- `notifications/application/sms-messages.ts` — 4 тексти подій + дайджест,
  у межах `SMS_LENGTH_LIMIT`.
- `loyalty/application/loyalty-notifications.spec.ts` — 10 тестів.

## Нотатки

- Канал за замовчуванням: `points_earned`/`tier_reached` — push,
  `points_spent` — вимкнено (шум), `points_expiring` — SMS. Конфіг передається
  в конструктор диспетчера, тож адмін-налаштування (T-4431) підключаються без
  зміни логіки.
- Стан логу (дедуп, добові лічильники, батчі) — in-memory; durable-версія
  потребує таблиці сповіщень і планувальника, яких у репозиторії ще немає.
- Планувальник (cron/outbox relay) не входить у цей слайс: диспетчер
  викликається з наявного контуру подій і повертає все, що треба відправити.

## Risks

- [x] **Спам**: 3 події за день → батч-пуш (правило макс. 1/день на клієнта)
