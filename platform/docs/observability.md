# Observability — базовий рівень і контракт логів

> **Статус:** реальний мінімум, верифікований по фактичному коду (2026-09-24). Не фантом.
> **Зв'язки:** [engineering-principles.md](engineering-principles.md), ADR 0009/0016 (outbox). Повний стек (Loki, Prometheus, OTel, SLO) — предмет **T-4204** на його старті; цей документ фіксує базу, яка вже працює, і правила, які не можна ламати до її розширення.

## 1. Що вже зібрано (джерело правди для T-4204)

- **Логи застосунку**: `DailyFileLogger` (Nest `LoggerService`) — щоденний файл `var/logs/{YYYY}/{MM}/{DD}/api.log`, одна JSON-строка на подію; ротація = зміна каталогу дня (локальний час); `close()` на shutdown. Годинник ін'єктований — у тестах детермінований.
- **Доменні події**: outbox-таблиця (`OutboxMessage`: type, aggregateId, payload, `publishedAt` = час публікації; NULL = pending). Споживачі ідемпотентні (ADR 0009) — повторна доставка не ламає стан.
- **Аудит адмін-дій**: `AdminActionLogger` — окремий денний файл `admin.log`, JSON-рядок `{ts, actor, action, target, ok}`; нові адмін-дії пишуться через нього (патерн каталогу послуг, T-066).
- **Здоров'я процесу**: REST-проби (`/locations/nearest` без координат — швидка перевірка БД і модульного графа; **з 2026-09-25 — `GET /health`** (ADR 0050): статус, uptime, лічильники геокодера — кеш hit/miss, відмови лімітів, надгробок, збої провайдера — і режим сховищ (local/redis) per адаптер); контейнерний рівень — docker healthcheck Postgres.
- **Метрики (з 2026-09-27, T-4204a/b)**: `GET /metrics` — експозиція Prometheus (text/plain; version=0.0.4): процес (uptime, версія Node, RSS), ті самі лічильники геокодера, датчики лагу outbox (`fade_outbox_pending_messages`, `fade_outbox_oldest_pending_seconds`). Prometheus dev-стек — профіль `obs` (порт 19090): скрейп раз на 15s, правила алертів лагу — `infra/prometheus/alerts.yml` (пороги ідентичні /health warning).
- **Алерти (з 2026-09-27, T-4204c)**: Prometheus → Alertmanager (профіль `obs`, порт 19093). Dev-receiver порожній — алерти видно в UI/API; прод-канал (Slack/PagerDuty) — receiver у `infra/alertmanager/alertmanager.yml`, webhook у секрети. Пороги алертів = пороги warning /health — міняти тільки парно.
- **Дашборди (з 2026-09-27, T-4204d)**: Grafana (профіль `obs`, порт 19094) з provisioning — datasource Prometheus (uid `prometheus-fade`) і дашборд «Fade — Overview» (`infra/grafana/dashboards/fade-overview.json`): лаг outbox з пороговими зонами 50/60s, лічильники геокодера (increase за 5m), процес (uptime, RSS). Нові дашборди — JSON у `infra/grafana/dashboards/`, оновлення на льоту (updateIntervalSeconds: 30).
- **RUM Core Web Vitals (з 2026-11-10, T-4204)**: браузерний збирач у `apps/web` (`lib/rum.ts`, `web-vitals` — LCP/CLS/INP/FCP/TTFB) шле семпл `{name, rating}` через `sendBeacon` (фолбек — keepalive-`fetch`) на `POST /telemetry/web-vitals`; rewrite тримає той самий origin, тож CORS не потрібен. Сервер — лічильники `fade_web_vitals_samples_total{metric,rating}` у `/metrics` (кардинальність фіксована: 5 метрик × 3 рейтинги, значення з клієнта не стає лейблом). **PII немає:** ні id, ні шляху, ні значення; DNT=`1` і Global Privacy Control вимикають збір; семплінг — `NEXT_PUBLIC_RUM_SAMPLE_RATE` (0..1, дефолт 1). Маяки свідомо **поза SLI**: `/telemetry/*` не рахується в `fade_http_requests_total`, інакше availability надувалась би (як від `/metrics`/`/health`).
- **Централізовані логи (з 2026-09-27, T-4204e)**: Loki (порт 19095) + Promtail у профілі `obs`. Контейнер api пише ті самі денні файли у спільний volume `api_logs`; promtail хвостить `/var/log/fade/{YYYY}/{MM}/{DD}/api.log`, парсить JSON-контракт §2 (timestamp з `ts`, label `level`), штовхає в Loki (`{app="api", job="fade-api"}`). У Grafana — datasource Loki (uid `loki-fade`) і logs-панель на дашборді; розбір полів у LogQL — `| json | line_format "{{.level}} [{{.ctx}}] {{.msg}}"`. Retention — прод-крок (30d hot / 1y cold).

## 2. Контракт JSON-рядка лога (не змінювати без T-4204)

```json
{"ts":"2026-09-24T10:00:00.000Z","level":"INFO","ctx":"App","src":"…","msg":"…"}
```

- `level`: `INFO | WARN | ERROR | DEBUG | VERBOSE | FATAL`; ASCII-only вміст.
- `error(message, stack, ctx)` — Nest-сигнатура: стек іде в `msg`. Пиши структуровано: повідомлення — що сталося, `src` — хто.
- **Заборонено в логах**: координати клієнтів, OTP-коди, токени, паролі, повні тіла запитів (див. security-hardening.md §2).

## 3. Runbook: OutboxRelayBacklog / OutboxOldestPendingTooOld (T-4204, оновлено 2026-09-29)

**Коли горить.** `OutboxRelayBacklog` — `fade_outbox_pending_messages > 50` протягом 5m; `OutboxOldestPendingTooOld` — `fade_outbox_oldest_pending_seconds > 60` протягом 5m; обидва `severity: warning`, правила — `infra/prometheus/alerts.yml`. Дивитись: Prometheus → http://localhost:19090/alerts, Alertmanager API → http://localhost:19093/api/v2/alerts. Пороги 50/60s збігаються з warning `/health` — міняти тільки парно (health-контриб'ютор + exposition + alerts.yml).

**Хто такий «реле» (стан 2026-09).** Спільного релея ще немає (T-042 слайс 1): pending закриває `OutboxNotificationsDispatcher` — опитування кожні `NOTIFICATIONS_OUTBOX_POLL_MS` (15s), batch 25, **лише тип `scheduling.appointment.booked`**, маркер `publishedAt` на подію; споживач — `SendBookingConfirmation` (лист підтвердження, журнал `NotificationRecord` = ідемпотентність). Кроки нижче від цього не залежать; при переїзді на спільний релей міняється лише цей абзац.

### Крок 0 — підтвердити лаг живий (~30 с)

```bash
curl -s localhost:13000/health | jq .outbox   # pending, oldestPendingMs, warning
curl -s localhost:13000/metrics | grep fade_outbox
```

Тренд — Grafana «Fade — Overview» (панель outbox, порогові зони 50/60s): backlog росте чи стоїть плато? Скрейп 15s — дивись 2–3 точки, а не одну.

### Крок 1 — реле взагалі живе?

- `fade_uptime_seconds` (Prometheus, :19090) — скидався? Crash-loop видно як пил значень. PromQL: `changes(fade_uptime_seconds[30m]) > 2` — багато рестартів.
- Loki: `{app="api", job="fade-api"} | json | level="ERROR"` за 30 хв.
- ⚠️ Падіння тіка диспетчера сьогодні йде в **stdout через `console.error`** («[notifications] outbox poll failed: …») — це НЕ JSON-рядок контракту §2, у api.log/Loki його **немає**: `docker logs fade-platform-api 2>&1 | grep 'outbox poll failed'`. (Перевести на Nest Logger — дрібний фікс; до того часу — тільки docker logs.)

### Крок 2 — класифікувати за формою кривої

- **Плато ≤25 при зростанні oldest** → тик живий, але batch зривається: перший же send падає і перериває прохід (head-of-line: падіння send прокидається крізь `pollOnce`). Лікується фіксом email-каналу (крок 3–4), не релея.
- **Монотонний ріст pending** → тик вимкнений/сповільнений: `docker exec fade-platform-api env | grep NOTIFICATIONS_OUTBOX_POLL_MS` — значення `0` вимикає автостарт (класика: «backlog росте, ERROR ніде»); `NODE_ENV=test` теж вимикає.
- **Старі події типу ≠ `booked` + свіжі processed** → цей тип ніхто не підхоплює (сьогодні обробляється лише `booked`) — SQL нижче покаже розріз.

### Крок 3 — SQL-розріз (`docker exec -it fade-platform-postgres psql -U barbershop -d barbershop`)

```sql
-- Хто займає backlog: типи, кількість, вік найстаршої.
SELECT type, count(*) AS pending, min("createdAt") AS oldest
FROM "OutboxMessage" WHERE "publishedAt" IS NULL
GROUP BY type ORDER BY pending DESC;

-- Найстаріші «застряглі» події.
SELECT id, type, "createdAt" FROM "OutboxMessage"
WHERE "publishedAt" IS NULL ORDER BY "createdAt" ASC LIMIT 5;

-- Журнал споживача: sent/skipped; падіння send рядка НЕ пише (подія лишається pending).
SELECT status, count(*) FROM "NotificationRecord" GROUP BY status;
SELECT "sentAt", status, recipient, detail FROM "NotificationRecord" ORDER BY "sentAt" DESC LIMIT 10;
```

Ручний «ретрай» через `UPDATE "OutboxMessage" SET "publishedAt" = now()` — **заборонено**: маркер без обробки = подія втрачена для споживача. Правильний шлях: полагодити send — наступний тик (≤15s) обробить сам; ідемпотентність тримає журнал, повторна доставка безпечна (ADR 0009).

### Крок 4 — БД-пул, хотспоти і отруйна подія

**Пул з'єднань.** Loki: `{app="api", job="fade-api"} | json | level="ERROR" | msg =~ "(?i)pool|timeout|connection"` → насичення пулу (`connection_limit` у DATABASE_URL) — диспетчер не отримує з'єднань. Хто тримає з'єднання зараз:

```sql
SELECT left(query, 70) AS query, state, count(*)
FROM pg_stat_activity WHERE usename = 'barbershop' AND query <> ''
GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 8;   -- idle-in-transaction = підозрюваний

SELECT pid, mode, CASE WHEN granted THEN 'granted' ELSE 'WAITING' END
FROM pg_locks WHERE NOT granted;          -- черги блокувань (порожня — не ланки)
```

**Хотспот таблиці outbox.** Опитувальник вибирає `WHERE type = … AND "publishedAt" IS NULL ORDER BY "createdAt"` — без індексу це повний скан на кожен тік:

```sql
SELECT relname, seq_scan, seq_tup_read FROM pg_stat_user_tables WHERE relname = 'OutboxMessage';
```

`seq_scan` росте пропорційно тіках при малому pending → скан стає домінуючим при зростанні таблиці; лікується частковим індексом `ON (type, "createdAt") WHERE "publishedAt" IS NULL` (кандидат на міграцію, 2026-09-29: 14.9k seq_scan у dev).

**Отруйна подія (head-of-line).** Одна подія, на якій споживач падає завжди, зриває кожен тік (перериває прохід до решти). Ознака: найстаріша pending набагато старша за найсвіжішу оброблену, а журнал споживача не росте:

```sql
SELECT (SELECT min("createdAt") FROM "OutboxMessage" WHERE "publishedAt" IS NULL) AS oldest_pending,
       (SELECT max("publishedAt") FROM "OutboxMessage") AS newest_processed,
       (SELECT count(*) FROM "NotificationRecord") AS journal_rows;
```

Розрив хвилинами+ при живому трафіку → витягти найстарішу подію (крок 3) і відтворити споживача локально на її payload. Ручне `UPDATE publishedAt` на отруйну подію — теж заборонено (крок 3): це приховує збій, а не лікує.

**Кореляція з трейсом**: з рядка лога (поле `TraceID`, promtail `derived_fields`) стрибок у Tempo — спани `outbox.handle` покажуть, що саме довго: SQL чи send.

### Крок 5 — свідома відмова, не збій

`skipped` у журналі = в локації немає email (detail це каже): подія закривається, pending НЕ росте. Зростання skipped — сигнал даних/сіду, а не лагу реле.

### Відомий стан dev (не інцидент)

У dev-стеку постійно горить **тільки** `OutboxOldestPendingTooOld` (не `OutboxRelayBacklog`): усі pending — типи `identity.*` (otp.requested, session.started, phone.verified, …), споживачів для них ще немає — прийдуть разом зі спільним релеєм (T-042 слайс 1). Це чесний сигнал реального боргу, не збій: `booked`-події диспетчер дренує (журнал: sent+skipped), отже канал notifications живий. Що перевірити, щоб відрізнити від нового збою: SQL-розріз — якщо весь backlog ненульовий лише по типах без споживачів, а свіжі `booked` закриваються — це фон, а не інцидент. Два алерти свідомо ловлять різні відмови: вік (відмова «тип не обробляється» горить і при pending 34 < 50) і обсяг (шторм подій).

### Вихід із інциденту

Після усунення причини дренаж швидкий: batch 25 × тик 15s ≈ 100 подій/хв (backlog 500 ≈ 5 хв). Алерти гаснуть самі (`for: 5m`), панель у Grafana повертається в зелену зону.

**Ескалація:** pending >500 або oldest >10 хв — інцидент за DR-планом (T-3603). Записи клієнтів не страждають: реле асинхронний (ADR 0009), затримуються лише споживачі подій (листи).

## 4. Правила поведінки при відмовах (спостережуваність без алертів)

- Зовнішня залежність недоступна → **деградація + лог WARN/ERROR**, не падіння ендпоінта: геокодер → null (список локацій живе), провайдер оплати → помилка користувачу з кодом (деталі — в логах).
- 500 не мовчать: exception-фільтри логують стек перед відповіддю (прецедент: `[locations] internal error:`).
- Повтори зовнішніх викликів обмежені (rate limit, tombstone у `CachedRateLimitedGeocoder`) — «довбання» недоступного сервісу = антипатерн.

## 5. Мінімум для кожної нової задачі

1. Помилки домену → HTTP-коди через мапер контексту; 500-шлях логується.
2. Зміни стану, важливі для бізнесу, — через outbox-події (не прямі виклики сусіднього контексту).
3. Адмін-дія → запис в audit-лог.
4. Новий cron/фонова задача → журналює старт/успіх/невдачу, ідемпотентна при повторі.

## 6. Що свідомо НЕ тут (поза межами T-4204)

Централізований збір логів — **done у dev (T-4204e, 2026-09-27)**; **трейсинг — done у dev (T-4204f, 2026-09-28)**: OTel NodeSDK (auto-instrumentations: http/express/nestjs/ioredis) найпершим імпортом api → OTLP/HTTP → OTel Collector → Tempo (dev, obs-профіль, UI через Grafana Explore datasource `tempo-fade`); JSON-логи несуть `traceId`/`spanId` активного спана (§2-контракт розширено, promtail `derived_fields` лінкує лог → трейс); W3C TraceContext — дефолт пропагатора. **Доменні спани — done у dev (2026-09-29)**: booking-флоу (`booking.book`, `outbox.append`) через `shared/tracing/tracing.ts` (withSpan-обгортка) і **outbox-релей як джерело спанів** — `outbox.poll`/`outbox.handle` у диспетчері notifications; карірування продюсер→релей — W3C `traceparent` у payload події (inject при append, extract при handle): обробка події стає нащадком `outbox.append` у **тому самому трейсі**, що й HTTP-запис, який її породив (перевірено живим прогоном: POST /admin/bookings → … → outbox.handle → POST Mailpit — один traceId у Tempo). W3C-заголовок парситься у 3 групи регексу (version без групи — регрес-спека). Прод-семплінг (head 10% / tail 100% помилок), профілювання, прод-retention логів — далі по T-4204. **RUM — done у dev (2026-11-10):** web-vitals → `POST /telemetry/web-vitals` → `fade_web_vitals_samples_total{metric,rating}` (§1), DNT/GPC і семплінг у клієнті; session replay свідомо не робимо до окремого рішення про згоду (записує DOM і введення). **SLO/error budget — done у dev (2026-09-29):** перші два SLO (availability 99.5%, booking latency 95%/500мс) з error budget і multiwindow burn rate — визначення та раціонал у [slo.md](slo.md), дашборд `fade-slo`, алерти групи `slo-burn-rate`.

**Правила алертів у репозиторії (T-6011a).** `infra/prometheus/alerts.yml` тримає три групи: `outbox-lag`, `slo-burn-rate` і `apps` (недоступність будь-якої fade-цілі, >5% 5xx в api, >25% `poor` LCP у web). Валідатор `./infra/prometheus/check-alerts.sh` парсить YAML і валить складання, якщо в алерта немає `expr`, `for` або `severity`; прогін: `./infra/prometheus/check-alerts.sh` → `check-alerts: OK (9 alerts …)`.
