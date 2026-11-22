# Infra — Docker dev-оточення

Весь стек розробки працює в **Docker** (рішення — ADR 0018): залежності платформи і застосунки (api/web/admin) — у контейнерах. Мобільний не контейнеризуємо — Expo потребує симулятора на хості.

## Сервіси

| Сервіс | Образ | Порти (хост) | Призначення |
|--------|-------|--------------|-------------|
| `postgres` | postgres:16-alpine | 15432 | База даних (система правди) |
| `redis` | redis:7-alpine | 16379 | Кеш / jobs / realtime |
| `minio` | quay.io/minio/minio | 19000 (S3 API), 19001 (консоль) | Об'єкт-сховище — майбутній `media.fade.com.ua` (ADR 0017) |
| `minio-init` | quay.io/minio/mc | — | Одноразово: створює три бакети й ставить їм приватну політику (`mc anonymous set none`), ідемпотентно при кожному `up` |
| `db-seed` | build `infra/api.Dockerfile` | — | One-shot (T-2104): міграції + сід (довідники/записи/клієнти/адмін), ідемпотентно; api стартує лише після його успіху (`service_completed_successfully`) — докладно `docs/seeding.md` |
| `db-init` (prod) | build `infra/api.Dockerfile` (`prod`) | — | One-shot (T-4614b): лише `prisma migrate deploy` + засновник-адмін; жодних демо-довідників. api чекає на його успіх — докладно `docs/seeding.md` |
| `smspit` | axllent/mailpit | 19096 | Дев-SMS-канал (T-4301): OTP-коди як email на `<phone>@sms.dev`, Web UI перегляду; активується `OTP_PROVIDER=mailpit` в `infra/.env.docker` (дефолт — console: код у логах) |
| `api` | build `infra/api.Dockerfile` | 13000 | NestJS API (профіль `apps`) |
| `web` | build `infra/web.Dockerfile` | 13001 | Публічний сайт (профіль `apps`) |
| `admin` | build `infra/admin.Dockerfile` | 13002 | Адмінка (профіль `apps`) |
| `prometheus` | prom/prometheus | 19090 | Метрики і алерти (профіль `obs`, T-4204b): скрейп `/metrics` з api раз на 15s, правила лагу outbox — `infra/prometheus/` |
| `alertmanager` | prom/alertmanager | 19093 | Доставка алертів (профіль `obs`, T-4204c): dev-receiver порожній, Slack-шаблон — `infra/alertmanager/alertmanager.yml` |
| `grafana` | grafana/grafana | 19094 | Дашборди (профіль `obs`, T-4204d): provisioning з `infra/grafana/` — datasource Prometheus + Loki, дашборд «Fade — Overview» з logs-панеллю |
| `loki` | grafana/loki | 19095 | Централізовані логи (профіль `obs`, T-4204e): single-binary, filesystem — `infra/loki/loki.yml` |
| `promtail` | grafana/promtail | — | Хвостить денні логи api зі спільного volume `api_logs`, JSON-pipeline (ts→timestamp, level→label) → Loki — `infra/promtail/promtail.yml` |

Три Dockerfile-и однакові за структурою (Node 20-alpine, `pnpm install`, вихідники) і
мають дві явні стадії (T-4614a): перша, безіменна `dev`, — рецепт для локального
compose, де команду задає `command:`; `prod` — зібраний артефакт (`nest build` /
`next build`), який запускає VPS. Локальний `infra/docker-compose.yml` пінить
`target: dev`, прод-стек — `infra/docker-compose.prod.yml` з `target: prod`.
Прод-стек піднімає `db-init` (схема + засновник), а не dev `db-seed`; демо-дані в прод не потрапляють.
Гейт `pnpm images:check` падає, якщо compose назве Dockerfile без `target` або
прод-стадія запустить dev-команду. Профіль `apps` активний (T-001).

## Швидкий старт

```bash
# З кореня репозиторію platform (або make up / make up-obs — див. LOCALHOST_PORTS.md)
cp infra/.env.docker.example infra/.env.docker   # локальний, не комітиться
cp .env.example .env.local                       # env застосунків (S3_* на localhost)

# Тільки залежності (швидко):
docker compose -f infra/docker-compose.yml --env-file infra/.env.docker --profile deps up -d

# Залежності + застосунки api/web/admin:
docker compose -f infra/docker-compose.yml --env-file infra/.env.docker --profile apps up -d --build

# + Prometheus (T-4204b): http://localhost:19090 (targets, алерти):
docker compose -f infra/docker-compose.yml --env-file infra/.env.docker --profile obs up -d
```

Застосунки монтують увесь каталог платформи з хоста. `node_modules`, кеш Next (`.next`) і `apps/api/dist` лишаються в іменованих томах — це linux-бінарники, їх не можна брати з macOS. При старті `infra/dev-sync.sh` запускає `pnpm install`, якщо змінився `pnpm-lock.yaml`. Нова залежність не потребує перебудови образу; `--build` потрібен лише коли змінюється Dockerfile або базовий Node.

Перевірка: `docker compose -f infra/docker-compose.yml --profile deps ps` — postgres/redis/minio `healthy`, `minio-init` і `db-seed` вийшли з кодом 0 (сід: міграції, локації/послуги/барбери, записи, клієнти, адмін — інвентар і інваріанти в `docs/seeding.md`). З профілем `apps` додатково: http://localhost:13000 (api, поки `404` — немає маршрутів), http://localhost:13001 (web), http://localhost:13002 (admin).

Консоль MinIO: http://localhost:19001 (minioadmin / minioadmin). Бакети створюються автоматично й **приватні** (анонімний доступ вимкнено): `haircut-ai-photos` (ADR 0008), `feedback-photos` (ADR 0015), `media` (магазин і галерея). Перевірка: `mc anonymous get local/<bucket>` → `private`.

Консоль SMS (T-4301): http://localhost:19096 — «SMSPitt» на Mailpit: OTP-коди SMS-каналу видно як листи на `<phone>@sms.dev`. Канал вмикається `OTP_PROVIDER=mailpit` + `MAILPIT_URL=http://smspit:8025` в `infra/.env.docker` (дефолт — `console`: код у логах api). Реальний SMS-провайдер — прод-крок T-4202.

Email-канал (T-4408) пише в той самий Mailpit: `EMAIL_PROVIDER=mailpit` + `EMAIL_URL=http://smspit:8025` (дефолт — `console`); прод — `EMAIL_PROVIDER=smtp` + `SMTP_URL` у секретах (T-4202). Порт `EmailSender` — `apps/api/src/shared/email/`.

## Режими (ADR 0018)

1. **`--profile deps`** — тільки залежності (Postgres, Redis, MinIO + бакети).
2. **`--profile apps`** — додає api/web/admin у контейнерах (Node 20-alpine, образи збираються з кореня монорепо). Хост-порти застосунків: 13000 (api), 13001 (web), 13002 (admin) — лише на `127.0.0.1`.
3. **`--profile obs`** — додає Prometheus + Alertmanager + Grafana + Loki/Promtail (T-4204b/c/d/e): скрейп `/metrics` з api (мережа `fade-platform-net`, `api:13000`), правила алертів лагу outbox, доставка в Alertmanager, дашборди з provisioning, централізовані логи api (спільний volume `api_logs`, JSON-pipeline). UI: http://localhost:19090 (Prometheus), http://localhost:19093 (Alertmanager), http://localhost:19094 (Grafana: admin/admin — dev-дефолт; дашборд «Fade — Overview» у папці Fade, logs-панель — LogQL `{app="api", job="fade-api"}`), http://localhost:19095 (Loki API). Прод-канал (Slack/PagerDuty) — розкоментувати receiver у `infra/alertmanager/alertmanager.yml`, webhook — у секрети; пароль Grafana — `GRAFANA_PASSWORD` у `infra/.env.docker`.

Мобільний (Expo) ніколи не працює в Docker — він стукається в API через `localhost:13000` з хоста (ADR 0018 §2), а Metro слухає `localhost:18081`.

## Конфлікти портів та ізоляція від інших проєктів

Стек не перетинається з іншими проєктами чи локальними сервісами на трьох рівнях:

- **Імена контейнерів** — явні й унікальні: `fade-platform-postgres`, `fade-platform-redis`, `fade-platform-minio`, `fade-platform-minio-init` (+ проєкт `fade-platform`).
- **Мережа** — власна `fade-platform-net`; DNS-імена контейнерів (`postgres`, `redis`, `minio`) діють лише всередині неї.
- **Хост-порти** — нестандартні й прив'язані лише до loopback `127.0.0.1`, тому не слухають на всіх інтерфейсах і не конфліктують з `5432`/`6379`/`9000`/`9001`:
  - Postgres: 15432 (замість 5432)
  - Redis: 16379 (замість 6379)
  - MinIO API: 19000 (замість 9000)
  - MinIO Console: 19001 (замість 9001)
  - Prometheus: 19090 (замість 9090, профіль `obs`)
  - Alertmanager: 19093 (замість 9093, профіль `obs`)
  - Grafana: 19094 (внутрішній 3000, профіль `obs`)
  - Loki: 19095 (замість 3100, профіль `obs`)
  - Застосунки: api 13000, web 13001, admin 13002 (замість 3000–3002, які часто зайняті іншими проєктами)

Усі хост-порти керуються env (`POSTGRES_PORT`, `REDIS_PORT`, `MINIO_API_PORT`, `MINIO_CONSOLE_PORT`; порти застосунків зафіксовані в `command`/`ports` compose і `.env.example`) з відповідними дефолтами. Якщо машина вже щось слухає на цих портах — перевизначте в `infra/.env.docker` (не комітиться) і віддзеркальте порт у `.env.local` на стороні застосунків; внутрішні імена і порти контейнерів не змінюються.

## Дані

Іменовані томи `pg_data`, `redis_data`, `minio_data`, а також томи `node_modules` / pnpm-store / `.next` / `api_dist` пережидають `down`. Повне скидання (наступний старт застосунків знову виконає `pnpm install`):

```bash
docker compose -f infra/docker-compose.yml --env-file infra/.env.docker --profile deps down -v
```

Прод-хостинг — ADR 0051 (редакція 2026-11-11): один VPS GMHost в Україні (UA-VPS-4, 2 vCPU / 4 ГБ / 40 ГБ, близько $10/міс), Docker Compose і Caddy, лише прод. DNS — Cloudflare. Медіа і нічний дамп бази — Cloudflare R2. Стейдж — локальний Docker, доки VPS не тариф на 8 ГБ.
