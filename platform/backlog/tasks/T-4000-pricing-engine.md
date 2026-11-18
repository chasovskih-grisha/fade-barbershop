# T-4000 · Рушій ціноутворення

- **Stage**: M6 (phase 40) · **Tags**: backend, high-risk, marketing · **Complexity**: senior · **Depends on**: T-090, T-152
- **StoryPoints**: 20

## What
Динамічне ціноутворення: time-based (ранок/вечір, будні/вихідні), demand-based (завантаженість > 80% = +10%), segment-based (VIP/новий/студент), service-combo (послуга+послуга = -15%), early-bird/last-minute, A/B Tests цін, цінові правила по локації/барберу, історія змін, аудит.

## Why
Максимізація виручки. Автоматизація yield management. Конкурентність. Дані для рішень.

## Sources
- docs/pricing-engine.md — фантом 2026-09-22: файл ніколи не існував; джерело приймається на старті задачі
- `discounts.md` §Dynamic

## dependencies
> Слайси виділяються при старті задачі; окремі файли підзадач створюються тоді ж за потреби.
