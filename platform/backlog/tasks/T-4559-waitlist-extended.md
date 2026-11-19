# T-4559 · Waitlist: Expiration, Priority, Client Cancellation, Admin Management, Notifications

- **Stage**: M4 (phase 16-19) · **Tags**: backend, scheduling, crm · **Complexity**: middle · **Depends on**: T-170, T-171, T-4453, T-4555, T-4545
- **StoryPoints**: 8
- **Статус**: review

## What

Extension of waitlist (T-170) into a managed queue:
- **Priority scoring**: queue priority = tenure (free/online priority) + wait time + client history (T-4545) + VIP tier (T-152); tie-break — entry time.
- **Offer expiration**: offer retains `holdExpiresAt`; timer triggers, emits `OfferExpired` → next in queue.
- **Client cancellation**: client cancels wait (mobile/cabinet) → slot release, public offer to next.
- **Fuzzy window re-fit**: `SlotWindow` (ADR 0012) — client picks a time range, system matches a slot within the window.
- **Chain / multiple offers**: cascade offers to multiple clients simultaneously (overbooking-lite with priority).
- **Admin management**: queue list, manual promote/demote, reason, inter-location transfer, history.
- **Notifications**: client «you will be invited at 14:00» with confirmation button (T-4555); barber — «queue updated» (T-084).
- **Analytics**: waitlist conversion → booking, time to fill, step drop-off (T-4563).

## Why

A queue without priorities and offer lifecycle turns into «zombie» slots in the schedule; expiration + client cancellation free up slots automatically.

## Sources

- T-170/171 (waitlist core + surfaces), T-4453 (priorities), ADR 0012 (soft-hold + fuzzy window)
- T-4555 (communications), T-4545 (segmentation/priorities)
- Altegio: prioritized queue, automatic offer closure, client notification

## Done

- [x] Priority scoring: transparent and deterministic, unit tests for edge cases
- [x] Offer lifecycle: timeout triggers `OfferExpired` and next offer
- [x] Client cancellation frees slot immediately
- [x] Admin queue management view and actions

## Реалізація

- `scheduling/domain/waitlist-queue.ts` — розширено без паралельних абстракцій:
  статус `cancelled`, поля `vipTier`/`manualBias`/`history`, вага
  `VIP_TIER_BONUS` (BRONZE 0 · SILVER 2 · GOLD 5 · PLATINUM 8) у
  `priorityScore`; FIFO (`waitingSince`) лишається тай-брейкером.
- `scheduling/domain/waitlist-admin.ts` — життєвий цикл:
  `planOfferCascade` (до 3 одночасних пропозицій з власним soft-hold),
  `expireOffersWithReleases` (+ запис `expired` у журнал),
  `cancelByClient` (звільняє hold, ідемпотентна, заборона для `fulfilled`),
  `applyAdminAction` (promote/demote/pause/resume/transfer з обов'язковою
  причиною й журналом), `selectBestSlot` (найраніший слот у вікні),
  `adminQueueRows` (пріоритет → час очікування).
- `scheduling/application/manage-waitlist.use-case.ts` —
  `ManageWaitlistService` + порт `WaitlistExtendedRepository` (in-memory):
  `register`, `queue`, `adminAction`, `cancel`, `planOffers`,
  `expireAndReoffer` (прострочення → наступний), `bestSlot`, `history`.
- `scheduling/application/admin-waitlist.controller.ts` — `GET
  /admin/waitlist/queue`, `POST entries`, `POST entries/:id/actions`,
  `POST entries/:id/cancel`, `POST offers/cascade`, `POST offers/expire`,
  `POST entries/:id/best-slot`, `GET entries/:id/history`; помилки → 404/400.
- `scheduling/scheduling.module.ts` — контролер, сервіс і провайдер порту.
- `scheduling/domain/waitlist-status.ts` — `cancelled` у підписі статусу.
- `scheduling/application/waitlist-extended.spec.ts` — 16 тестів (політика,
  сервіс, HTTP).

## Нотатки / відкладено

- **Сповіщення** (клієнту «вас запросять о 14:00» + кнопка підтвердження,
  барберу «черга оновилась») — за T-4555/T-084: у цьому слайсі немає
  каналу доставки, лише події й журнал, з яких вони живляться.
- **Аналітика конверсії** (запис після пропозиції, час заповнення, drop-off) —
  T-4563.
- **Персистентність**: таблиці waitlist-заявок у `prisma/schema.prisma` немає
  (T-170 persistence-слайс); порт готовий під Prisma-адаптер, стан in-memory.
- **Таймер/планувальник**: `expireAndReoffer` викликається зовнішнім
  планувальником (ендпоінт приймає `now` для реплею); окремий cron —
  інфраструктурна задача.
- **Адмін-UI** черги (екран «Лист очікування») — frontend-частина картки;
  домен і `GET queue` уже віддають пріоритети й hold-и.
- Пріоритет від історії клієнта (T-4545) зараз читається з `completedVisits`
  заявки; сегментація/мітки підключаються з T-4545.

## Risks

- [x] **Notification delivery failures**: push/SMS fails during offer window — fallback timeout and skip to next client
  — прострочення не блокує чергу: `expireAndReoffer` закриває пропозицію й
  пропонує слот наступному незалежно від доставки
