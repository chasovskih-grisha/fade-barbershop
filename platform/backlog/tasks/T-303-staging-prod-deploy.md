# T-303 · Staging і прод: деплой, домени, SSL, пошта

- **Stage**: горизонтальна (винесено з T-002; фінальні кроки) · **Tags**: infra, devops · **Complexity**: senior · **Depends on**: T-002 (dev-infra + CI), T-300 (секрети/бекапи), T-4531 (staging-гейт), ADR 0051 (хостинг — вирішено), ADR 0052 (гілки автодеплою — вирішено)
- **StoryPoints**: 8

## What

- Рішення про провайдера хостингу/DNS — **ADR 0051** (редакція 2026-11-11): один VPS GMHost в Україні, тариф UA-VPS-4 (2 vCPU / 4 ГБ / 40 ГБ, близько $10/міс), Docker Compose і Caddy, лише прод. DNS — Cloudflare. Медіа і нічний дамп бази — Cloudflare R2 (друга географія). Віддалений стейдж (T-4531) — коли VPS стане тарифом на 8 ГБ. Доти стейдж — локальний Docker.
- Staging і прод: розгортання api/web/admin, керування секретами поза репо, контрольовані міграції DB.
- Домени за **ADR 0017** (`fade.com.ua`, `book.`, `admin.`, `api.`, `shop.`, `media.`) — DNS, SSL, пошта мережі.
- CORS-allowlist для прод-origin (`docs/architecture.md` §CORS; `CORS_ALLOWED_ORIGINS`).
- Деплой за **ADR 0052**: push у `stage` ганяє CI і не викладає віддалений хост; Release PR `stage` → `main` (merge commit) викладає прод. GitHub Actions по SSH піднімає Docker Compose на VPS. Секрети — у GitHub Environment `production`, не в git. Міграції — на старті api. `deploy.yml` ще кличе Coolify; заміна на SSH — T-4614c.

## Why

Чеклист v1: «Домен, SSL, пошта мережі». Dev повністю в Docker (ADR 0018); прод розгортається на фінальних кроках, коли функції стабільні — не блокуючи M0–M3.

## Sources

- `docs/roadmap.md` чеклист v1 (phase 0); ADR 0017 (домени/SSL), ADR 0018 (dev-оточення), ADR 0051 (хостинг), ADR 0052 (гілки автодеплою); `docs/architecture.md` §CORS
- Залишок T-002 (деплой-пайплайн, домени/SSL)

## Done

- [x] Рішення про провайдера хостингу/DNS зафіксовано (ADR 0051, редакція 2026-11-11: GMHost UA-VPS-4 в Україні, Compose + Caddy, Cloudflare DNS, R2)
- [x] Потік деплою зафіксовано (ADR 0052, 2026-09-29: `stage` → стейдж, `main` → прод, автодеплой на push)
- [ ] Віддалений стейдж — після тарифу GMHost на 8 ГБ (T-4531). Доти гейт перед Release PR — локальний Docker
- [ ] Прод розгорнуто за доменами ADR 0017; SSL валідний; пошта мережі працює
- [ ] Секрети керуються поза репо; міграції застосовуються з backfill/відкатом (T-300)
- [ ] Push у `main` по SSH піднімає Compose (api, web, admin, Postgres, Redis, Caddy) на GMHost VPS (ADR 0052). `deploy.yml` більше не кличе Coolify

## Risks

- [ ] **Секрети**: прод-ключі (Checkbox, еквайринг, S3, DB) не потрапляють у репо/логи
- [ ] **Міграції на проді**: невідкатна зміна схеми — план backfill і dry-run на staging

## Status

- Створено 2026-09-21 — винесено з T-002 за рішенням засновника: staging/прод і домени/SSL налаштовуються на фінальних кроках, не блокують M0.
- 2026-09-28: перший пункт Done закрито (провайдер — ADR 0051). Решта пунктів розгортання — це робота T-300/T-4531 (секрети, бекапи, staging-гейт), тому статус у індексі лишається `todo`: жоден стенд ще не розгорнуто, DNS/SSL/пошта не налаштовані.
- 2026-09-29: потік деплою закрито (ADR 0052). Стенди як і раніше не розгорнуті.
- 2026-11-11: провайдер переглянуто (ADR 0051). Замість Hetzner + Coolify — GMHost UA-VPS-4 в Україні, Compose і Caddy, лише прод. Віддалений стейдж відкладено до тарифу на 8 ГБ.
- 2026-11-24: аудит повернув задачу в `in_progress`. Індекс помилково мав `done`, хоча жоден стенд не розгорнуто, DNS/SSL/пошта не налаштовані, а чотири Done-пункти відкриті. Відкритими лишаються віддалений стейдж/T-4531, прод-розгортання, секрети й SSH-деплой замість Coolify.

## Implementation plan

Paths:
- infra/docker-compose.yml
- infra/prometheus/prometheus.yml

Checks:
- docker compose -f infra/docker-compose.yml config

## Implementation notes

- infra/prometheus/prometheus.yml

## QA

- `docker compose -f infra/docker-compose.yml config` exit 0
