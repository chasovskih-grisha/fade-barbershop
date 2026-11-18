# T-171 · Поверхні waitlist

- **Stage**: M4 (phase 17) · **Tags**: frontend · **Complexity**: middle · **Depends on**: T-170
- **StoryPoints**: 5

## What

Клієнт: картка «Повідомити, якщо звільниться» на екрані «none слотів» (WTL-WEB-01), сегмент «Черга» і екран пропозиції з таймером (`client-screens.md` §4); адмін: черги по конфігураціях, пауза, «Дати слот зараз», налаштування (WTL-ADM-01…03, `admin-screens.md` §9); ефективність у дашборді (WTL-ADM-04 — метрика `WaitlistEfficiency`).

## Sources

- `WTL-WEB/MOB/ADM-01…04`; `client-screens.md` §4; `admin-screens.md` §9; analytics README

## Done

- [ ] Усі входи в чергу і екран пропозиції працюють
- [ ] Адмін-керування і метрика ефективності

## Risks

- [ ] **Міграції**: зміна схеми ламає існуючі дані — migration з backfill-планом
- [ ] **Події домену**: підписки ідемпотентні (патерн ADR 0009/0016)

