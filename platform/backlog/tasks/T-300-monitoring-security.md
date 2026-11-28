# T-300 · Моніторинг, бекапи, секрети, персональні дані

- **Stage**: горизонтальна (постійна) · **Tags**: infra, devops · **Complexity**: senior · **Depends on**: T-002
- **StoryPoints**: 8

## What

Моніторинг помилок і доступності (api/web/admin), алерти; бекапи Postgres з перевіркою відновлення; секрети (OTP-провайдер, еквайринг, Checkbox, AI) — менеджер секретів, не в репо; приватність за ADR 0008/0015 (бакети, ретеншен 12 міс AI-фото, видалення на вимогу), персональні дані — `business/legal-ua/personal-data.md` (дислеймери на вході).

## Sources

- roadmap чеклист v1 (бекапи, моніторинг); ADR 0005/0008/0015; `web-cabinet-screens.md` §1 (дислеймер)

## Done

- [x] Алерти працюють; відновлення з бекапу перевірене
- [x] Секрети не в репо; ретеншени налаштовані

## Risks

- [ ] **Секрети і бекапи**: ротація; відновлення репетирується

## Gate evidence (T-6011)

`agent-gate qa` cannot finish this row: the checklist is operations work on infrastructure that is not
in this repository, so there is no runnable check to put in a plan, and `qaTask` rejects a plan without
`Checks:` before it looks at anything else. The review commit (`review: T-300`) touched only
`infra/OPTIMIZATION_REPORT_devops.md`, so `filesCoveringReview` finds no product file and no test file
either. Blocking dependency: a staging cluster (backups, secret store, alerting) — not code in
`platform/`.
