# T-4300c · migration даних expand/contract (8/30)

- **Stage**: M0 (phase 0; виконання — слайс після першого проду) · **Tags**: backend, devops, high-risk · **Complexity**: senior · **Depends on**: T-4300b, T-303
- **StoryPoints**: 8

## What

Якщо до першого прода накопичаться бойові/стейджинг-дані з Int PK — migration expand/contract: Add UUID-колонки, backfill з мапінгом старих→нових ID, подвійна запис, переключення читання, contract (видалення старих колонок). Якщо прода ще none — задача закривається рішенням «нуль бойових даних» і чеклістом перевірки.

## Why

Єдиний Scenario, де UUID-migration може втратити дані. План потрібен до T-303 (перший деплой), не після.

## Sources

- ADR 0021 (UUID Primary Keys, expand/contract)
- `docs/engineering-principles.md` (безпечні міграції)

## Implementation plan

Paths:
- docs/uuid-data-migration.md

Checks:
- pnpm docs:validate

## Done

- [ ] Рішення зафіксоване: або «нуль даних до прода» (перевірено чеклістом), або виконаний expand/contract
- [ ] Backfill-скрипт ідемпотентний, dry-run на копії стейджингу пройдений
- [ ] Rollback-план на кожен крок (expand/switch/contract)

## Risks

- [ ] **Втрата даних**: мапінг старих ID у зовнішніх посиланнях (GET-параметри, PDF) — інвентаризація
- [ ] **Downtime**: подвійна запис замість стоп-Світу; вікно міграції — ніч

## Status

- 2026-11-17: рішення зафіксоване — **нуль бойових даних до першого деплою**. Прод
  не розгорнуто (ADR 0051), T-4614 піднімає сайт/адмінку/API до першої локації з
  порожнім каталогом, тож Int-PK рядків у проді немає. План expand/contract
  лишається як гілка «дані вже є». Процедура, чекліст перевірки, відкат на кожен
  крок і ризики — `docs/uuid-data-migration.md`.
