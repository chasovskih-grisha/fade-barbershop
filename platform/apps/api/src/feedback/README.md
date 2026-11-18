# Відгуки (`feedback`)

> Тип піддомену: **Supporting**

Відгуки клієнтів про завершені візити: оцінка, текст, опційні фото. Право на відгук з'являється з події `scheduling.AppointmentCompleted`; публікація на сайті — окрема фіча (фаза 25, PUB-*): згода клієнта + модерація адміна (default-deny) + глобальний перемикач; редагування опублікованого знімає його з сайту назад у модерацію.

Фото відгуку — персональні дані: приватний об'єктний бакет **окремий від `haircut-ai`**, short-lived signed URLs, доступ за ACL (власник відгуку, барбер візиту, адмін). Життєвий цикл фото = життєвий цикл відгуку (без власного ретеншену); публічна проєкція (фаза 25) — копія в `content`, не посилання на приватний бакет. **ADR 0015** (патерн — ADR 0008). Вікно подання — **ADR 0016**: `FeedbackWindow` за подією `scheduling.AppointmentCompleted`, ідемпотентна підписка (патерн — ADR 0009). Приймальні критерії: `docs/acceptance-criteria/06-feedback-reviews.md`.

## Ubiquitous language

- **Feedback** — відгук клієнта про завершений візит (оцінка, текст, фото).
- **Rating** — оцінка 1–5 зірок, обов'язкова.
- **FeedbackPhoto** — фото до відгуку (до 3 шт., опційно).
- **PublicationLifecycle** — стани публікації відгуку: `private → pending_review → published / rejected`; згода клієнта відкликається миттєвим зняттям (критерії `21-public-reviews.md`, PUB-002/003).
- **FeedbackWindow** — матеріалізоване вікно подання на завершений візит: один на `AppointmentId`, `windowEndsAt` (снепшот конфігу на момент відкриття), статус `open | submitted | expired | closed`; створюється підпискою на `AppointmentCompleted` — ADR 0016.

## Aggregates (план, ще не код)

- `Feedback`
- `FeedbackWindow` (ADR 0016)

## Domain events (план)

- `FeedbackWindowOpened` (реакція на `scheduling.AppointmentCompleted` — планує push «Як пройшов візит?» через `notifications`, фаза 24: шаблон `ReviewChannelChoice`)
- `FeedbackSubmitted`
- `FeedbackUpdated`
- `FeedbackDeleted` (модерація/видалення клієнтом)
- `FeedbackPublished` (лише якщо публікація на сайті ввімкнена)

## Порти (план)

- `FeedbackRepository`
- `PhotoRepository` (object storage, не Postgres; правила — ADR 0015)

## Хто викликає

- Вхідні події: `scheduling.AppointmentCompleted` (створює `FeedbackWindow`; ідемпотентно за `AppointmentId`, повторна доставка ігнорується — ADR 0016)
- Web / mobile (клієнт): подання, редагування, видалення
- Mobile (барбер): читання відгуків на свої візити
- Admin: список, фільтри, модерація, статистика

## Шарність

- `domain/` — Чиста модель. Без Nest, Prisma, HTTP, Expo. Тут entities, value objects, events, repository-порти.
- `application/` — Use cases: command/query, handlers, політики доступу. Транзакція = один use case.
- `infrastructure/` — Адаптери цього контексту (Prisma, HTTP, черга).

Код домену не імпортує Nest, Prisma, React Native і HTTP-клієнти. Залежності спрямовані всередину: infrastructure → application → domain.

Публічний API контексту (коли з'явиться код) реекспортує domain + application, **не** infrastructure.