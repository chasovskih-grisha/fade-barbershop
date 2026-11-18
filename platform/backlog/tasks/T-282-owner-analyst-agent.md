# T-282 · Owner/Analyst Agent

- **Stage**: M7 (phase 28) · **Tags**: backend, experimental · **Complexity**: senior · **Depends on**: T-280, T-3200 (business reports)
- **StoryPoints**: 8

## What

Founder's assistant: natural-language questions about KPIs (chair utilization, revenue, no-show rate, conversion) — **read-only** via `analytics` (OHS read-model, ANL-*), agent never changes data. Periodic reports (daily/weekly) on events + schedule, delivery through the same channel as notifications; frequency and format — admin configuration. Admin: daily limits, `AgentLog` log, enable/disable.

## Why

Founders need answers without opening reports and SQL. Conversational analytics uncovers bottlenecks.

## Sources

- AC `24-assistants.md` (ASSIST-ADM-01/02/03), analytics README, ADR 0020

## Done

- [ ] NL KPI questions return answers from `analytics` read-models, without any write path (ASSIST-ADM-01)
- [ ] Periodic reports on schedule + events with admin configuration (ASSIST-ADM-02)
- [ ] Admin: toggles, limits, `AgentLog` with dialog monitoring (ASSIST-ADM-03)

## Risks

- [ ] **Migrations**: schema change breaks existing data — migration with backfill plan
- [ ] **Domain events**: subscriptions are idempotent (ADR 0009/0016 pattern)
