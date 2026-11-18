# Аналітика (`analytics`)

> Тип піддомену: **Supporting (read-model)**

KPI-дашборд засновника: виручка за день, завантаженість крісла, середній чек, no-show, скасування, конверсія запису, повторний запис, виручка на годину крісла, злив через знижки. **Не джерело правди** — проєкції на подіях інших контекстів. **Жорстка вимога v1** (див. `docs/roadmap.md`, фаза 14).

Приймальні критерії: `docs/acceptance-criteria/08-analytics-dashboard.md`.

## Ubiquitous language

- **RevenuePerDay** — виручка за день (Σ `PaymentCaptured`).
- **ChairOccupancy** — завершені хвилини / доступні хвилини крісла.
- **AvgTicket** — виручка / завершені візити.
- **NoShowRate** — no-show / усі заброньовані.
- **ConversionRate** — завершені / підтверджені записи.
- **DiscountLeakage** — Σ `AppliedDiscounts` + вартість безкоштовних візитів; грн і % від Σ `AgreedPrice`.
- **CancellationRate** — скасовані / усі заброньовані (`AppointmentCancelled`; `Reschedule` не входить) — ANL-008.
- **RepeatBookingRate** — на момент `AppointmentCompleted` у того самого клієнта є запис зі стартом пізніше за кінець цього візиту / завершені візити — ANL-009. Рахується з стану `scheduling` у момент завершення, окремої події «записали наступний» немає.
- **ChairHourRevenue** — Σ `PaymentCaptured` / доступні години крісла (знаменник `ChairOccupancy` у годинах), грн/год — ANL-010.
- **CertificateLiability** — сума непогашених залишків сертифікатів (передоплати на балансі) — GFT-ADM-05.
- **CertificateBreakage** — прострочені невикористані залишки (фактична маржа) — GFT-ADM-05.
- **ReferralFunnel** — воронка «кліки посилань → реєстрації з `ReferredBy` → завершені візити» referral vs органіка; LTV referral-клієнтів (RFR-ADM-04, ADR 0014).
- **CampaignRoi** — ефективність win-back-кампаній (фаза 18): конверсія кампанії (використання коду / відправлено push, WNB-ADM-04) і виручка з кампаніних кодів; зв'язка з «зливом через знижки» (ANL-006) — ROI кампанії видно, а не лише факт відправки. Відправки — з `crm.CampaignSent`, використання — зі звичайного `AppliedDiscounts` кампаніного коду (WNB-007).
- **WaitlistEfficiency** — ефективність черги (фаза 17, WTL-ADM-04): розмір черг по конфігураціях, конверсія пропозицій (прийняв / пропустив / прострочив), слоти, заповнені через waitlist; джерело — події черги `scheduling` (ADR 0012).

## Модель (план, ще не код)

- Read-models (проєкції): `DailyRevenue`, `ChairOccupancyStats`, `ClientConversionStats`, `CancellationStats`, `RepeatBookingStats`, `ChairHourRevenueStats`, `DiscountLeakageStats` — будуються подієвими handler'ами ідемпотентно (патерн ADR 0009).
- Немає агрегатів-джерел правди; запити дашборда читають проєкції.

## Вхідні події (план)

- `scheduling.AppointmentCompleted`, `AppointmentNoShowed`, `AppointmentCancelled`, `AppointmentBooked` (для знаменників). `RepeatBookingRate` на `AppointmentCompleted` перевіряє, чи в `scheduling` уже є майбутній запис того самого клієнта
- `billing.PaymentCaptured`
- `loyalty.FreeVisitUsed` (вартість безкоштовного візиту — з `AgreedPrice` візиту)
- `discounts.DiscountApplied` (або читає `AppliedDiscounts` із візиту)
- `gift-certificates.GiftCertificateSold` / `CertificateRedeemed` / `GiftCertificateExpired` (зобов'язання і breakage — GFT-ADM-05, ADR 0013)
- `crm.CampaignSent` (відправки win-back-кампаній — знаменник конверсії кампанії, WNB-ADM-04; використання рахується зі звичайного `discounts.DiscountApplied` кампаніного коду)
- `scheduling.SlotOffered` / `SlotOfferDeclined` / `SlotOfferExpired` / `SlotFilledFromWaitlist` (конверсія пропозицій черги і заповнені слоти — WTL-ADM-04, ADR 0012)

## Хто викликає

- Admin: дашборд «Аналітика» (фільтри, KPI, графіки). Інші ролі — ні (барбер не бачить фінанси мережі).

## Шарність

- `domain/` — Чиста модель. Без Nest, Prisma, HTTP, Expo. Тут entities, value objects, events, repository-порти.
- `application/` — Use cases: command/query, handlers, політики доступу. Транзакція = один use case.
- `infrastructure/` — Адаптери цього контексту (Prisma, HTTP, черга).

Код домену не імпортує Nest, Prisma, React Native і HTTP-клієнти. Залежності спрямовані всередину: infrastructure → application → domain.

Публічний API контексту (коли з'явиться код) реекспортує domain + application, **не** infrastructure.

## Дашборд запуску (T-4439)

`GET /admin/analytics/launch?days=7` — таблиці перших днів після відкриття CLT-01.

| Таблиця | Джерело |
|---------|---------|
| Локації онлайн | `Location.active` (снапшот, не вікно) |
| Створені клієнти | `ClientProfile.createdAt` у вікні |
| Дзвінки/записи | `AppointmentParty.createdAt` — запис створює партію |
| No-show | `Booking.status = 'no_show'` за `start` у вікні |
| Оплати | подія outbox `billing.payment.captured` |
| Чеки | подія outbox `billing.receipt.issued` |
| Доставка SMS/push | `NotificationRecord` (channel/status): `sent` — доставлено, `skipped` — спроба без одержувача, `failed` у спроби не входить |
| Помилки ендпоінтів | `HttpMetrics` (in-process SLI, T-4204): 5xx / усі запити |

**Гейти** (`domain/launch-dashboard.ts`): доставка ≥ 95 %, частка 5xx < 3 %. Обидва повертаються в тілі відповіді з `ok`, щоб адмінка не рахувала пороги вдруге. Гейт не замінює денний алерт T-4204: API може бути чистим, поки канал мовчить.

**Runbook «з нуля»**: (1) `pnpm --filter api db:migrate` — таблиці вже є, нових міграцій задача не додає; (2) підняти API з `METRICS_ENABLED`, щоб `HttpMetrics` лічив 5xx (без middleware гейт 5xx показує 0 — дивіться на `/metrics`); (3) перевірити, що outbox-релей публікує `billing.payment.captured` і `billing.receipt.issued` — інакше колонки грошей і чеків будуть нульовими; (4) `curl -b <admin session> /admin/analytics/launch` — очікуємо `gates.ok` і ненульові `locationsOnline`; (5) якщо `delivery.value = 1` при нулі спроб — це «немає даних», а не «все доставлено»: дивіться `smsAttempted`/`pushAttempted`.
## Серверна аналітика Amplitude (T-4587)

Клієнтські події губить AdBlock/ITP/вбитий застосунок, тому критичні події
форвардяться з сервера.

- **Черга**: `AmplitudeOutbox` (унікальний `sourceEventId`) наповнюється з
  `OutboxMessage` за 24 год вікном; повторний перенос ідемпотентний.
- **Мапа**: `domain/amplitude-events.ts` — domain type → Amplitude event
  (`booking_confirmed`, `payment_captured`, …); невідомі типи ігноруються.
  `insert_id = ${event}_${aggregateId}_${timestamp}` — збігається з клієнтським
  для дедупку; `user_id` береться з `payload.clientId`.
- **PII**: `sanitizePayload` вирізає phone/email/name/address/comment/note і
  рядки, схожі на контакти; назовні йдуть лише UUID.
- **Доставка**: `ForwardAnalyticsEvents` шле батч ≤100 у Batch API; збій →
  retry 1 хв / 5 хв / 15 хв / 1 год / 6 год, далі `dead_letter` + аудит-лог
  `{scope:'amplitude', status, attempts, eventId}`.
- **Воркер**: `AnalyticsForwardingWorker` — інтервал `ANALYTICS_FORWARD_POLL_MS`
  (дефолт 30 000, 0 — вимкнути), стартує лише з `AMPLITUDE_API_KEY`; у тестах
  автостарт вимкнено.
- **Runbook**: (1) `pnpm --filter api db:migrate` (таблиця нова);
  (2) задати `AMPLITUDE_API_KEY` (Batch API key, не write key клієнта) —
  без нього воркер логує «forwarding is off»; (3) перевірити `/metrics` і
  логи `AnalyticsForwarding` після першої оплати/завершеного візиту;
  (4) `dead_letter` дивитись `SELECT id, eventName, lastError FROM
  "AmplitudeOutbox" WHERE status = 'dead_letter'`.
