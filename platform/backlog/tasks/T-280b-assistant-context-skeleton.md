# T-280b · Контекст + агрегат + журнал (Slice 2/4)

- **Stage**: M7 (phase 28) · **Tags**: backend · **Complexity**: middle · **Depends on**: T-042
- **StoryPoints**: 4

## What

Slice 2/4 батьківської T-280: scaffold контексту `assistants` у моноліті, агрегат `AssistantConversation`, журнал `AgentLog`. Структура за зразком інших контекстів (domain/application/infrastructure) — механічна робота для middle.

## Why

Фундамент, на який ставлять слайси 2–4; без каркаса оркестратору нема де жити.

## Sources

- ADR 0020; AC `24-assistants.md` (ASSIST-001)
- engineering-principles.md (шарність контекстів)

## Done

- [ ] Контекст `assistants` у моноліті створено (шарність як в інших контекстів)
- [ ] Агрегат `AssistantConversation` з тестами
- [ ] Журнал `AgentLog` пишеться і читається

## dependencies

- T-280c (оркестратор — наступний Slice)
