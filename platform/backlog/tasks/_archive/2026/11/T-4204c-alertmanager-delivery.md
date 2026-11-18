# T-4204c · Alertmanager-доставка алертів (Slice T-4204)

- **Stage**: M5 (phase 30) · **Tags**: infra, devops · **Complexity**: middle · **Depends on**: T-4204b (правила алертів)
- **StoryPoints**: 5

## What
Сервіс `alertmanager` у compose (профіль `obs`, порт 19093) + `infra/alertmanager/alertmanager.yml`: dev-receiver порожній (алерти видно в UI і `/api/v2/alerts`, доставки none), прод-шаблон Slack-доставки — закоментований у конфігу (webhook у секрети). Prometheus: блок `alerting` → `alertmanager:9093` + self-scrape AM.

## Why
Замкнуто ланцюг доставки: правило → Prometheus → Alertmanager. Прод-канал (Slack/PagerDuty) — одна зміна receiver'а, пороги не змінюються.

## Sources
- docs/observability.md (T-4204)
- Google SRE Book (alerting on symptoms)

## Критерії
- [x] `--profile obs` піднімає AM; targets Prometheus: fade-api + alertmanager — up
- [x] Firing-алерти лагу outbox доставлені в AM API (перевірено на живому беклозі)
- [x] README + observability.md оновлені
